## File: `package.json`

```json
{
  "name": "envsync-cli",
  "version": "1.0.0",
  "description": "Bidirectional sync of local .env files with cloud secret managers",
  "main": "dist/index.js",
  "bin": {
    "envsync": "./index.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "vitest run --watch=false"
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
    "@aws-sdk/client-secretsmanager": "^1.204.0",
    "@aws-sdk/client-ssm": "^4.189.0",
    "@google-cloud/secret-manager": "^5.3.0",
    "@azure/identity": "^2.16.0",
    "@azure/keyvault-secrets": "^7.0.0",
    "dotenv": "^10.0.0",
    "deep-diff": "^4.0.2",
    "argparse": "^2.8.0"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "@types/node": "^18.7.13",
    "@types/dotenv": "^9.2.0",
    "@types/aws-sdk": "^2.476.0",
    "@types/google-cloud-secretmanager": "^5.0.0",
    "vitest": "^0.34.0",
    "ts-node": "^10.8.0"
  }
}
```

## File: `tsconfig.json`

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

## File: `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./setup.js']
  }
});
```

## File: `setup.js`

```js
// Global test setup if needed
```

## File: `.gitignore`

```
dist/
logs/
.env
*.log
```

## File: `.env.example`

```
# AWS credentials
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY

# GCP credentials
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/gcp-credentials.json

# Azure credentials
AZURE_CLIENT_ID=YOUR_AZURE_CLIENT_ID
AZURE_CLIENT_SECRET=YOUR_AZURE_CLIENT_SECRET
AZURE_TENANT_ID=YOUR_AZURE_TENANT_ID
```

## File: `src/index.ts`

```ts
import 'dotenv/config';
import { SecretsManagerClient, ClientConfiguration } from '@aws-sdk/client-secretsmanager';
import { SSMClient } from '@aws-sdk/client-ssm';
import { AzureKeyVaultSecretsClient } from '@azure/keyvault-secrets';
import * as argparse from 'argparse';
import deepDiff from 'deep-diff';

// Define argument parser
const parser = new argparse.ArgumentParser({
  description: 'EnvSync CLI - Synchronize local .env files with cloud secret managers',
});

parser.addArgument('--local', {
  help: 'Path to the local .env file',
});

parser.addArgument('--remote', {
  help: 'Type of remote (aws, gcp, azure)',
});

// Parse arguments
const args = parser.parseArgs();

async function syncSecrets() {
  try {
    const secretsManagerClient = new SecretsManagerClient();
    const ssmClient = new SSMClient({});
    let secretValue;

    switch (args.remote) {
      case 'aws':
        // Implement AWS Secrets Manager logic here
        secretValue = await getAWSSecretValue(secretsManagerClient, args.local);
        break;
      case 'gcp':
        // Implement GCP Secret Manager logic here
        secretValue = await getGCPSecret(secretssClient, args.local);
        break;
      case 'azure':
        // Implement Azure Key Vault logic here
        secretValue = await getAzureKeyVaultSecret(args.local);
        break;
      default:
        console.error('Invalid remote type');
        return;
    }

    const localConfig = parseLocalEnv(args.local);
    const diff = deepDiff(localConfig, secretValue);

    if (diff.length === 0) {
      console.log('No changes detected.');
      return;
    }

    // Implement sync logic here
    console.log('Syncing changes...');
  } catch (error) {
    console.error('Error syncing secrets:', error);
  }
}

async function getAWSSecretValue(client: SecretsManagerClient, path: string): Promise<string> {
  // Placeholder for actual AWS Secrets Manager logic
  return '';
}

async function getGCPSecret(client: SSMClient, path: string): Promise<string> {
  // Placeholder for actual GCP Secret Manager logic
  return '';
}

function parseLocalEnv(path: string) {
  const env = {};
  require('dotenv').config({ path });
  return env;
}

async function getAzureKeyVaultSecret(path: string): Promise<any> {
  // Placeholder for actual Azure Key Vault logic
  return {};
}

syncSecrets();
```

## Dependencies

- `aws-sdk`: AWS SDK for JavaScript, version 2.476.0.
- `google-cloud-secretmanager`: GCP Client Library, version 5.3.0.
- `azure-keyvault-secrets`: Azure Key Vault Secrets client library, version 7.0.0.
- `dotenv`: Library to read and parse .env files, version 10.0.0.
- `deep-diff`: Library to compare complex data structures, version 4.0.2.
- `argparse`: Command-line argument parser, version 2.8.0.
- `ts-node`: TypeScript execution tool, version 10.8.0.