# EnvSync CLI

The EnvSync CLI is a command-line interface tool designed to synchronize local `.env` files with cloud secret managers, such as AWS Secrets Manager, GCP Secret Manager, and Azure Key Vault. This project addresses the problem of manual copy-paste errors, configuration drift, and security risks associated with managing secrets across multiple cloud environments. By automating the syncing process, EnvSync CLI can reduce errors, save time, and improve overall security.

## Tech Stack

### Programming Language
- **Node.js** or **Python**

### Cloud Provider SDKs
- AWS SDK (e.g., `boto3`)
- Google Cloud Secret Manager Client Library (e.g., `google-cloud-secretmanager`)

### Configuration File Parsing
- Python library: `python-dotenv`, `dotenv`

### Syncing Mechanism
- Implement a two-way sync using libraries like `deep-diff` to compare local and cloud configurations.

## Key Features

- **Automatic Synchronization**: Manages both local `.env` files and remote secret managers.
- **Secure Authentication**: Uses existing SDKs for authentication with cloud providers.
- **Error Handling**: Ensures robust error handling throughout the syncing process.
- **Configuration Management**: Validates and updates configurations across versions.

## Usage Guide

### Installation
