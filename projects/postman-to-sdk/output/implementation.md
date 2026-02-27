**File: `package.json`**
```json
{
  "name": "postman-to-sdk",
  "version": "1.0.0",
  "description": "CLI that generates fully‑typed SDKs (TypeScript, Python, Go) from Postman collections.",
  "main": "dist/cli.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "npm run build && node dist/cli.js",
    "test": "echo \"No tests yet\""
  },
  "bin": {
    "postman-to-sdk": "./dist/cli.js"
  },
  "author": "Hive Mind",
  "license": "MIT",
  "dependencies": {
    "axios": "^1.7.2",
    "commander": "^12.1.0",
    "fs-extra": "^11.2.0",
    "openapi-generator-cli": "^2.13.0",
    "postman-collection": "^4.2.0",
    "postman-to-openapi": "^1.5.2"
  },
  "devDependencies": {
    "@types/node": "^22.5.0",
    "typescript": "^5.6.2"
  }
}
```

**File: `tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

**File: `src/constants.ts`**
```ts
/**
 * @fileoverview Centralised constants used across the CLI.
 */

export const TEMP_OPENAPI_FILE = 'temp_openapi.json';
export const DEFAULT_OUTPUT_DIR = 'generated-sdk';
export const SUPPORTED_LANGUAGES = ['typescript', 'python', 'go'] as const;
export const OPENAPI_GENERATOR_MAP: Record<typeof SUPPORTED_LANGUAGES[number], string> = {
  typescript: 'typescript-axios',
  python: 'python',
  go: 'go',
};
export const POSTMAN_API_BASE = 'https://api.postman.com';
```

**File: `src/utils.ts`**
```ts
/**
 * @fileoverview Utility helpers used by multiple modules.
 */

import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';

export const exec = promisify(execCb);

/**
 * Resolve a path relative to the current working directory.
 * @param p Relative or absolute path.
 * @returns Absolute path.
 */
export function resolvePath(p: string): string {
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

/**
 * Write JSON data to a file, creating directories if needed.
 * @param filePath Destination file.
 * @param data JSON‑serialisable data.
 */
export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(filePath, data, { spaces: 2 });
}

/**
 * Delete a file if it exists.
 * @param filePath Path to the file.
 */
export async function safeUnlink(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore – file may not exist
  }
}
```

**File: `src/postmanClient.ts`**
```ts
/**
 * @fileoverview Minimal client for the Postman API.
 */

import axios, { AxiosInstance } from 'axios';
import fs from 'fs-extra';
import { resolvePath } from './utils';
import { POSTMAN_API_BASE } from './constants';

/**
 * Configuration needed to talk to the Postman API.
 */
export interface PostmanClientOptions {
  /** Postman API key – required for remote fetches. */
  apiKey?: string;
}

/**
 * Simple wrapper around the Postman API.
 */
export class PostmanClient {
  private readonly http: AxiosInstance;

  /**
   * @param options Configuration options.
   */
  constructor(private readonly options: PostmanClientOptions) {
    this.http = axios.create({
      baseURL: POSTMAN_API_BASE,
      headers: options.apiKey
        ? { 'X-Api-Key': options.apiKey }
        : undefined,
    });
  }

  /**
   * Load a collection either from a local file or from the remote API.
   *
   * @param collectionIdOrPath Collection ID (if remote) or a file system path.
   * @returns The raw collection JSON object.
   * @throws If the collection cannot be read or fetched.
   */
  async loadCollection(collectionIdOrPath: string): Promise<any> {
    const maybePath = resolvePath(collectionIdOrPath);
    if (await fs.pathExists(maybePath)) {
      // Local file path – read directly
      try {
        const raw = await fs.readFile(maybePath, 'utf8');
        return JSON.parse(raw);
      } catch (err) {
        throw new Error(`Failed to read collection file "${maybePath}": ${(err as Error).message}`);
      }
    }

    // Assume it is a remote collection ID
    if (!this.options.apiKey) {
      throw new Error('Postman API key is required to fetch a collection by ID.');
    }

    try {
      const response = await this.http.get(`/collections/${collectionIdOrPath}`);
      return response.data.collection;
    } catch (err) {
      const msg = (err as any).response?.data?.error?.message ?? (err as Error).message;
      throw new Error(`Failed to fetch collection "${collectionIdOrPath}" from Postman: ${msg}`);
    }
  }
}
```

**File: `src/converter.ts`**
```ts
/**
 * @fileoverview Convert a Postman collection to an OpenAPI definition.
 */

import postmanToOpenApi from 'postman-to-openapi';
import { writeJsonFile } from './utils';
import { TEMP_OPENAPI_FILE } from './constants';
import path from 'path';
import fs from 'fs-extra';

/**
 * Convert a Postman collection JSON object into an OpenAPI JSON file.
 *
 * @param collection Raw Postman collection object.
 * @param outputDir Directory where the temporary OpenAPI file will be stored.
 * @returns Absolute path to the generated OpenAPI JSON file.
 * @throws If conversion fails.
 */
export async function convertCollectionToOpenApi(
  collection: any,
  outputDir: string
): Promise<string> {
  // postman-to-openapi works with a file path, so we need a temporary file.
  const tempCollectionPath = path.join(outputDir, 'temp_collection.json');
  await writeJsonFile(tempCollectionPath, collection);

  try {
    const