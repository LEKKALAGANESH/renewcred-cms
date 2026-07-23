import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { EnvironmentError, isPlaceholder, parseEnv } from './index.js';

const schema = z.object({
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().int().positive().default(4000),
});

describe('parseEnv', () => {
  it('returns typed config when every variable is valid', () => {
    const env = parseEnv(schema, { JWT_SECRET: 'a'.repeat(32), PORT: '5000' });
    expect(env).toEqual({ JWT_SECRET: 'a'.repeat(32), PORT: 5000 });
  });

  it('applies defaults for optional variables', () => {
    const env = parseEnv(schema, { JWT_SECRET: 'a'.repeat(32) });
    expect(env.PORT).toBe(4000);
  });

  it('throws when a required secret is missing rather than falling back', () => {
    expect(() => parseEnv(schema, {})).toThrow(EnvironmentError);
  });

  it('throws when a secret is present but too weak', () => {
    expect(() => parseEnv(schema, { JWT_SECRET: 'short' })).toThrow(EnvironmentError);
  });

  it('names every offending variable in the message', () => {
    try {
      parseEnv(schema, { PORT: 'not-a-number' });
      expect.unreachable('should have thrown');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('JWT_SECRET');
      expect(message).toContain('PORT');
    }
  });
});

describe('isPlaceholder', () => {
  it.each(['changeme', 'xxxxxxxx', 'your-secret-here', 'TODO', 'placeholder'])(
    'rejects %s',
    (value) => {
      expect(isPlaceholder(value)).toBe(true);
    }
  );

  it('accepts a real-looking secret', () => {
    expect(isPlaceholder('8f3c1a9be27d4056')).toBe(false);
  });
});
