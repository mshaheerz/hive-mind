/**
 * Unit tests for the API documentation generator.
 * These tests assume that `index.js` exports a function called
 * `generateDocumentation` that accepts an `apiConfig` object and
 * returns a string containing the generated documentation.
 */
import { generateDocumentation } from '../index.js';

describe('generateDocumentation', () => {
  // Basic happy‑path test
  it('generates docs for a single endpoint', () => {
    const apiConfig = {
      endpoints: [
        {
          method: 'GET',
          path: '/users',
          description: 'Retrieve all users',
          responses: [
            { status: 200, description: 'Success', schema: {} },
          ],
        },
      ],
    };
    const docs = generateDocumentation(apiConfig);
    expect(typeof docs).toBe('string');
    expect(docs).toContain('/users');
    expect(docs).toContain('Retrieve all users');
  });

  // Edge case: empty configuration
  it('returns an empty string when no endpoints are provided', () => {
    const apiConfig = { endpoints: [] };
    const docs = generateDocumentation(apiConfig);
    expect(docs).toBe('');
  });

  // Edge case: null or undefined config
  it('throws a descriptive error when config is null', () => {
    expect(() => generateDocumentation(null)).toThrow(
      /API configuration must be a non‑null object/i,
    );
  });

  // Edge case: missing required fields
  it('throws an error when an endpoint lacks a required field', () => {
    const apiConfig = {
      endpoints: [
        { method: 'GET', path: '/users' }, // missing description
      ],
    };
    expect(() => generateDocumentation(apiConfig)).toThrow(
      /description is required/i,
    );
  });

  // Edge case: extremely large number of endpoints
  it('handles a large endpoint list without crashing', () => {
    const endpoints = Array.from({ length: 1000 }, (_, i) => ({
      method: 'GET',
      path: `/resource/${i}`,
      description: `Resource ${i}`,
      responses: [{ status: 200, description: 'OK', schema: {} }],
    }));
    const apiConfig = { endpoints };
    const docs = generateDocumentation(apiConfig);
    expect(typeof docs).toBe('string');
    // Ensure the output contains a sample endpoint
    expect(docs).toContain('/resource/999');
  });

  // Edge case: special characters in descriptions
  it('escapes or preserves special characters correctly', () => {
    const apiConfig = {
      endpoints: [
        {
          method: 'POST',
          path: '/submit',
          description: 'Submit data & receive a response',
          responses: [
            { status: 201, description: 'Created', schema: {} },
          ],
        },
      ],
    };
    const docs = generateDocumentation(apiConfig);
    expect(docs).toContain('Submit data & receive a response');
  });

  // Security test: no sensitive data leaked
  it('does not expose internal API keys or secrets', () => {
    const apiConfig = {
      endpoints: [
        {
          method: 'GET',
          path: '/secret',
          description: 'Secret endpoint',
          responses: [
            { status: 200, description: 'OK', schema: {} },
          ],
          // Intentionally adding a secret field to test filtering
          secretKey: '12345',
        },
      ],
    };
    const docs = generateDocumentation(apiConfig);
    expect(docs).not.toContain('secretKey');
    expect(docs).not.toContain('12345');
  });
});
