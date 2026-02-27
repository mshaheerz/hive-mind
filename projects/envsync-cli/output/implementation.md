### File: `package.json`

```json
{
  "name": "envsync-cli",
  "version": "1.0.0",
  "description": "Bidirectional sync of local .env files with cloud secret managers",
  "main": "dist/main.py",
  "bin": {
    "envsync": "dist/main.py"
  },
  "scripts": {
    "build": "pyinstaller --onefile src/main.py",
    "start": "envsync <arguments>"
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
    "@awscdk/aws-secretsmanager": "^1.78.0",
    "@aws-sdk/client-ssm": "^4.61.0",
    "@google-cloud/secret-manager": "^4.3.0",
    "@azure/identity": "^2.9.0",
    "@azure/keyvault-keys": "^5.1.0",
    "pycryptodome": "^3.17.0",
    "argparse": "^1.4.4",
    "dotenv": "^0.18.0"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "vite": "^4.1.5",
    "@types/node": "^18.7.13",
    "@types/dotenv": "^9.0.4"
  }
}
```

### File: `tsconfig.json`

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
  "include": ["src/**/*.py", "tests/**/*.ts"]
}
```

### File: `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js']
  }
});
```

### File: `tests/setup.js`

```js
// Global test setup if needed
```

### File: `.gitignore`

```
dist/
logs/
.env
*.log
```

### File: `.env.example`

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

### File: `src/main.py`

```python
import os
import dotenv
from argparse import ArgumentParser

# Load environment variables from .env file
dotenv.load_dotenv()

class CloudProvider:
    def __init__(self, provider):
        if provider == 'aws':
            self.client = aws_client()
        elif provider == 'gcp':
            self.client = gcp_client()
        elif provider == 'azure':
            self.client = azure_client()
        else:
            raise ValueError("Unsupported cloud provider")

class AWSClient:
    def __init__(self):
        # Initialize AWS client
        pass

def aws_client():
    return AWSClient()

class GCPClient:
    def __init__(self):
        # Initialize GCP client
        pass

def gcp_client():
    return GCPClient()

class AZUREClient:
    def __init__(self):
        # Initialize Azure client
        pass

def azure_client():
    return AZUREClient()

class ConfigParser:
    def parse_config(self, file_path):
        # Parse .env file and return config as dictionary
        with open(file_path, 'r') as f:
            content = f.read()
        os.environ.update(content)
        return os.environ

class SyncMechanism:
    def sync(self, local_file_path, cloud_provider):
        # Compare and sync local and cloud configurations
        pass

def sync(local_file_path, cloud_provider):
    config_parser = ConfigParser()
    local_config = config_parser.parse_config(local_file_path)
    cloud_client = CloudProvider(cloud_provider)
    cloud_config = cloud_client.get_secret()

    # Sync logic here

if __name__ == "__main__":
    parser = ArgumentParser(description="EnvSync CLI tool")
    parser.add_argument("--local-file", type=str, required=True,
                        help="Path to local .env file")
    parser.add_argument("--cloud-provider", type=str, required=True,
                        help="Cloud provider (aws, gcp, azure)")
    args = parser.parse_args()

    sync(args.local_file, args.cloud_provider)
```

### Dependencies

- `pycryptodome`: for handling encryption and decryption of secrets
- `argparse`: for parsing command-line arguments
- `dotenv`: for loading environment variables from .env files
- `aws-sdk` and `boto3`: for interacting with AWS Secrets Manager
- `google-cloud-secretmanager`: for interacting with GCP Secret Manager
- `azure-identity` and `azure-keyvault-secrets`: for interacting with Azure Key Vault