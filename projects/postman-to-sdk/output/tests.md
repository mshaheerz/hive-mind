Below is a **complete, self‑contained test‑suite** for the parts of the repository that are visible in the prompt (the configuration module and the Zod schemas).  
All tests are written with **Vitest** (you can swap to Jest if you prefer – the API is almost identical).  
The suite covers every exported value, every edge‑case the Zod schemas are designed to guard against, and a few “security‑style” checks that the project advertises (e.g. the API key never shows up in an error).

> **How to run the tests**  
> ```bash
> npm install  # installs Vitest + its TS support
> npx vitest run
> ```
> The `package.json` test script is updated to run the test runner automatically.

---

## 1️⃣  `src/config.ts` – unit tests

```ts
// tests/config.test.ts
import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_LANGUAGES,
  HTTP_TIMEOUT_MS,
  MAX_RETRIES,
  RETRY_BACKOFF_MS,
  OUTPUT_ROOT,
  OPENAPI_GENERATOR_CLI,
} from '../src/config';

describe('config constants', () => {
  it('should expose the supported languages tuple', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['typescript', 'python', 'go']);
  });

  it('should be a readonly tuple', () => {
    // @ts-expect-error – tuple is read‑only
    SUPPORTED_LANGUAGES[0] = 'java';
  });

  it('should expose sane defaults', () => {
    expect(HTTP_TIMEOUT_MS).toBe(10_000);
    expect(MAX_RETRIES).toBe(4);
    expect(RETRY_BACKOFF_MS).toBe(500);
  });

  it('should resolve to an absolute path', () => {
    expect(OUTPUT_ROOT).toMatch(
      new RegExp(`^${process.cwd()}${/\/|\\/.+generated-sdks/.source}$`)
    );
  });

  it('should point to the bundled cli.js of openapi-generator', () => {
    expect(OPENAPI_GENERATOR_CLI).toMatch(/@openapitools\/openapi-generator-cli.*cli\.js$/);
  });
});
```

> **Pass/fail criteria** – All assertions must pass.  
> **Done** – The constants are exported correctly and match the expectations above.

---

## 2️⃣  `src/types.ts` – schema tests

```ts
// tests/types.test.ts
import { describe, it, expect } from 'vitest';
import {
  UrlSchema,
  RequestSchema,
  ItemSchema,
  // If you extend the schema, export the helpers here
} from '../src/types';

// Helper that checks if a schema throws on invalid data
const expectToThrow = (schema: any, data: any, msg: string) => {
  expect(() => schema.parse(data)).toThrowError(msg);
};

describe('UrlSchema', () => {
  it('accepts minimal valid object', () => {
    const data = { raw: 'https://api.example.com/users/1' };
    const parsed = UrlSchema.parse(data);
    expect(parsed).toEqual(data);
  });

  it('requires raw string', () => {
    expectToThrow(UrlSchema, { path: '/foo' }, /required/);
  });

  it('accepts optional path', () => {
    const data = { raw: 'https://api.example.com', path: '/users/:id' };
    const parsed = UrlSchema.parse(data);
    expect(parsed.path).toBe('/users/:id');
  });

  it('accepts empty query array', () => {
    const data = { raw: 'https://api.example.com', query: [] };
    const parsed = UrlSchema.parse(data);
    expect(parsed.query).toEqual([]);
  });

  it('rejects query items missing key/value', () => {
    const data = {
      raw: 'https://api.example.com',
      query: [{ key: 'q' }], // missing value
    };
    expectToThrow(UrlSchema, data, /required/);
  });

  it('rejects non‑string raw', () => {
    const data = { raw: 123 };
    expectToThrow(UrlSchema, data, /string/);
  });
});

describe('RequestSchema', () => {
  const base = {
    method: 'GET',
    url: { raw: 'https://api.example.com' },
  };

  it('accepts minimal valid request', () => {
    const parsed = RequestSchema.parse(base);
    expect(parsed).toEqual(base);
  });

  it('validates allowed HTTP methods', () => {
    const bad = { ...base, method: 'TRACE' as any };
    expectToThrow(RequestSchema, bad, /Invalid enum value/);
  });

  it('accepts empty headers', () => {
    const data = { ...base, header: [] };
    const parsed = RequestSchema.parse(data);
    expect(parsed.header).toEqual([]);
  });

  it('rejects header array with non‑object', () => {
    const data = { ...base, header: [123] };
    expectToThrow(RequestSchema, data, /Expected object/);
  });

  it('accepts body in raw mode', () => {
    const data = {
      ...base,
      body: { mode: 'raw', raw: '{"foo":"bar"}' },
    };
    const parsed = RequestSchema.parse(data);
    expect(parsed.body).toMatchObject({ mode: 'raw', raw: '{"foo":"bar"}' });
  });

  it('rejects unsupported body mode', () => {
    const data = {
      ...base,
      body: { mode: 'unsupported' as any },
    };
    expectToThrow(RequestSchema, data, /Invalid enum value/);
  });

  it('rejects body.raw when mode is not raw', () => {
    const data = {
      ...base