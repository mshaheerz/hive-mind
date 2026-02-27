## 📁 Complete implementation (Node + TypeScript)

Below is a **self‑contained** implementation that satisfies the description while keeping the code easy to read, well‑documented and production‑ready.

```
postman-to-sdk/
├─ src/
│  ├─ constants.ts          # shared constants (no magic numbers)
│  ├─ utils.ts              # small helpers (logging, file I/O)
│  ├─ postmanApiClient.ts   # fetch a collection from Postman API or local file
│  ├─ collectionParser.ts   # convert Postman collection → OpenAPI (uses postman-to-openapi)
│  ├─ openapiGenerator.ts   # writes the OpenAPI JSON/YAML to disk
│  ├─ sdkGenerator.ts       # runs OpenAPI Generator for TS, Python, Go
│  └─ cli.ts                # commander‑based CLI entry point
├─ bin/
│  └─ postman-to-sdk        # executable shim (npm “bin” entry)
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

### 1️⃣ `src/constants.ts`

```ts
/**
 * @file constants.ts
 * @description Centralised constants used across the project.
 */

export const DEFAULT_OUTPUT_DIR = 'generated-sdk';
export const SUPPORTED_LANGUAGES = ['typescript', 'python', 'go'] as const;
export const OPENAPI_GENERATOR_CLI = 'openapi-generator-cli'; // expects the binary to be on PATH
export const POSTMAN_API_BASE_URL = 'https://api.getpostman.com';
export const POSTMAN_COLLECTION_ENDPOINT = '/collections/{{id}}';
export const POSTMAN_API_TIMEOUT_MS = 15_000; // 15 seconds
```

---

### 2️⃣ `src/utils.ts`

```ts
/**
 * @file utils.ts
 * @description Small, reusable utilities (logging, file handling, etc.).
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Logs an informational message to stdout.
 * @param message Message to display
 */
export function logInfo(message: string): void {
  console.info(`[INFO] ${message}`);
}

/**
 * Logs an error message to stderr.
 * @param message Message to display
 */
export function logError(message: string): void {
  console.error(`[ERROR] ${message}`);
}

/**
 * Ensures a directory exists (creates it recursively if needed).
 * @param dirPath Path to the directory
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Writes JSON data to a file (pretty‑printed).
 * @param filePath Destination file path
 * @param data JSON serialisable data
 */
export async function writeJsonFile(
  filePath: string,
  data: unknown,
): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, json, 'utf8');
}

/**
 * Returns the absolute path of a file relative to the project root.
 * @param relativePath Path relative to the cwd
 */
export function resolvePath(relativePath: string): string {
  return path.resolve(process.cwd(), relativePath);
}
```

---

### 3️⃣ `src/postmanApiClient.ts`

```ts
/**
 * @file postmanApiClient.ts
 * @description Fetches a Postman collection either from the Postman API
 *              (requires an API key) or from a local JSON file.
 */

import axios, { AxiosInstance } from 'axios';
import { promises as fs } from 'fs';
import {
  POSTMAN_API_BASE_URL,
  POSTMAN_COLLECTION_ENDPOINT,
  POSTMAN_API_TIMEOUT_MS,
} from './constants';
import { logError, logInfo, resolvePath } from './utils';

/**
 * Minimal representation of a Postman collection (as returned by the API).
 */
export interface PostmanCollection {
  info: {
    name: string;
    schema: string;
    version?: string;
  };
  item: any[];
  // ... other fields are ignored for this MVP
}

/**
 * Client that talks to the Postman API.
 */
export class PostmanApiClient {
  private readonly http: AxiosInstance;

  /**
   * @param apiKey Postman API key (optional – required only for remote fetch)
   */
  constructor(private readonly apiKey?: string) {
    this.http = axios.create({
      baseURL: POSTMAN_API_BASE_URL,
      timeout: POSTMAN_API_TIMEOUT_MS,
      headers: apiKey ? { 'X-Api-Key': apiKey } : undefined,
    });
  }

  /**
   * Fetches a collection by its ID from the Postman cloud.
   * @param collectionId The Postman collection ID
   * @returns Parsed collection JSON
   * @throws on network or API errors
   */
  async fetchRemoteCollection(collectionId: string): Promise<PostmanCollection> {
    const endpoint = POSTMAN_COLLECTION_ENDPOINT.replace(
      '{{id}}',
      collectionId,
    );

    try {
      logInfo(`Fetching collection ${collectionId} from Postman cloud…`);
      const response = await this.http.get<{ collection: PostmanCollection }>(endpoint);
      return response.data.collection;
    } catch (err) {
      logError(`Failed to fetch remote collection: ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * Reads a collection JSON file from disk.
   * @param filePath Path to a local .json file
   * @returns Parsed collection JSON
   * @throws on file‑system errors or invalid JSON
   */
  async readLocalCollection(filePath: string): Promise<PostmanCollection> {
    const absolute = resolvePath(filePath);
    try {
      logInfo(`Reading local collection file ${absolute}…`);
      const raw = await fs.readFile(absolute, 'utf8');
      return JSON.parse(raw) as PostmanCollection;
    } catch (err) {
      logError(`Failed to read local collection: ${(err as Error).message}`);
      throw err;
    }
  }
}
```

---

### 4️⃣ `src/collectionParser.ts`

```ts
/**
 * @file collectionParser.ts
 * @description Turns a Postman collection into an OpenAPI 3.0 definition.
 *
 * The heavy lifting is delegated to the community package `postman-to-openapi`,
 * which already knows how to map most Postman features.
 */

import { PostmanCollection } from './postmanApiClient';
import { writeJsonFile } from './utils';
import postmanToOpenApi from 'postman-to-openapi';
import { resolvePath } from 'path';

/**
 * Result of the conversion – an OpenAPI JSON object.
 */
export type OpenApiSpec = Record<string, unknown>;

/**
 * Converts a Postman collection into an OpenAPI spec.
 *
 * @param collection The collection object (already parsed)
 * @returns OpenAPI JSON representation
 * @throws on conversion errors
 */
export async function convertCollectionToOpenApi(
  collection: PostmanCollection,
): Promise<OpenApiSpec> {
  try {
    // `postman-to-openapi` works with a file path, so we write a temporary file.
    const tmpPath = resolvePath('.tmp-postman-collection.json');
    await writeJsonFile(tmpPath, collection);

    // The library returns a stringified JSON (or YAML). We request JSON.
    const result = await postmanToOpenApi(tmpPath, {
      outputFile: undefined, // we want the string result, not a file
      yaml: false,
    });

    // `result` is a JSON string – parse it.
    return JSON.parse(result) as OpenApiSpec;
  } catch (err) {
    throw new Error(`OpenAPI conversion failed: ${(err as Error).message}`);
  }
}
```

---

### 5️⃣ `src/openapiGenerator.ts`

```ts
/**
 * @file openapiGenerator.ts
 * @description Persists the OpenAPI spec to disk (JSON file) so that the
 *              downstream code‑generator can consume it.
 */

import { OpenApiSpec } from './collectionParser';
import { ensureDir, writeJsonFile, resolvePath } from './utils';
import path from 'path';

export const OPENAPI_FILE_NAME = 'openapi.json';

/**
 * Writes the OpenAPI definition to the given output directory.
 *
 * @param spec OpenAPI spec object
 * @param outDir Destination directory (will be created if missing)
 * @returns Absolute path to the generated OpenAPI file
 */
export async function writeOpenApiFile(
  spec: OpenApiSpec,
  outDir: string