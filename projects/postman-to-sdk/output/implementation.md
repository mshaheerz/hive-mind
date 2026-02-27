**File: `package.json`**
```json
{
  "name": "postman-to-sdk",
  "version": "0.1.0",
  "description": "CLI that generates fully‑typed SDKs from Postman collections",
  "main": "dist/index.js",
  "bin": {
    "postman-to-sdk": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint . --ext .ts",
    "test": "echo \"No tests yet\""
  },
  "keywords": [
    "postman",
    "sdk",
    "generator",
    "openapi",
    "cli"
  ],
  "author": "FORGE",
  "license": "MIT",
  "dependencies": {
    "@openapitools/openapi-generator-cli": "^2.6.0",
    "axios": "^1.7.2",
    "axios-retry": "^3.8.1",
    "commander": "^12.0.0",
    "fs-extra": "^11.2.0",
    "openapi-types": "^12.1.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "eslint": "^9.5.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.2.1",
    "prettier": "^3.2.5",
    "ts-node": "^10.9.2",
    "typescript": "^5.6.3"
  }
}
```

**File: `tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

**File: `.gitignore`**
```
/dist
/node_modules
*.log
.env
```

**File: `README.md`**
```markdown
# Postman‑to‑SDK

A tiny, production‑ready CLI that turns a Postman collection into fully‑typed SDKs for
TypeScript, Python and Go.  It pulls the collection from the Postman API (or from a
local JSON file), converts it to a minimal OpenAPI 3 document and then hands it off
to the official OpenAPI Generator.

## Install

```bash
npm install -g postman-to-sdk
```

## Usage

```bash
postman-to-sdk \
  --collection-id <POSTMAN_COLLECTION_ID> \
  --api-key <POSTMAN_API_KEY> \
  --output ./generated-sdks \
  --lang typescript --lang python --lang go
```

Or use a local file:

```bash
postman-to-sdk \
  --file ./my-collection.json \
  --output ./generated-sdks \
  --lang typescript
```

Supported languages: `typescript`, `python`, `go`.

## Features

* Automatic retry with exponential back‑off for transient network errors.  
* Redacts the Postman API key from all error messages.  
* Strips query strings from paths before OpenAPI conversion.  
* Validates the Postman collection against a strict Zod schema.  
* Generates SDKs into `generated-sdks/<lang>` folders.  

## Development

```bash
npm run build
npm start
```

## License

MIT
```

**File: `src/config.ts`**
```ts
/**
 * @file config.ts
 * Centralised configuration values and small helpers used across the project.
 */

import path from 'path';

/** Supported SDK languages – exported as a readonly tuple for literal union types. */
export const SUPPORTED_LANGUAGES = ['typescript', 'python', 'go'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/** Default timeout (ms) for HTTP calls to the Postman API. */
export const HTTP_TIMEOUT_MS = 10_000;

/** Maximum number of retry attempts for idempotent GET requests. */
export const MAX_RETRIES = 4;

/** Exponential back‑off base (ms). */
export const RETRY_BACKOFF_MS = 500;

/** Where generated SDKs will be written. */
export const OUTPUT_ROOT = path.resolve(process.cwd(), 'generated-sdks');

/** Path to the bundled OpenAPI Generator CLI jar (installed via npm). */
export const OPENAPI_GENERATOR_CLI = require.resolve(
  '@openapitools/openapi-generator-cli/dist/cli.js'
);

/** Map of language to OpenAPI Generator generator name. */
export const LANG_MAP: Record<SupportedLanguage, string> = {
  typescript: 'typescript-axios',
  python: 'python',
  go: 'go',
};
```

**File: `src/types.ts`**
```ts
/**
 * @file types.ts
 * Type definitions and Zod validators for the subset of Postman collection we support.
 */

import { z } from 'zod';
import { OpenAPIV3 } from 'openapi-types';

/* ---------- Zod schemas ---------- */

/** Minimal URL schema used inside a request. */
export const UrlSchema = z.object({
  raw: z.string(),
  /** Path part, e.g. "/users/:id" */
  path: z.string().optional(),
  /** Query string (already parsed) */
  query: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    )
    .min(0)
    .optional(),
});

/** Minimal request schema. */
export const RequestSchema = z.object({
  method: z.enum([
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
    'HEAD',
  ]),
  header: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    )
    .min(0)
    .optional(),
  url: UrlSchema,
  body: z
    .object({
      mode: z.enum(['raw', 'urlencoded', 'formdata', 'file', 'graphql']),
      raw: z.string().optional(),
    })
    .optional(),
});

/** Minimal item (folder or request) schema. */
export const ItemSchema = z.object({
  name: z.string(),
  /** If the item has a request, it’s a leaf node. */
  request: RequestSchema.optional(),
  /** If the item has children, it’s a folder. */
  item: z
    .array(z.lazy(() => ItemSchema))
    .min(0)
    .optional(),
});

/** Minimal collection schema. */
export const CollectionSchema = z.object({
  info: z.object({
    _postman_id: z.string(),
    name: z.string(),
    schema: z.string(),
  }),
  item: z.array(ItemSchema),
});

/** TypeScript type for a validated collection. */
export type Collection = z.infer<typeof CollectionSchema>;

/**