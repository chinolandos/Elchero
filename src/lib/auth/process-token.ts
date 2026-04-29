/**
 * Process Token — token firmado HMAC-SHA256 de corta vida.
 *
 * Problema que resuelve:
 *   /api/generate-notes acepta cualquier `transcript` del cliente. Sin gate, un
 *   atacante autenticado puede llamar /api/generate-notes 1000 veces con texto
 *   inventado y costar $100+ en tokens de Claude Sonnet, sin tocar el counter
 *   (porque el counter solo se incrementa en /api/process).
 *
 * Solución:
 *   /api/process devuelve un `process_token` firmado que prueba que la
 *   transcripción la generamos nosotros (no la inventó el cliente).
 *   /api/generate-notes valida el token antes de gastar Sonnet.
 *
 * El payload incluye:
 *   - user_id: ata el token a un usuario
 *   - transcript_hash: SHA-256 del texto (impide reusar el token con otro texto)
 *   - exp: expiración 15 minutos (el flow normal tarda <3 min)
 *
 * El secret HMAC viene de PROCESS_TOKEN_SECRET (env var). Si no está, usa
 * SUPABASE_SECRET_KEY como fallback (siempre existe).
 */

import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_SEC = 15 * 60; // 15 minutos

interface TokenPayload {
  uid: string;
  th: string; // transcript hash
  exp: number;
}

function getSecret(): string {
  const s =
    process.env.PROCESS_TOKEN_SECRET ?? process.env.SUPABASE_SECRET_KEY;
  if (!s) {
    throw new Error(
      'No se encontró PROCESS_TOKEN_SECRET ni SUPABASE_SECRET_KEY para firmar tokens.',
    );
  }
  return s;
}

function hashTranscript(transcript: string): string {
  return createHash('sha256').update(transcript, 'utf8').digest('hex');
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(input: string): Buffer {
  const pad = input.length % 4;
  const padded = pad ? input + '='.repeat(4 - pad) : input;
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function sign(payloadB64: string): string {
  return b64url(createHmac('sha256', getSecret()).update(payloadB64).digest());
}

/**
 * Crea token para entregar al cliente desde /api/process.
 */
export function issueProcessToken(userId: string, transcript: string): string {
  const payload: TokenPayload = {
    uid: userId,
    th: hashTranscript(transcript),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC,
  };
  const payloadB64 = b64url(JSON.stringify(payload));
  const sigB64 = sign(payloadB64);
  return `${payloadB64}.${sigB64}`;
}

export interface VerifyResult {
  ok: boolean;
  reason?: 'malformed' | 'invalid_signature' | 'expired' | 'wrong_user' | 'wrong_transcript';
  payload?: TokenPayload;
  /** SHA-256 del token completo. Usar con consume_token_atomic RPC para single-use. */
  tokenHash?: string;
}

/**
 * Hashea el token completo (payload.signature) para guardarlo en
 * `consumed_process_tokens`. Usamos SHA-256 para que el hash sea de longitud
 * fija y no expongamos el secret indirectamente.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/**
 * Verifica token recibido en /api/generate-notes. Valida:
 *   - estructura
 *   - firma HMAC (timingSafeEqual)
 *   - expiración
 *   - user_id coincide
 *   - transcript_hash coincide con el transcript actual
 *
 * Retorna además el `tokenHash` para que el caller pueda hacer el mark-as-consumed
 * atómico (single-use enforcement) sin volver a hashear.
 */
export function verifyProcessToken(
  token: string,
  expectedUserId: string,
  expectedTranscript: string,
): VerifyResult {
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, reason: 'malformed' };
  const [payloadB64, sigB64] = parts;

  const expectedSigB64 = sign(payloadB64);
  const expectedBuf = Buffer.from(expectedSigB64);
  const givenBuf = Buffer.from(sigB64);
  if (
    expectedBuf.length !== givenBuf.length ||
    !timingSafeEqual(expectedBuf, givenBuf)
  ) {
    return { ok: false, reason: 'invalid_signature' };
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString('utf8')) as TokenPayload;
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, reason: 'expired' };
  }
  if (payload.uid !== expectedUserId) {
    return { ok: false, reason: 'wrong_user' };
  }
  if (payload.th !== hashTranscript(expectedTranscript)) {
    return { ok: false, reason: 'wrong_transcript' };
  }

  return { ok: true, payload, tokenHash: hashToken(token) };
}
