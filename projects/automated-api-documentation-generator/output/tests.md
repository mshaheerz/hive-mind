**File: `__tests__/generator.unit.test.js`**
```js
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
```

---

**File: `__tests__/generator.integration.test.js`**
```js
/**
 * Integration test that exercises the full generation pipeline.
 * It writes a temporary JSON file, runs the generator,
 * and verifies the output file contains expected sections.
 */
import { generateDocumentation } from '../index.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Integration: Documentation Generation', () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'api-doc-'));

  const apiConfig = {
    endpoints: [
      {
        method: 'GET',
        path: '/users',
        description: 'Get users',
        responses: [{ status: 200, description: 'OK', schema: {} }],
      },
      {
        method: 'POST',
        path: '/users',
        description: 'Create user',
        responses: [{ status: 201, description: 'Created', schema: {} }],
      },
    ],
  };

  const outputPath = path.join(tmpDir, 'API.md');

  beforeAll(async () => {
    // Simulate the generator writing to a file
    const docs = generateDocumentation(apiConfig);
    await fs.writeFile(outputPath, docs, 'utf8');
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('creates a markdown file with the correct header', async () => {
    const content = await fs.readFile(outputPath, 'utf8');
    expect(content).toMatch(/^# API Documentation/);
  });

  it('includes all endpoint paths', async () => {
    const content = await fs.readFile(outputPath, 'utf8');
    expect(content).toContain('/users');
  });

  it('includes HTTP methods in uppercase', async () => {
    const content = await fs.readFile(outputPath, 'utf8');
    expect(content).toContain('GET');
    expect(content).toContain('POST');
  });

  it('handles missing optional fields gracefully', async () => {
    const badConfig = {
      endpoints: [
        {
          method: 'GET',
          path: '/missing',
          // No description
          responses: [{ status: 404, description: 'Not Found', schema: {} }],
        },
      ],
    };
    const docs = generateDocumentation(badConfig);
    expect(docs).toContain('/missing');
    expect(docs).toContain('Not Found');
    // The generator should not crash or omit the endpoint entirely
  });
});
```

---

**File: `__tests__/generator.security.test.js`**
```js
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
```

---

**File: `__tests__/generator.smoke.test.js`**
```js
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
```

---

**File: `jest.config.js`**
```js
/**
 * Jest configuration file to support ESM modules and
 * to customize test paths if needed.
 */
export default {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json'],
  transform: {},
  testMatch: ['**/__tests__/**/*.test.js'],
};
```

---

## Test Plan (Manual)

| Scenario | Description | Expected Outcome |
|----------|-------------|------------------|
| **1. Basic Generation** | Run generator with a simple API config containing 2 endpoints. | Markdown file contains both endpoints, correct headers, and proper HTTP methods. |
| **2. Empty Config** | Provide `{ endpoints: [] }`. | Output is an empty string or a header only; no errors. |
| **3. Null/Undefined Config** | Pass `null` or `undefined`. | Generator throws a clear error message about invalid input. |
| **4. Large Endpoint List** | Use 10,000 endpoints. | Generator completes within reasonable time (<5 s) and no crashes. |
| **5. Special Characters** | Descriptions contain emojis, non‑ASCII, and Markdown‑reserved chars. | Output preserves these characters without escaping errors. |
| **6. Missing Required Fields** | Omit `method` or `path`. | Generator throws an error indicating the missing field. |
| **7. Security** | Include fields like `secretKey`, `password`, or environment variables. | Output does **not** contain any of these values or keys. |
| **8. Integration with CI** | Run `npm test` in a CI pipeline. | All tests pass, coverage ≥ 80 %. |
| **9. Performance** | Measure generation time for 1,000 endpoints. | Time < 2 s on a CI runner. |
| **10. Error Handling** | Pass malformed JSON to the generator. | Generator throws a parsing error with a helpful message. |

---

**TEST_COMMAND:** `npm test`

**EXPECTED_RESULT:**  
All Jest test suites (`generator.unit.test.js`, `generator.integration.test.js`, `generator.security.test.js`, `generator.smoke.test.js`) should pass without any failures. The test output should look similar to:

```
 PASS  __tests__/generator.unit.test.js
 PASS  __tests__/generator.integration.test.js
 PASS  __tests__/generator.security.test.js
 PASS  __tests__/generator.smoke.test.js

Test Suites: 4 passed, 4 total
Tests:       20 passed, 20 total
```

**FAILURE_ACTION_ITEMS:**
- If any unit test fails, inspect the corresponding function in `index.js` and adjust logic or error handling.
- If integration tests fail, verify file I/O paths and ensure the generator writes to the expected location.
- If security tests fail, add sanitization logic to strip or mask sensitive fields before output.
- If performance tests exceed thresholds, optimize data structures or caching in the generator.
- If coverage drops below 80 %, add missing branch coverage tests or refactor for testability.