**File: `package.json`**
```json
{
  "name": "envsync-cli",
  "version": "1.0.0",
  "description": "Bidirectional sync of local .env files with cloud secret managers",
  "main": "dist/main.js",
  "bin": {
    "envsync": "dist/main.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/main.js",
    "dev": "ts-node src/main.ts",
    "test": "vitest run"
  },
  "keywords": [
    "env",
    "sync",
    "cli",
    "secrets",
    "aws",
    "gcp",
    "azure"
  ],
  "author": "NOVA",
  "license": "MIT",
  "dependencies": {
    "@aws-sdk/client-secrets-manager": "^3.400.0",
    "@azure/identity": "^3.0.0",
    "@azure/keyvault-secrets": "^4.1.0",
    "@google-cloud/secret-manager": "^3.3.0",
    "commander": "^11.1.0",
    "dotenv": "^16.4.5",
    "winston": "^3.13.0",
    "winston-daily-rotate-file": "^4.7.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/winston": "^3.0.11",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3",
    "vitest": "^1.3.1"
  }
}
```

**File: `tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

**File: `vitest.config.ts`**
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts']
  }
});
```

**File: `tests/setup.ts`**
```ts
// Global test setup if needed
```

**File: `.gitignore`**
```
node_modules
dist
logs
.env
*.log
```

**File: `.env.example`**
```
# AWS credentials
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_REGION=YOUR_AWS_REGION

# GCP credentials
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account.json

# Azure credentials
AZURE_CLIENT_ID=YOUR_AZURE_CLIENT_ID
AZURE_TENANT_ID=YOUR_AZURE_TENANT_ID
AZURE_CLIENT_SECRET=YOUR_AZURE_CLIENT_SECRET
AZURE_KEYVAULT_NAME=YOUR_KEYVAULT_NAME
```

**File: `README.md`**
```markdown
# EnvSync CLI

A command‑line tool that synchronizes local `.env` files with cloud secret managers
(aws secrets manager, gcp secret manager, azure key vault).

## Install

```bash
npm install -g envsync-cli
```

## Usage

```bash
envsync --provider aws --env-file .env
```

## Options

- `--provider <aws|gcp|azure>`: Cloud provider to sync with.
- `--env-file <path>`: Path to the local `.env` file.
- `--sync`: Perform bidirectional sync (default).

## Development

```bash
npm run dev   # run CLI with ts-node
npm run test  # run tests
npm run build # compile to dist/
```
```

---

## Core Implementation

**File: `src/logger.ts`**
```ts
/**
 * Centralised logger creation for EnvSync CLI.
 *
 * Provides a thread‑safe per‑name logger factory that writes to a
 * daily‑rotating file and the console. Log level can be overridden
 * with the `ENV_SYNC_LOG_LEVEL` environment variable.
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const DEFAULT_LOG_LEVEL = 'info';
const LOG_DIR_NAME = 'logs';
const LOG_FILE_NAME = 'envsync.log';
const ENV_LOG_LEVEL = 'ENV_SYNC_LOG_LEVEL';

const LOG_ROTATION_INTERVAL = '1d'; // rotate daily
const LOG_BACKUP_COUNT = 7; // keep 7 rotated log files

// Cache of loggers keyed by name
const loggers: Record<string, winston.Logger> = {};

/**
 * Ensure that the log directory exists and return its absolute