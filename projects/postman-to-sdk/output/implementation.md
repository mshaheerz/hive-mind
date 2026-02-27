**File: `package.json`**
```json
{
  "name": "postman-to-sdk",
  "version": "1.0.0",
  "description": "CLI that generates typed SDKs (TS, Python, Go) from Postman collections",
  "main": "dist/main.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/main.js",
    "cli": "npm run build && node dist/main.js"
  },
  "bin": {
    "postman-to-sdk": "./dist/main.js"
  },
  "keywords": [
    "postman",
    "sdk",
    "openapi",
    "codegen"
  ],
  "author": "Hive Mind",
  "license": "MIT",
  "dependencies": {
    "axios": "^1.7.2",
    "commander": "^12.1.0",
    "postman-to-openapi": "^0.5.0",
    "openapi-generator-cli": "^2.13.0"
  },
  "devDependencies": {
    "@types/node": "^22.5.0",
    "typescript": "^5.6.2"
  }
}
```

---

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
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

---

### Source files (`src/`)

**File: `src/constants.ts`**
```ts
/**
 * @file constants.ts
 * @description Centralised constants used across the CLI tool.
 */

export const POSTMAN_API_BASE = 'https://api.getpostman.com';
export const DEFAULT_OUTPUT_DIR = './generated-sdk';
export const SUPPORTED_LANGUAGES = {
  typescript: 'typescript',
  python: 'python',
  go: 'go',
} as const;

export const OPENAPI_GENERATOR_CLI = 'openapi-generator-cli';
```

---

**File: `src/utils.ts`**
```ts
/**
 * @file utils.ts
 * @description Utility helpers used by various modules.
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

export const execAsync = promisify(exec);

/**
 * Writes data to a file, creating parent directories if needed.
 * @param filePath Absolute or relative file path.
 * @param data Content to write.
 */
export async function writeFileEnsuringDir(filePath: string, data: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, data, 'utf8');
}

/**
 * Reads a JSON file and parses its content.
 * @param filePath Path to the JSON file.
 * @returns Parsed JSON object.
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

/**
 * Logs an error with a consistent format.
 * @param err The error object.
 */
export function logError(err: unknown): void {
  if (err instanceof Error) {
    console.error(`❌ ${err.name}: ${err.message}`);
    if (err.stack) console.error(err.stack);
  } else {
    console.error('❌ Unexpected error:', err);
  }
}
```

---

**File: `src/postmanApiClient.ts`**
```ts
/**
 * @file postmanApiClient.ts
 * @description Minimal client for fetching a Postman collection via the Postman API.
 */

import axios, { AxiosInstance } from 'axios';
import { POSTMAN_API_BASE } from './constants';
import { logError } from './utils';

/**
 * Interface describing the shape of a Postman collection response.
 */
export interface PostmanCollectionResponse {
  collection: any; // The raw collection JSON (we keep it loosely typed)
}

/**
 * Postman API client.
 */
export class PostmanApiClient {
  private readonly http: AxiosInstance;

  /**
   * @param apiKey Postman API key (read from env variable POSTMAN_API_KEY)
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('POSTMAN_API_KEY environment variable is required for API access.');
    }

    this.http = axios.create({
      baseURL: POSTMAN_API_BASE,
      headers: {
        'X-Api-Key': apiKey,
        Accept: 'application/json',
      },
      timeout: 15_000,
    });
  }

  /**
   * Fetches a collection by its ID.
   * @param collectionId The Postman collection UID.
   * @returns The collection JSON.
   */
  async fetchCollection(collectionId: string): Promise<any> {
    try {
      const response = await this.http.get<PostmanCollectionResponse>(`/collections/${collectionId}`);
      return response.data.collection;
    } catch (err) {
      logError(err);
      throw new Error(`Failed to fetch collection ${collectionId} from Postman API.`);
    }
  }
}
```

---

**File: `src/collectionParser.ts`**
```ts
/**
 * @file collectionParser.ts
 * @description Converts a Postman collection JSON into an OpenAPI v3 definition.
 */

import { convert } from 'postman-to-openapi';
import { writeFileEnsuringDir } from './utils';
import * as path from 'node:path';

/**
 * Generates an OpenAPI spec file from a Postman collection.
 *
 * @param collectionJson The raw Postman collection object.
 * @param outputDir Directory where the generated openapi.yaml will be stored.
 * @returns Absolute path to the generated OpenAPI file.
 */
export async function generateOpenApiSpec(
  collectionJson: any,
  outputDir: string,
): Promise<string> {
  // The postman-to-openapi library works with file paths, so we write a temporary file first.
  const tempCollectionPath = path.join(outputDir, 'temp-collection.json');
  await writeFileEnsuringDir(tempCollectionPath, JSON.stringify(collectionJson, null, 2));

  const openapiPath = path.join(outputDir, 'openapi.yaml');

  try {
    await convert(tempCollectionPath, openapiPath, {
      // Options: keep request examples, include auth, etc.
      defaultTag: 'default',
      info: {
        title: collectionJson.info?.name ?? 'Generated API',
        version: collectionJson.info?.version ?? '1.0.0',
      },
    });
  } catch (err) {
    throw new Error(`Failed to convert Postman collection to OpenAPI: ${err instanceof Error ? err.message : String(err)}`);
  }

  return openapiPath;
}
```

---

**File: `src/sdkGenerator.ts`**
```ts
/**
 * @file sdkGenerator.ts
 * @description Generates language SDKs from an OpenAPI definition using OpenAPI Generator CLI.
 */

import { execAsync, logError } from './utils';
import { SUPPORTED_LANGUAGES, OPENAPI_GENERATOR_CLI } from './constants';
import * as path from 'node:path';

/**
 * Generates an SDK for a specific language.
 *
 * @param openApiPath Absolute path to the OpenAPI yaml/json file.
 * @param language Target language (typescript | python | go).
 * @param outputRoot Root directory where the SDK folder will be created.
 */
export async function generateSdk(
  openApiPath: string,
  language: keyof typeof SUPPORTED_LANGUAGES,
  outputRoot: string,
): Promise<void> {
  const languageName = SUPPORTED_LANGUAGES[