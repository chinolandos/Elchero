/**
 * Test end-to-end del backend de Chero.
 *
 * Llama directamente las funciones lib (sin pasar por API routes ni auth).
 * Usalo para verificar que el motor (transcribe + detect + generate-notes + tts)
 * funciona ANTES de construir el frontend.
 *
 * USO:
 *   1. Grabá un audio de 30s-2min en español hablando de cualquier tema académico
 *      (ej: "Hoy en clase de Matemática vimos derivadas...")
 *   2. Guardalo como `scripts/test-audio.mp3` (o cambiá la ruta abajo)
 *   3. Corré: npx tsx scripts/test-flow.ts
 *   4. Mirá el output en consola
 *
 * COSTO POR RUN:
 *   - Whisper: ~$0.003/min × duración
 *   - Claude Haiku detect: ~$0.0005
 *   - Claude Sonnet generate: ~$0.20 (con cache miss primera vez, ~$0.15 con cache hit)
 *   - OpenAI TTS: ~$0.05
 *   - Total: ~$0.26 por test completo
 */

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { transcribeAudio } from '../src/lib/openai/transcribe';
import { detectContext } from '../src/lib/anthropic/detect';
import { generateNotes } from '../src/lib/anthropic/generate';
import { generateTts, buildTtsText } from '../src/lib/openai/tts';
import type { UserProfile } from '../src/lib/types/chero';

// Config: cambiá estos valores si querés probar con otro audio o perfil
const AUDIO_PATH = join(process.cwd(), 'scripts', 'test-audio.mp3');
const OUTPUT_DIR = join(process.cwd(), 'scripts', 'test-output');

const FAKE_PROFILE: Partial<UserProfile> = {
  user_type: 'universitario',
  institution: 'ESEN',
  career: 'Ingeniería de Software y Negocios Digitales',
  year: 3,
  subjects: ['Microeconomía', 'Estadística', 'Bases de Datos', 'Cálculo II'],
  preferred_voice: 'nova',
};

