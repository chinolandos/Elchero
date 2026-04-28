/**
 * Logger estructurado simple para Chero.
 *
 * En Vercel, todos los console.* van a Logs. Este helper agrega prefijos
 * consistentes y timestamps para que sea fácil filtrar por contexto.
 *
 * En el futuro: cambiar implementación interna a Sentry / Logtail / Axiom
 * sin tocar callsites.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

function log(
  level: LogLevel,
  scope: string,
  message: string,
  context?: LogContext,
): void {
  const timestamp = new Date().toISOString();
  const prefix = `[chero][${scope}]`;

  const payload =
    context && Object.keys(context).length > 0
      ? `${message} ${JSON.stringify(context)}`
      : message;

  const line = `${timestamp} ${prefix} ${payload}`;

  switch (level) {
    case 'debug':
      if (process.env.NODE_ENV !== 'production') console.debug(line);
      break;
    case 'info':
      console.log(line);
      break;
    case 'warn':
      console.warn(line);
      break;
    case 'error':
      console.error(line);
      break;
  }
}

export function createLogger(scope: string) {
  return {
    debug: (msg: string, ctx?: LogContext) => log('debug', scope, msg, ctx),
    info: (msg: string, ctx?: LogContext) => log('info', scope, msg, ctx),
    warn: (msg: string, ctx?: LogContext) => log('warn', scope, msg, ctx),
    error: (msg: string, ctx?: LogContext) => log('error', scope, msg, ctx),
  };
}
