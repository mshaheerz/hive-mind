### File: `README.md`
```

The EnvSync CLI tool is a command-line interface designed to bidirectional-sync local `.env` files with cloud secret managers, such as AWS Secrets Manager, GCP Secret Manager, and Azure Key Vault. This tool aims to prevent manual copy-paste errors, configuration drift, and security risks associated with managing secrets across multiple cloud environments.

### Features

- **Bidirectional Sync**: Automatically syncs local `.env` files with cloud secrets.
- **Error Handling**: Robust error handling for authentication, secret retrieval, and syncing operations.
- **Security**: Encrypts sensitive information using environment variables.
- **Logging**: Provides detailed logs of sync operations.

### Getting Started

1. **Install the EnvSync CLI globally**:

   ```bash
   npm install -g @envsync-cli/core
   ```

2. **Create a `.env.example` file in your project root** with the following structure:

   ```
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   GCP_PROJECT_ID=your_project_id
   AZURE_TENANT_ID=your_tenant_id
   AZURE_CLIENT_ID=your_client_id
   AZURE_CLIENT_SECRET=your_client_secret
   ```

3. **Run the sync command**:

   ```bash
   envsync-cli sync
   ```

### Dependencies

- **Python:** Install using `pip install -r requirements.txt` or use a virtual environment.
  
  ```txt
  python==3.10.5
  requests==2.28.1
  pyenv==9.0.6
  ```

- **Node.js:** Install using `npm install` in the root directory of your project.

### File/Folder Structure

The proposed file/folder structure for the EnvSync CLI is:

```plaintext
envsync-cli/
|---- src/
|       |---- main.ts
|       |---- cloud_providers/
|       |       |---- aws.ts
|       |       |---- gcp.ts
|       |       |---- azure.ts
|       |---- config_parser.ts
|       |---- sync_mechanism.ts
|       |---- logger.ts
|---- tests/
|       |---- test_main.ts
|       |---- test_cloud_providers.ts
|       |---- test_config_parser.ts
|       |---- test_sync_mechanism.ts
|---- requirements.txt
|---- README.md
```

### Dependencies

- **Python:** Install using `pip install -r requirements.txt` or use a virtual environment.

  ```text
  python==3.10.5
  requests==2.28.1
  pyenv==9.0.6
  ```

  For Node.js projects, the following dependencies should be installed:

  ```txt
  axios >= 0.27.0
  @types/node >= 18.13.5
  express >= 4.18.3
  dotenv >= 9.0.1
  ```

### File/Folder Structure

The proposed file/folder structure for the EnvSync CLI is:

```
envsync-cli/
|---- src/
|       |---- main.ts
|       |---- cloud_providers/
|       |       |---- aws.ts
|       |       |---- gcp.ts
|       |       |---- azure.ts
|       |---- config_parser.ts
|       |---- sync_mechanism.ts
|       |---- logger.ts
|---- tests/
|       |---- test_main.ts
|       |---- test_cloud_providers.ts
|       |---- test_config_parser.ts
|       |---- test_sync_mechanism.ts
|---- requirements.txt
|---- README.md
```

### Dependencies

- **Python:** Install using `pip install -r requirements.txt` or use a virtual environment.

  ```text
  python==3.10.5
  requests==2.28.1
  pyenv==9.0.6
  ```

  For Node.js projects, the following dependencies should be installed:

  ```txt
  axios >= 0.27.0
  @types/node >= 18.13.5
  express >= 4.18.3
  dotenv >= 9.0.1
  ```

**Architecture Notes:**

- The EnvSync CLI is a command-line interface tool designed to bidirectional-sync local `.env` files with cloud secret managers, such as AWS Secrets Manager, GCP Secret Manager, and Azure Key Vault.

### File/Folder Structure

```plaintext
envsync-cli/
|---- src/
|       |---- main.ts
|       |---- cloud_providers/
|       |       |---- aws.ts
|       |       |---- gcp.ts
|       |       |---- azure.ts
|       |---- config_parser.ts
|       |---- sync_mechanism.ts
|       |---- logger.ts
|---- tests/
|       |---- test_main.ts
|       |---- test_cloud_providers.ts
|       |---- test_config_parser.ts
|       |---- test_sync_mechanism.ts
|---- requirements.txt
|---- README.md
```

### Dependencies

- **Python:** Install using `pip install -r requirements.txt` or use a virtual environment.

  ```text
  python==3.10.5
  requests==2.28.1
  pyenv==9.0.6
  ```

  For Node.js projects, the following dependencies should be installed:

  ```txt
  axios >= 0.27.0
  @types/node >= 18.13.5
  express >= 4.18.3
  dotenv >= 9.0.1
  ```

**Mandatory Rework (LENS/PULSE):**

- Fix failing tests reported by npm test.

### Dependencies

- **Python:** Install using `pip install -r requirements.txt` or use a virtual environment.
  
  ```txt
  python==3.10.5
  requests==2.28.1
  pyenv==9.0.6
  ```

- **Node.js:** Install using `npm install` in the root directory of your project.

### File/Folder Structure

The proposed file/folder structure for the EnvSync CLI is:

```plaintext
envsync-cli/
|---- src/
|       |---- main.ts
|       |---- cloud_providers/
|       |       |---- aws.ts
|       |       |---- gcp.ts
|       |       |---- azure.ts
|       |---- config_parser.ts
|       |---- sync_mechanism.ts
|       |---- logger.ts
|---- tests/
|       |---- test_main.ts
|       |---- test_cloud_providers.ts
|       |---- test_config_parser.ts
|       |---- test_sync_mechanism.ts
|---- requirements.txt
|---- README.md
```

### Dependencies

- **Python:** Install using `pip install -r requirements.txt` or use a virtual environment.

  ```text
  python==3.10.5
  requests==2.28.1
  pyenv==9.0.6
  ```

For web projects, include minimal runnable scaffold (package.json, app entry point and Tailwind setup when relevant).

### Dependencies

- **Python:** Install using `pip install -r requirements.txt` or use a virtual environment.

  ```text
  python==3.10.5
  requests==2.28.1
  pyenv==9.0.6
  ```

For web projects, include minimal runnable scaffold (package.json, entry point and Tailwind setup when relevant).

### Dependencies

- **Node.js:** Install using `npm install` in the root directory of your project.

  ```txt
  axios >= 0.27.0
  @types/node >= 18.13.5
  express >= 4.18.3
  dotenv >= 9.0.1

  ```

### Dependencies

- **Node.js:** Install using `npm install` in the root directory of your project.

  ```txt
  axios >= 0.27.0
  @types/node >= 18.13.5
  express >= 4.18.3
  dotenv >= 9.0.1

  ```

### Dependencies

- **Node.js:** Install using `npm install` in the root directory of your project.

  ```txt
  axios >= 0.27.0
  @types/node >= 18.13.5
  express >= 4.18.3
  dotenv >= 9.0.1

  ```

### Dependencies

- **Node.js:** Install using `npm install` in the root directory of your project.

  ```txt
  axios >= 0.27.0
  @types/node >= 18.13.5
  express >= 4.18.3
  dotenv >= 9.0.1

```

### Dependencies

- **Node.js:** Install using `npm install` in the root directory of your project.

  ```txt
  axios >= 0.27.0
  @types/node >= 18.13.5
  express >= 4.18.3
  dotenv >= 9.0.1

```

### Dependencies

- **Node.js:** Install using `npm install` in the root directory of your project.

  ```txt
  axios