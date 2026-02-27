# postman-to-sdk 🚀

> Turn your Postman collections into production-ready SDKs in seconds

[![npm version](https://badge.fury.io/js/postman-to-sdk.svg)](https://badge.fury.io/js/postman-to-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Quick Start (5 minutes to working SDK)

```bash
# Install globally
npm install -g postman-to-sdk

# Generate your first SDK
postman-to-sdk generate \
  --collection ./my-api.postman_collection.json \
  --language typescript \
  --output ./sdk

# Use it immediately
cd sdk && npm install
```

That's it! You'll have a fully-typed TypeScript SDK ready to use.

## What & Why

**What it does:** Converts Postman collections into type-safe SDKs with authentication, examples, and error handling.

**Why you need it:** Because manually converting Postman collections to code is tedious, error-prone, and nobody has time for that.

## Installation

```bash
# Global install (recommended)
npm install -g postman-to-sdk

# Or use npx (no install)
npx postman-to-sdk generate --collection ./api.json --language python
```

## Usage

### Basic Generation

```bash
# TypeScript SDK
postman-to-sdk generate \
  --collection ./api.postman_collection.json \
  --language typescript \
  --output ./my-sdk

# Python SDK
postman-to-sdk generate \
  --collection ./api.postman_collection.json \
  --language python \
  --output ./my-python-sdk
```

### Advanced Options

```bash
postman-to-sdk generate \
  --collection ./api.postman_collection.json \
  --language go \
  --output ./go-sdk \
  --package-name "github.com/yourorg/api-client" \
  --include-examples \
  --auth-type bearer \
  --base-url "https://api.example.com/v2"
```

### Programmatic Usage

```javascript
import { generateSDK } from 'postman-to-sdk';

await generateSDK({
  collection: './api.postman_collection.json',
  language: 'typescript',
  output: './sdk',
  options: {
    packageName: '@myorg/api-client',
    includeExamples: true
  }
});
```

## Generated SDK Structure

### TypeScript Output
```
sdk/
├── src/
│   ├── client.ts          # Main client class
│   ├── types.ts           # Generated types
│   ├── auth.ts            # Authentication handlers
│   └── index.ts           # Main export
├── examples/
│   └── basic-usage.ts     # Usage examples
├── package.json
├── tsconfig.json
└── README.md
```

### Python Output
```
sdk/
├── api_client/
│   ├── __init__.py
│   ├── client.py
│   ├── models.py          # Pydantic models
│   └── auth.py
├── examples/
│   └── usage.py
├── requirements.txt
├── setup.py
└── README.md
```

## Authentication Support

Automatically handles these auth types:

```javascript
// Bearer token
const client = new APIClient({
  auth: { type: 'bearer', token: 'your-token' }
});

// API Key
const client = new APIClient({
  auth: { 
    type: 'apikey', 
    key: 'x-api-key', 
    value: 'your-key',
    in: 'header' // or 'query'
  }
});

// Basic Auth
const client = new APIClient({
  auth: { 
    type: 'basic', 
    username: 'user', 
    password: 'pass' 
  }
});
```

## Examples

### TypeScript Usage
```typescript
import { APIClient } from './sdk';

const client = new APIClient({
  baseURL: 'https://api.example.com',
  auth: { type: 'bearer', token: process.env.API_TOKEN }
});

// All methods are typed!
const user = await client.users.getById({ id: '123' });
const newUser = await client.users.create({
  body: {
    name: 'John Doe',
    email: 'john@example.com'
  }
});
```

### Python Usage
```python
from api_client import APIClient

client = APIClient(
    base_url="https://api.example.com",
    auth={"type": "bearer", "token": os.getenv("API_TOKEN")}
)

# Typed with Pydantic models
user = client.users.get_by_id(id="123")
new_user = client.users.create(body=UserCreate(
    name="John Doe",
    email="john@example.com"
))
```

## Configuration

Create a `postman-to-sdk.config.js` file:

```javascript
module.exports = {
  // Default options
  language: 'typescript',
  includeExamples: true,
  packageName: '@myorg/api-client',
  
  // Language-specific configs
  typescript: {
    strict: true,
    target: 'es2020'
  },
  python: {
    async: true,
    usePydantic: true
  },
  go: {
    moduleName: 'github.com/yourorg/api-client'
  }
};
```

## Options Reference

| Option | Description | Default |
|--------|-------------|---------|
| `--language` | Target language (`typescript`, `python`, `go`) | Required |
| `--output` | Output directory | `./sdk` |
| `--package-name` | Package/module name | Auto-generated |
| `--base-url` | Override base URL | From collection |
| `--auth-type` | Force auth type | Auto-detected |
| `--include-examples` | Include usage examples | `false` |
| `--strict` | Strict type generation | `true` |

## Troubleshooting

### Common Issues

**Error: "Invalid collection format"**
```bash
# Export from Postman as Collection v2.1
# File → Export → Collection → Format: Collection v2.1
```

**Missing environment variables**
```bash
# Use --env flag
postman-to-sdk generate \
  --collection ./api.json \
  --env ./environment.json \
  --language typescript
```

**Large collections timeout**
```bash
# Increase timeout
postman-to-sdk generate \
  --collection ./huge-api.json \
  --language go \
  --timeout 30000
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Quick Contributor Setup
```bash
git clone https://github.com/yourorg/postman-to-sdk.git
cd postman-to-sdk
npm install
npm test
```

## Roadmap

- [ ] OpenAPI 3.0 support
- [ ] Java SDK generation
- [ ] Swift SDK generation
- [ ] GraphQL collections
- [ ] Custom templates
- [ ] VS Code extension

## License

MIT © [Your Name](https://github.com/yourname)

## Related

- [postman-code-generators](https://github.com/postmanlabs/postman-code-generators) - Official Postman codegen (limited languages)
- [openapi-generator](https://github.com/OpenAPITools/openapi-generator) - OpenAPI-based SDK generation
- [insomnia-to-sdk](https://github.com/yourorg/insomnia-to-sdk) - Similar tool for Insomnia

---

**Happy coding!** 🎉 Generated SDKs are production-ready and waiting for you.