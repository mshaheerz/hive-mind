**File: `package.json`**
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
    "cli": "npm run build && node dist/index.js"
  },
  "bin": {
    "postman-to-sdk": "./dist/index.js"
  },
  "keywords": [
    "postman",
    "sdk",
    "openapi",
    "codegen",
    "cli"
  ],
  "author": "Hive Mind",
  "license": "MIT",
  "dependencies": {
    "axios": "^1.7.2",
    "chalk": "^5.3.0",
    "commander": "^12.0.0",
    "fs-extra": "^11.2.0",
    "openapi-generator-cli": "^2.13.0",
    "postman-to-openapi": "^1.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.12.7",
    "typescript": "^5.4.3"
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
    "sourceMap": true
  },
  "include": ["src"]
}
```

---

### `src/index.ts`
```ts
/**
 * @fileoverview
 * Entry point for the Postman‑to‑SDK CLI.
 *
 * Orchestrates the flow:
 *   1. Parse CLI arguments.
 *   2. Retrieve a Postman collection (local file or via API).
 *   3. Convert the collection to an OpenAPI document.
 *   4. Generate SDKs for the requested languages.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { retrieveCollection } from './postmanClient.js';
import { convertToOpenApi } from './converter.js';
import { generateSdks } from './sdkGenerator.js';
import { ensureDir } from './utils.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ──────────────────────────────────────────────────────────────
// Constants (no magic numbers)
// ──────────────────────────────────────────────────────────────
const DEFAULT_OUTPUT_DIR = 'generated-sdks';
const SUPPORTED_LANGUAGES = ['typescript', 'python', 'go'] as const;
type Language = typeof SUPPORTED_LANGUAGES[number];

// ──────────────────────────────────────────────────────────────
// CLI definition
// ──────────────────────────────────────────────────────────────
const program = new Command()
  .name('postman-to-sdk')
  .description('Generate typed SDKs from a Postman collection')
  .version('1.0.0')
  .requiredOption(
    '-c, --collection <path|id>',
    'Path to a local Postman collection JSON file OR a Postman collection ID'
  )
  .option('-k, --api-key <key>', 'Postman API key (required for remote collections)')
  .option(
    '-l, --languages <list>',
    `Comma‑separated list of target languages (supported: ${SUPPORTED_LANGUAGES.join(
      ', '
    )})`,
    (value) => value.split(',').map((v) => v.trim().toLowerCase()),
    SUPPORTED_LANGUAGES
  )
  .option(
    '-o, --output <dir>',
    'Directory where generated SDKs will be written',
    DEFAULT_OUTPUT_DIR
  )
  .parse(process.argv);

interface Options {
  collection: string;
  apiKey?: string;
  languages: Language[];
  output: string;
}

async function main() {
  const opts = program.opts<Options>();

  // Validate language list
  const invalidLangs = opts.languages.filter(
    (l) => !SUPPORTED_LANGUAGES.includes(l as any)
  );
  if (invalidLangs.length) {
    console.error(
      chalk.red(
        `Unsupported language(s): ${invalidLangs.join(
          ', '
        )}. Supported languages are: ${SUPPORTED_LANGUAGES.join(', ')}.`
      )
    );
    process.exit(1);
  }

  // Resolve absolute output path
  const outputDir = path.resolve(process.cwd(), opts.output);
  await ensureDir(outputDir);

  console.log(chalk.cyan('🔎 Retrieving Postman collection...'));
  const collectionJson = await retrieveCollection(opts.collection, opts.apiKey);

  console.log(chalk.cyan('🔄 Converting collection to OpenAPI...'));
  const openApiSpec = await convertToOpenApi(collectionJson, {
    // Optional: you can pass additional conversion options here
    // See postman-to-openapi docs for details.
  });

  console.log(chalk.cyan('⚙️  Generating SDKs...'));
  await generateSdks(openApiSpec, opts.languages, outputDir);

  console.log(chalk.green('✅ SDK generation complete!'));
  console.log(chalk.green(`📂 Files written to: ${outputDir}`));
}

// Run the CLI, catching any unexpected errors
main().catch((err) => {
  console.error(chalk.red('❌ Unexpected error:'), err);
  process.exit(1);
});
```

---

### `src/postmanClient.ts`
```ts
/**
 * @fileoverview
 * Utilities for fetching a Postman collection.
 *
 * The collection can be supplied either:
 *   • As a local file path (JSON)
 *   • As a collection ID that is fetched via the Postman API (requires an API key)
 *
 * All network/file operations are wrapped with proper error handling.
 */

import axios from 'axios';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
export interface PostmanCollection {
  info: {
    name: string;
    schema: string;
  };
  item: any[];
  // The real schema contains many more fields; we only need a subset for conversion.
}

/**
 * Retrieves a Postman collection JSON.
 *
 * @param source - Either a file system path or a Postman collection ID.
 * @param apiKey - Optional API key; required when `source` is an ID.
 * @returns Parsed collection JSON.
 * @throws Error if the collection cannot be read or fetched.
 */
export async function retrieveCollection(
  source: string,
  apiKey?: string
): Promise<PostmanCollection> {
  // Heuristic: if the string ends with .json or exists on disk, treat it as a file.
  const isFile = source.endsWith('.json') || (await fs.pathExists(source));

  if (isFile) {
    const absolutePath = path.resolve(process.cwd(), source);
    try {
      const raw = await fs.readFile(absolutePath, 'utf-8');
      return JSON.parse(raw) as PostmanCollection;
    } catch (err) {
      throw new Error(`Failed to read collection file at ${absolutePath}: ${err}`);
    }
  }

  // Otherwise we assume it is a collection ID.
  if (!apiKey) {
    throw new Error(
      'An API key is required to fetch a collection by ID. Provide it via --api-key.'
    );
  }

  const url = `https://api.postman.com/collections/${encodeURIComponent(source)}`;
  try {
    const response = await axios.get(url, {
      headers: {
        'X-Api-Key': apiKey,
       