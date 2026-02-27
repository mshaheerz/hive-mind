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
