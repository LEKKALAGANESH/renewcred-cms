import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createLogger } from './index.js';

/**
 * Builds a logger writing to an in-memory stream. Because the destination is
 * injected into the real `createLogger`, these tests exercise the actual
 * REDACTED_PATHS list — not a copy of it that could drift out of sync.
 */
function loggerWithCapture() {
  const chunks: string[] = [];
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(String(chunk));
      callback();
    },
  });

  const logger = createLogger({ service: 'test', level: 'debug', destination });
  const entries = () =>
    chunks
      .join('')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);

  return { logger, entries, raw: () => chunks.join('') };
}

describe('createLogger', () => {
  it('tags every line with the service name', () => {
    const { logger, entries } = loggerWithCapture();
    logger.info({ event: 'request.start' }, 'started');
    expect(entries()[0]?.service).toBe('test');
  });

  it('emits the level as a readable label, not a number', () => {
    const { logger, entries } = loggerWithCapture();
    logger.info('hello');
    expect(entries()[0]?.level).toBe('info');
  });

  it('honours an explicit level', () => {
    expect(createLogger({ service: 'api', level: 'warn' }).level).toBe('warn');
  });
});

describe('redaction', () => {
  const SECRET = 'super-secret-value-do-not-log';

  it.each(['password', 'passwordHash', 'accessToken', 'refreshToken', 'refreshTokenHash'])(
    'redacts a top-level %s',
    (field) => {
      const { logger, entries, raw } = loggerWithCapture();
      logger.info({ [field]: SECRET }, 'auth.login.success');

      expect(entries()[0]?.[field]).toBe('[Redacted]');
      expect(raw()).not.toContain(SECRET);
    }
  );

  it('redacts the authorization header', () => {
    const { logger, raw } = loggerWithCapture();
    logger.info({ req: { headers: { authorization: `Bearer ${SECRET}` } } }, 'request.start');

    expect(raw()).not.toContain(SECRET);
    expect(raw()).toContain('[Redacted]');
  });

  it('redacts the cookie header, which carries the refresh token', () => {
    const { logger, raw } = loggerWithCapture();
    logger.info({ req: { headers: { cookie: `refresh=${SECRET}` } } }, 'request.start');

    expect(raw()).not.toContain(SECRET);
  });

  it('redacts a password nested in a request body', () => {
    const { logger, raw } = loggerWithCapture();
    logger.info({ req: { body: { email: 'a@b.com', password: SECRET } } }, 'auth.login.failure');

    expect(raw()).not.toContain(SECRET);
    expect(raw()).toContain('a@b.com');
  });

  it.each([
    'serviceRoleKey',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'jwt',
    'token',
    'secret',
    'apiKey',
  ])('redacts %s', (field) => {
    const { logger, raw } = loggerWithCapture();
    logger.error({ [field]: SECRET }, 'request.error');

    expect(raw()).not.toContain(SECRET);
  });

  it('redacts DATABASE_URL, which embeds the database password', () => {
    const { logger, raw } = loggerWithCapture();
    logger.info(
      { DATABASE_URL: `postgresql://postgres:${SECRET}@host:6543/postgres` },
      'request.start'
    );

    expect(raw()).not.toContain(SECRET);
  });

  it('leaves non-sensitive fields intact', () => {
    const { logger, entries } = loggerWithCapture();
    logger.info({ userId: 'user-123', event: 'auth.login.success', password: SECRET }, 'signed in');

    const entry = entries()[0];
    expect(entry?.userId).toBe('user-123');
    expect(entry?.event).toBe('auth.login.success');
    expect(entry?.password).toBe('[Redacted]');
  });
});
