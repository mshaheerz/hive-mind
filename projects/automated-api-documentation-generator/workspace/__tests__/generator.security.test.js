/**
 * Security‑specific tests to ensure the generator does not leak
 * sensitive information such as environment variables or secrets.
 */
import { generateDocumentation } from '../index.js';

describe('Security: Sensitive data handling', () => {
  // Simulate a config that contains environment variables
  const apiConfig = {
    endpoints: [
      {
        method: 'GET',
        path: '/config',
        description: 'Expose config',
        responses: [
          {
            status: 200,
            description: 'OK',
            schema: { type: 'object', properties: { env: { type: 'string' } } },
          },
        ],
        env: process.env,
      },
    ],
  };

  it('does not include raw environment variables in output', () => {
    const docs = generateDocumentation(apiConfig);
    Object.keys(process.env).forEach((key) => {
      const value = process.env[key];
      expect(docs).not.toContain(value);
      // Also ensure the key name itself is not exposed if it's sensitive
      if (/^SECRET_|^TOKEN_|^API_KEY_/i.test(key)) {
        expect(docs).not.toContain(key);
      }
    });
  });

  // Check that the generator sanitizes user‑supplied secrets
  it('removes fields named `secret` or `password`', () => {
    const config = {
      endpoints: [
        {
          method: 'POST',
          path: '/login',
          description: 'Login',
          responses: [{ status: 200, description: 'OK', schema: {} }],
          secret: 'supersecret',
          password: 'mypassword',
        },
      ],
    };
    const docs = generateDocumentation(config);
    expect(docs).not.toContain('secret');
    expect(docs).not.toContain('password');
    expect(docs).not.toContain('supersecret');
    expect(docs).not.toContain('mypassword');
  });
});
