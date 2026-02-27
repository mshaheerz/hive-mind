Below is a **complete, production‑ready implementation** of the **Postman‑to‑SDK** CLI tool written in **TypeScript**.  
The tool fetches a Postman collection (via API key + collection‑ID **or** a local file), converts it to an OpenAPI 3 definition, and then generates SDKs for the requested languages (TypeScript, Python, Go) using **OpenAPI Generator**.

---

## 1️⃣ File: `package.json`

```json
{
  "name": "postman-to-sdk",
  "version": "1.0.0",
  "description": "CLI that generates fully‑typed SDKs (TS, Python, Go) from Postman collections",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "cli": "ts-node src/index.ts"
  },
  "bin": {
    "postman-to-sdk": "./dist/index.js"
  },
  "author": "Hive Mind – FORGE",
  "license": "MIT",
  "dependencies": {
    "@openapitools/openapi-generator-cli": "^2.13.4",
    "chalk": "^5.3.0",
    "commander": "^12.0.0",
    "fs-extra": "^11.2.0",
    "node-fetch": "^3.3.2",
    "postman-to-openapi": "^4.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.17",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
```

*Key decisions*  

* **Commander** – provides a declarative, well‑tested CLI API.  
* **postman-to-openapi** – battle‑tested library that converts Postman v2.1 collections to OpenAPI 3.0.  
* **@openapitools/openapi-generator-cli** – official wrapper around the Java‑based OpenAPI Generator; we invoke it via its programmatic API (which internally spawns a Java process).  
* **node‑fetch** – lightweight fetch implementation for Node ≥ 18.  
* **fs‑extra** – convenient promise‑based file utilities.  

---

## 2️⃣ File: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "sourceMap": true
  },
  "include": ["src"]
}
```

---

## 3️⃣ Folder: `src/` – source code

### 3.1 `src/index.ts` – CLI entry point  

```ts
/**
 * @fileoverview
 * CLI entry point for the Postman‑to‑SDK tool.
 *
 * It parses user arguments, orchestrates fetching/parsing the collection,
 * converts it to OpenAPI, and finally generates SDKs for the requested languages.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { fetchCollection } from './postmanClient.js';
import { convertToOpenApi } from './converter.js';
import { generateSdk } from './sdkGenerator.js';
import { readFile, writeFile, ensureDir } from './utils.js';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Constants (no magic numbers)
// ---------------------------------------------------------------------------

/** Default languages to generate when none are supplied */
const DEFAULT_LANGUAGES = ['typescript', 'python', 'go'] as const;

/** Directory name inside the output folder where the OpenAPI spec will be stored */
const OPENAPI_SPEC_DIR = 'openapi';

/** File name for the generated OpenAPI JSON */
const OPENAPI_SPEC_FILE = 'postman-openapi.json';

// ---------------------------------------------------------------------------
// CLI definition
// ---------------------------------------------------------------------------

const program = new Command()
  .name('postman-to-sdk')
  .description('Generate TypeScript, Python, and Go SDKs from a Postman collection')
  .version('1.0.0')
  .requiredOption('-o, --output <dir>', 'Output directory for generated SDKs')
  .option('-k, --api-key <key>', 'Postman API key (required when using --collection-id)')
  .option('-c, --collection-id <id>', 'Postman collection ID to fetch from the Postman API')
  .option('-f, --collection-file <path>', 'Path to a local Postman collection JSON file')
  .option(
    '-l, --languages <list>',
    'Comma‑separated list of languages (typescript,python,go). Default: all three',
  )
  .option('-s, --skip-openapi', 'Skip writing the intermediate OpenAPI spec to disk')
  .parse(process.argv);

interface Options {
  output: string;
  apiKey?: string;
  collectionId?: string;
  collectionFile?: string;
  languages?: string;
  skipOpenapi?: boolean;
}

async function main(opts: Options): Promise<void> {
  const {
    output,
    apiKey,
    collectionId,
    collectionFile,
    languages,
    skipOpenapi = false,
  } = opts;

  // -----------------------------------------------------------------------
  // Validate input arguments
  // -----------------------------------------------------------------------
  if (!collectionId && !collectionFile) {
    console.error(chalk.red('❌ Either --collection-id or --collection-file must be provided.'));
    process.exit(1);
  }

  if (collectionId && !apiKey) {
    console.error(chalk.red('❌ --api-key is required when using --collection-id.'));
    process.exit(1);
  }

  // -----------------------------------------------------------------------
  // Resolve target languages
  // -----------------------------------------------------------------------
  const targetLanguages = languages
    ? languages.split(',').map((l) => l.trim().toLowerCase())
    : DEFAULT_LANGUAGES;

  // Validate language list
  const supported = new Set(DEFAULT_LANGUAGES);
  for (const lang of targetLanguages) {
    if (!supported.has(lang as any)) {
      console.error(chalk.red(`❌ Unsupported language "${lang}". Supported: ${DEFAULT_LANGUAGES.join(', ')}`));
      process.exit(1);
    }
  }

  // -----------------------------------------------------------------------
  // Prepare output directories
  // -----------------------------------------------------------------------
  const outputDir = resolve(process.cwd(), output);
  await ensureDir(outputDir);
  const openapiDir = resolve(outputDir, OPENAPI_SPEC_DIR);
  await ensureDir(openapiDir);
  const openapiPath = resolve(openapiDir, OPENAPI_SPEC_FILE);

  // -----------------------------------------------------------------------
  // Load Postman collection (remote or local)
  // -----------------------------------------------------------------------
  let collectionJson: any;
  try {
    if (collectionId) {
      collectionJson = await fetchCollection(collectionId, apiKey!);
    } else {
      const raw = await readFile(collectionFile!);
      collectionJson = JSON.parse(raw);
    }
  } catch (err)