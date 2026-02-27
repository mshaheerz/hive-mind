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
AWS_SECRET_ACCESS_KEY=YOUR