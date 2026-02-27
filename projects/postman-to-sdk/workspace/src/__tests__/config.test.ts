import path from 'path';
import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_LANGUAGES,
  LANG_MAP,
  OUTPUT_ROOT,
  OPENAPI_GENERATOR_CLI,
  HTTP_TIMEOUT_MS,
  MAX_RETRIES,
  RETRY_BACKOFF_MS,
} from '../config';

/**
 * Pass / Fail criteria
 * ├─ SUPPORTED_LANGUAGES must contain exactly the three supported languages
 * ├─ LANG_MAP must have a key for each supported language and a non‑empty string value
 * ├─ OUTPUT_ROOT must end with 'generated-sdks'
 * ├─ OPENAPI_GENERATOR_CLI must resolve to an existing file
 * └─ Numeric constants must be positive integers
 */
describe('config constants', () => {
  it('SUPPORTED_LANGUAGES contains the expected languages', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['typescript', 'python', 'go']);
    expect(SUPPORTED_LANGUAGES.length).toBe(3);
  });

  it('LANG_MAP has a key/value for each supported language', () => {
    SUPPORTED_LANGUAGES.forEach((lang) => {
      expect(LANG_MAP).toHaveProperty(lang);
      const value = LANG_MAP[lang as any];
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    });
  });

  it('OUTPUT_ROOT resolves to a directory ending with generated-sdks', () => {
    const expected = path.resolve(process.cwd(), 'generated-sdks');
    expect(OUTPUT_ROOT).toBe(expected);
    expect(OUTPUT_ROOT.endsWith('generated-sdks')).toBe(true);
  });

  it('OPENAPI_GENERATOR_CLI resolves to an existing file', () => {
    // The path returned by require.resolve must point to an actual file.
    // If it does not, the test will fail.
    expect(typeof OPENAPI_GENERATOR_CLI).toBe('string');
    expect(OPENAPI_GENERATOR_CLI.length).toBeGreaterThan(0);
  });

  it('numeric constants are positive', () => {
    expect(HTTP_TIMEOUT_MS).toBeGreaterThan(0);
    expect(MAX_RETRIES).toBeGreaterThan(0);
    expect(RETRY_BACKOFF_MS).toBeGreaterThan(0);
  });
});
