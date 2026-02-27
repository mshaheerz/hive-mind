import { parseEnvFile, serializeEnv } from '../../src/utils/envParser';
import { describe, it, expect } from 'vitest';

/**
 * Test Plan for envParser utilities
 * 1. Empty file → empty object
 * 2. File with comments only → empty object
 * 3. File with valid key/value pairs
 * 4. File with quoted values and embedded newlines
 * 5. File with duplicate keys → last one wins
 * 6. File with invalid lines → ignored
 * 7. Serialization round‑trip → original string (ignoring order)
 */

describe('envParser', () => {
  it('parses empty string to empty object', () => {
    const env = parseEnvFile('');
    expect(env).toEqual({});
  });

  it('ignores comments and returns empty object', () => {
    const env = parseEnvFile('# comment\n# another\n');
    expect(env).toEqual({});
  });

  it('parses simple key/value pairs', () => {
    const content = `
      DB_HOST=localhost
      DB_PORT=5432
    `;
    const env = parseEnvFile(content);
    expect(env).toEqual({ DB_HOST: 'localhost', DB_PORT: '5432' });
  });

  it('handles quoted values and newlines inside them', () => {
    const content = `
      TOKEN="abc\\nxyz"
      EMPTY=""
    `;
    const env = parseEnvFile(content);
    expect(env).toEqual({ TOKEN: 'abc\nxyz', EMPTY: '' });
  });

  it('last duplicate key wins', () => {
    const content = `
      KEY=first
      KEY=second
    `;
    const env = parseEnvFile(content);
    expect(env).toEqual({ KEY: 'second' });
  });

  it('ignores malformed lines', () => {
    const content = `
      VALID=ok
      INVALID_LINE
      ANOTHER=good
    `;
    const env = parseEnvFile(content);
    expect(env).toEqual({ VALID: 'ok', ANOTHER: 'good' });
  });

  it('round‑trips through serializeEnv', () => {
    const env = { A: '1', B: 'two', C: 'three\nfour' };
    const str = serializeEnv(env);
    const parsed = parseEnvFile(str);
    expect(parsed).toEqual(env);
  });
});
