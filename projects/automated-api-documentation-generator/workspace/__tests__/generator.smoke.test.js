/**
 * Minimal smoke test that verifies the generator can run
 * with a very small configuration and produces a non‑empty
 * string. Useful when the full implementation is not yet
 * available or when running CI on a fresh clone.
 */
import { generateDocumentation } from '../index.js';

describe('Smoke test', () => {
  it('produces documentation for a minimal config', () => {
    const minimalConfig = {
      endpoints: [
        {
          method: 'GET',
          path: '/health',
          description: 'Health check',
          responses: [{ status: 200, description: 'OK', schema: {} }],
        },
      ],
    };
    const docs = generateDocumentation(minimalConfig);
    expect(typeof docs).toBe('string');
    expect(docs.length).toBeGreaterThan(0);
  });
});
