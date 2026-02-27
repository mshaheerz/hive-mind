# envsync-cli

> **Stop copy-pasting secrets.** Sync your local `.env` files with cloud secret managers in one command.

[![npm version](https://badge.fury.io/js/envsync-cli.svg)](https://badge.fury.io/js/envsync-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

## Quick Start (5 minutes)

```bash
# Install globally
npm install -g envsync-cli

# Connect to your cloud provider
envsync init

# Sync your first .env file
envsync push .env.production
```

That's it. Your secrets are now in AWS/GCP/Azure and your team can pull them with:

```bash
envsync pull .env.production
```

## What It Does

`envsync-cli` is a bidirectional sync tool that keeps your local `.env` files in perfect sync with cloud secret managers. No more:

- ❌ Copy-pasting secrets between environments
- ❌ Out-of-sync configurations
- ❌ Manual secret updates across 5 different places
- ❌ "Works on my machine" deployment issues

## Why You Need This

Every developer has been there:

1. You add a new API key to your local `.env`
2. You forget to update the cloud secret manager
3. Production breaks at 3 AM
4. You spend 2 hours debugging why

`envsync-cli` prevents this by making cloud secret management as simple as Git. Push, pull, sync. Done.

## Features

### 🔄 Bidirectional Sync
- **Push**: Upload local `.env` to cloud (with smart diff)
- **Pull**: Download cloud secrets to local `.env`
- **Sync**: Automatic two-way reconciliation

### ☁️ Multi-Cloud Support
- AWS Secrets Manager
- Google Cloud Secret Manager
- Azure Key Vault
- More providers coming soon

### 🔐 Security First
- No secrets stored in plain text
- Local encryption at rest
- Audit trail for all changes
- Team access controls

### 🚀 Developer Experience
- Zero-config setup wizard
- Git-style commands you already know
- Automatic backup before changes
- Dry-run mode for safety

## Installation

### Global Install (Recommended)
```bash
npm install -g envsync-cli
```

### Local Install
```bash
npm install --save-dev envsync-cli
```

### NPX (No Install)
```bash
npx envsync-cli --help
```

## Usage

### 1. Initialize Your Project
```bash
cd your-project/
envsync init
```

This creates an `.envsync.yml` config file. Answer the wizard questions:

```yaml
# .envsync.yml
provider: aws  # or gcp, azure
region: us-east-1
project: my-app
backup: true
encryption: true
```

### 2. First-Time Setup

#### AWS Setup
```bash
# Ensure you have AWS credentials configured
aws configure

# Test connection
envsync doctor
```

#### GCP Setup
```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Authenticate
gcloud auth login

# Test connection
envsync doctor
```

#### Azure Setup
```bash
# Login via Azure CLI
az login

# Set subscription
az account set --subscription "YOUR_SUBSCRIPTION"

# Test connection
envsync doctor
```

### 3. Daily Commands

#### Push Local Changes to Cloud
```bash
# Push current directory's .env
envsync push

# Push specific file
envsync push .env.staging

# Push with dry-run (safe mode)
envsync push --dry-run

# Push and encrypt
envsync push --encrypt
```

#### Pull Cloud Secrets Locally
```bash
# Pull to current directory
envsync pull

# Pull specific environment
envsync pull --env production

# Pull and backup existing .env
envsync pull --backup
```

#### Sync (Bidirectional)
```bash
# Smart sync (resolves conflicts automatically)
envsync sync

# Sync with manual conflict resolution
envsync sync --interactive

# Sync specific keys only
envsync sync --keys API_KEY,DATABASE_URL
```

## Advanced Usage

### Multiple Environments
```bash
# Set up environments
envsync env add production
envsync env add staging
envsync env add development

# Switch between them
envsync env use production
envsync pull
```

### Team Collaboration
```bash
# Share access (AWS example)
envsync share add --email teammate@company.com --role reader

# View audit log
envsync log --limit 50

# Lock environment during deployments
envsync lock production --reason "Deploying v2.0"
envsync unlock production
```

### CI/CD Integration
```yaml
# .github/workflows/deploy.yml
- name: Sync secrets
  run: |
    npm install -g envsync-cli
    envsync pull --env production --force
```

### Bulk Operations
```bash
# Export all secrets
envsync export --format json > secrets-backup.json

# Import from file
envsync import secrets-backup.json --env staging

# Compare environments
envsync diff production staging
```

## Configuration

### Environment Variables
```bash
# Override config file
export ENVSYNC_PROVIDER=aws
export ENVSYNC_REGION=us-west-2
export ENVSYNC_PROJECT=my-other-app

# Or use flags
envsync push --provider gcp --project different-app
```

### Config File Options
```yaml
# .envsync.yml
version: 1

# Cloud provider settings
provider: aws
region: us-east-1
project: my-app

# Security
encryption: true
backup: true
backup_dir: .envsync-backups/

# Sync behavior
auto_sync: false
conflict_resolution: prompt  # or force-local, force-remote
ignore_keys:
  - NODE_ENV
  - DEBUG

# Notifications
notify_on_change: true
slack_webhook: https://hooks.slack.com/...

# Environments
environments:
  production:
    secret_name: my-app-prod
  staging:
    secret_name: my-app-staging
```

## Troubleshooting

### Common Issues

#### "Provider not configured"
```bash
# Run the doctor command
envsync doctor

# It will tell you exactly what's missing
```

#### "Access denied"
```bash
# AWS: Check your IAM permissions
envsync doctor --verbose

# GCP: Ensure Secret Manager API is enabled
gcloud services enable secretmanager.googleapis.com

# Azure: Check Key Vault access policies
az keyvault set-policy --name YOUR_VAULT --object-id YOUR_ID
```

#### "Merge conflict"
```bash
# Use interactive mode
envsync sync --interactive

# Or force local/remote
envsync sync --force-local
envsync sync --force-remote
```

### Debug Mode
```bash
# Enable verbose logging
envsync --verbose sync

# Debug specific command
DEBUG=envsync:* envsync pull
```

## API Reference

### Commands

| Command | Description | Example |
|---------|-------------|---------|
| `init` | Initialize project | `envsync init` |
| `push` | Upload local to cloud | `envsync push .env.prod` |
| `pull` | Download cloud to local | `envsync pull` |
| `sync` | Bidirectional sync | `envsync sync` |
| `doctor` | Check configuration | `envsync doctor` |
| `diff` | Compare environments | `envsync diff staging prod` |
| `log` | View audit trail | `envsync log --limit 20` |

### Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--dry-run` | Preview changes | `envsync push --dry-run` |
| `--force` | Skip confirmations | `envsync pull --force` |
| `--env` | Target environment | `envsync pull --env prod` |
| `--encrypt` | Encrypt secrets | `envsync push --encrypt` |
| `--backup` | Create backup | `envsync pull --backup` |
| `--verbose` | Debug output | `envsync --verbose push` |

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors
```bash
git clone https://github.com/your-org/envsync-cli.git
cd envsync-cli
npm install
npm test
```

## Roadmap

- [ ] HashiCorp Vault support
- [ ] 1Password integration
- [ ] Web dashboard
- [ ] Terraform provider
- [ ] VS Code extension

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made by developers, for developers.**  
[Report Bug](https://github.com/your-org/envsync-cli/issues) · [Request Feature](https://github.com/your-org/envsync-cli/discussions) · [Star on GitHub](https://github.com/your-org/envsync-cli)