async function main() {
  console.log('🐎 Test end-to-end del backend de Chero\n');
  console.log(`Audio: ${AUDIO_PATH}`);

  // 1. Verificar que el audio exista
  if (!existsSync(AUDIO_PATH)) {
    console.error(`\n❌ ERROR: no existe el archivo ${AUDIO_PATH}`);
    console.error(
      '   Grabá un audio (30s-2min, español, tema académico) y guardalo ahí.\n',
    );
    console.error('   Sugerencia para grabar:');
    console.error('   - Voice Memos en celular → exportar como mp3');
    console.error('   - Audacity en compu → File → Export → MP3');
    console.error('   - Online: https://online-voice-recorder.com\n');
    process.exit(1);
  }

  const audioBuffer = readFileSync(AUDIO_PATH);
  const audioFile = new File([audioBuffer], 'test-audio.mp3', {
    type: 'audio/mpeg',
  });

  console.log(`Tamaño: ${(audioFile.size / 1024).toFixed(1)} KB`);

  // 2. Transcribir
  console.log('\n📝 1/4 Transcribiendo con GPT-4o Mini Transcribe...');
  const t0 = Date.now();
  const transcript = await transcribeAudio(audioFile);
  console.log(`   ✓ Hecho en ${Date.now() - t0}ms`);
  console.log(`   Duración: ${transcript.durationMinutes.toFixed(1)} min`);
  console.log(`   Costo: $${transcript.costUsd.toFixed(4)}`);
  console.log(`   Texto (${transcript.text.length} chars):`);
  console.log(`   "${transcript.text.slice(0, 200)}${transcript.text.length > 200 ? '...' : ''}"`);

  // 3. Detectar contexto
  console.log('\n🎯 2/4 Detectando contexto con Claude Haiku...');
  const t1 = Date.now();
  const detected = await detectContext(transcript.text.slice(0, 2000), FAKE_PROFILE);
  console.log(`   ✓ Hecho en ${Date.now() - t1}ms`);
  console.log(`   Modo: ${detected.mode}`);
  console.log(`   Materia: ${detected.subject}`);
  console.log(`   Institución: ${detected.institution ?? 'N/A'}`);
  console.log(`   Tema: ${detected.topic}`);
  console.log(`   Confianza: ${detected.confidence}/100`);

  // 4. Generar apunte
  console.log('\n✨ 3/4 Generando apunte con Claude Sonnet 4.6 + KB cacheado...');
  const t2 = Date.now();
  const generated = await generateNotes({
    transcript: transcript.text,
    detected,
    profile: FAKE_PROFILE,
  });
  console.log(`   ✓ Hecho en ${Date.now() - t2}ms`);
  console.log(`   Cache hit: ${generated.cache_hit ? '✅ SÍ' : '❌ NO (primera vez)'}`);
  console.log(`   Input tokens: ${generated.input_tokens.toLocaleString()}`);
  console.log(`   Cache read: ${generated.cache_read_tokens.toLocaleString()}`);
  console.log(`   Cache write: ${generated.cache_write_tokens.toLocaleString()}`);
  console.log(`   Output tokens: ${generated.output_tokens.toLocaleString()}`);
  console.log(`   Costo: $${generated.cost_usd.toFixed(4)}`);

  // 5. TTS (resumen + conceptos + repaso 30s)
  console.log('\n🎧 4/4 Generando TTS con OpenAI Nova...');
  const t3 = Date.now();
  const ttsText = buildTtsText({
    summary: generated.note.summary,
    concepts: generated.note.concepts,
    quick_review: generated.note.quick_review,
  });
  const tts = await generateTts({ text: ttsText, voice: 'nova' });
  console.log(`   ✓ Hecho en ${Date.now() - t3}ms`);
  console.log(`   Chars: ${tts.charsUsed}`);
  console.log(`   Duración estimada: ${tts.durationEstimateSeconds.toFixed(1)}s`);
  console.log(`   Costo: $${tts.costUsd.toFixed(4)}`);

  // 6. Guardar outputs
  console.log('\n💾 Guardando outputs en scripts/test-output/...');
  const fs = await import('node:fs');
  if (!existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  writeFileSync(
    join(OUTPUT_DIR, 'transcript.txt'),
    transcript.text,
  );
  writeFileSync(
    join(OUTPUT_DIR, 'note.json'),
    JSON.stringify(generated.note, null, 2),
  );
  writeFileSync(
    join(OUTPUT_DIR, 'note.md'),
    formatNoteAsMarkdown(generated.note, detected),
  );
  writeFileSync(
    join(OUTPUT_DIR, 'audio.mp3'),
    Buffer.from(tts.audio),
  );

  // 7. Resumen final
  const totalCost =
    transcript.costUsd + 0.0005 + generated.cost_usd + tts.costUsd;
  const totalMs = Date.now() - t0;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 TEST COMPLETO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Tiempo total: ${(totalMs / 1000).toFixed(1)}s`);
  console.log(`Costo total: $${totalCost.toFixed(4)}`);
  console.log('\nArchivos generados:');
  console.log(`  - scripts/test-output/transcript.txt`);
  console.log(`  - scripts/test-output/note.json`);
  console.log(`  - scripts/test-output/note.md   ← abrí esto para ver el apunte`);
  console.log(`  - scripts/test-output/audio.mp3 ← reproducí esto para escuchar TTS`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

function formatNoteAsMarkdown(
  note: Awaited<ReturnType<typeof generateNotes>>['note'],
  detected: Awaited<ReturnType<typeof detectContext>>,
): string {
  const lines: string[] = [];
  lines.push(`# Apunte — ${detected.subject}`);
  lines.push('');
  lines.push(`> **Modo:** ${detected.mode} · **Institución:** ${detected.institution ?? 'N/A'} · **Tema:** ${detected.topic}`);
  lines.push('');
  lines.push('## 🎯 Resumen ejecutivo');
  lines.push('');
  lines.push(note.summary);
  lines.push('');
  lines.push('## 📚 Conceptos clave');
  lines.push('');
  for (const c of note.concepts) {
    lines.push(`### ${c.name}`);
    lines.push(c.definition);
    lines.push('');
    lines.push(`*Ejemplo:* ${c.example}`);
    lines.push('');
  }
  lines.push('## ❓ Preguntas tipo examen');
  lines.push('');
  note.questions.forEach((q, i) => {
    lines.push(`### ${i + 1}. ${q.prompt}`);
    if (q.options) {
      q.options.forEach((opt) => lines.push(`- ${opt}`));
    }
    if (q.correct) lines.push(`\n**Respuesta correcta:** ${q.correct}`);
    lines.push(`\n*Justificación:* ${q.justification}`);
    lines.push('');
  });
  lines.push('## 🧠 Flashcards');
  lines.push('');
  note.flashcards.forEach((f, i) => {
    lines.push(`**${i + 1}.** _${f.front}_`);
    lines.push(`→ ${f.back}`);
    lines.push('');
  });
  lines.push('## 📝 Repaso de 30 segundos');
  lines.push('');
  lines.push(note.quick_review);
  lines.push('');
  if (note.mermaid_chart) {
    lines.push('## 🗺️ Mapa mental');
    lines.push('');
    lines.push('```mermaid');
    lines.push(note.mermaid_chart);
    lines.push('```');
  }
  return lines.join('\n');
}

main().catch((err) => {
  console.error('\n❌ Test falló:', err);
  process.exit(1);
});
