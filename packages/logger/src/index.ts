// Named import, not default: pino ships CJS, and under NodeNext resolution the
// default import resolves to the module namespace rather than the callable.
import {
  pino,
  stdTimeFunctions,
  type DestinationStream,
  type Logger,
  type LoggerOptions,
} from 'pino';

/**
 * Field names whose values are replaced with `[Redacted]` before a log line is
 * written. This list is the enforcement point for "never log PII or secrets" —
 * relying on call sites to remember is how credentials end up in log
 * aggregators.
 */
const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.currentPassword',
  'req.body.newPassword',
  'req.body.token',
  'res.headers["set-cookie"]',
  'password',
  'passwordHash',
  'accessToken',
  'refreshToken',
  'refreshTokenHash',
  'jwt',
  'token',
  'secret',
  'apiKey',
  'serviceRoleKey',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'DATABASE_URL',
  'DIRECT_URL',
  '*.password',
  '*.accessToken',
  '*.refreshToken',
  '*.token',
  '*.secret',
];

export type LogEvent =
  /* Auth — every one of these is a security-relevant event. */
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.logout'
  | 'auth.refresh.success'
  | 'auth.refresh.reuse_detected'
  | 'auth.token.expired'
  | 'auth.forbidden'
  /* Request lifecycle. */
  | 'request.start'
  | 'request.complete'
  | 'request.error'
  /* Validation — high volume, so logged at debug unless it is a 5xx. */
  | 'validation.failure'
  /* Content mutations — the audit trail. */
  | 'content.version.published'
  | 'content.version.restored'
  | 'content.asset.uploaded';

export interface CreateLoggerOptions {
  level?: LoggerOptions['level'];
  /** Pretty-prints in development; emits newline-delimited JSON otherwise. */
  pretty?: boolean;
  /** Included on every line so logs from all three apps stay attributable. */
  service: string;
  /**
   * Where to write. Defaults to stdout. Injected by tests so they assert
   * against the real REDACTED_PATHS above rather than a duplicate of it —
   * a redaction test that reimplements the config proves nothing.
   */
  destination?: DestinationStream;
}

export function createLogger({ level, pretty, service, destination }: CreateLoggerOptions): Logger {
  const options: LoggerOptions = {
    level: level ?? process.env.LOG_LEVEL ?? 'info',
    base: { service },
    redact: { paths: REDACTED_PATHS, censor: '[Redacted]' },
    formatters: {
      // Emit `"level":"info"` rather than `"level":30` — grep-able by humans.
      level: (label: string) => ({ level: label }),
    },
    timestamp: stdTimeFunctions.isoTime,
    ...(pretty && !destination
      ? { transport: { target: 'pino-pretty', options: { colorize: true, singleLine: true } } }
      : {}),
  };

  return destination ? pino(options, destination) : pino(options);
}

/**
 * Fields every log line should carry so a request can be reconstructed from
 * logs alone. `userId` is a real id, not an email — the blueprint forbids PII
 * in logs, and an id is sufficient to correlate.
 */
export interface LogContext {
  event: LogEvent;
  requestId: string;
  userId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
}
