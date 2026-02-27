# postman-to-sdk

> Turn your Postman collections into production-ready SDKs in seconds

[![npm version](https://badge.fury.io/js/postman-to-sdk.svg)](https://badge.fury.io/js/postman-to-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/postman-to-sdk.svg)](https://npmjs.org/package/postman-to-sdk)

## Quick Start (5 minutes)

1. **Install globally**
   ```bash
   npm install -g postman-to-sdk
   ```

2. **Export your Postman collection**
   - Open Postman → Right-click your collection → Export → Collection v2.1
   - Save as `my-api.json`

3. **Generate your SDK**
   ```bash
   postman-to-sdk generate my-api.json --lang typescript --output ./sdk
   ```

4. **Use it immediately**
   ```typescript
   import { ApiClient } from './sdk';
   
   const client = new ApiClient({
     baseUrl: 'https://api.example.com',
     apiKey: process.env.API_KEY
   });
   
   const users = await client.users.list({ limit: 10 });
   ```

## Why postman-to-sdk?

**The Problem:** You've spent hours perfecting your API in Postman. Now you need to:
- Write client code for TypeScript, Python, and Go
- Handle complex authentication flows
- Keep examples in sync with your collection
- Maintain type safety across languages

**The Solution:** One command generates everything from your existing Postman collection.

## Features

- 🚀 **Multi-language support**: TypeScript, Python, Go (with more coming)
- 🔒 **Smart auth handling**: Supports Bearer tokens, API keys, OAuth 2.0, Basic Auth
- 📋 **Type-safe examples**: Converts Postman examples into strongly-typed response objects
- 🎯 **Environment variables**: Resolves Postman environments automatically
- 📦 **Package ready**: Generated SDKs include package.json, requirements.txt, or go.mod
- 🧪 **Tested examples**: Every endpoint includes working code examples
- 🔄 **Incremental updates**: Regenerate without losing your custom code

## Installation

### Global (Recommended)
```bash
npm install -g postman-to-sdk
```

### Local (Per project)
```bash
npm install --save-dev postman-to-sdk
```

### NPX (No install)
```bash
npx postman-to-sdk generate collection.json
```

## Usage

### Basic Generation

```bash
# Generate TypeScript SDK (default)
postman-to-sdk generate my-api.json

# Generate Python SDK
postman-to-sdk generate my-api.json --lang python

# Specify output directory
postman-to-sdk generate my-api.json --output ./generated-sdk
```

### Advanced Options

```bash
# Use Postman environment
postman-to-sdk generate collection.json --env production.json

# Custom package name
postman-to-sdk generate collection.json --package-name "@mycompany/api-client"

# Include deprecated endpoints
postman-to-sdk generate collection.json --include-deprecated

# Generate for multiple languages
postman-to-sdk generate collection.json --lang typescript,python,go
```

### Interactive Mode

```bash
postman-to-sdk init
# Walks through options interactively
```

## Generated Code Examples

### TypeScript
```typescript
import { PetStoreClient } from './petstore-sdk';

const client = new PetStoreClient({
  baseUrl: 'https://petstore.swagger.io/v2',
  apiKey: 'your-api-key'
});

// Create a pet
const newPet = await client.pet.create({
  name: 'Fluffy',
  category: { id: 1, name: 'Dogs' },
  status: 'available'
});

// Find pets by status
const availablePets = await client.pet.findByStatus(['available']);
```

### Python
```python
from petstore_sdk import PetStoreClient

client = PetStoreClient(
    base_url='https://petstore.swagger.io/v2',
    api_key='your-api-key'
)

# Create a pet
new_pet = client.pet.create(
    name='Fluffy',
    category={'id': 1, 'name': 'Dogs'},
    status='available'
)

# Find pets by status
available_pets = client.pet.find_by_status(['available'])
```

### Go
```go
import "github.com/myorg/petstore-sdk"

client := petstore.NewClient("https://petstore.swagger.io/v2", "your-api-key")

// Create a pet
pet, err := client.Pet.Create(&petstore.Pet{
    Name:     "Fluffy",
    Category: &petstore.Category{ID: 1, Name: "Dogs"},
    Status:   "available",
})

// Find pets by status
pets, err := client.Pet.FindByStatus([]string{"available"})
```

## Configuration

### Postman Collection Requirements

Your collection should:
- Use Postman Collection Format v2.1
- Define authentication at collection or folder level
- Include example responses for better type generation
- Use meaningful request names (becomes method names)

### Environment Files

Postman environment files are automatically parsed for:
- Base URLs
- Authentication tokens
- Custom variables

Example:
```json
{
  "name": "Production",
  "values": [
    {
      "key": "baseUrl",
      "value": "https://api.production.com",
      "enabled": true
    },
    {
      "key": "apiKey",
      "value": "{{$guid}}",
      "enabled": true
    }
  ]
}
```

## Authentication Support

| Auth Type | TypeScript | Python | Go |
|-----------|------------|--------|-----|
| Bearer Token | ✅ | ✅ | ✅ |
| API Key | ✅ | ✅ | ✅ |
| Basic Auth | ✅ | ✅ | ✅ |
| OAuth 2.0 | ✅ | ✅ | ✅ |
| Digest Auth | ✅ | ✅ | ✅ |
| Hawk Authentication | ✅ | ✅ | ✅ |

## API Reference

### CLI Commands

#### `generate <collection>`
Generate SDK from Postman collection

**Options:**
- `--lang, -l`: Target language (typescript, python, go)
- `--output, -o`: Output directory
- `--env, -e`: Postman environment file
- `--package-name, -p`: Package name for generated SDK
- `--include-deprecated`: Include deprecated endpoints

#### `validate <collection>`
Validate Postman collection format

#### `init`
Interactive setup wizard

## Examples

### Generating Stripe-like SDK
```bash
# Export your Stripe collection from Postman
postman-to-sdk generate stripe-api.json \
  --lang typescript \
  --package-name "@yourorg/stripe-client" \
  --output ./stripe-sdk
```

### CI/CD Integration
```yaml
# .github/workflows/generate-sdk.yml
name: Generate SDK
on:
  push:
    paths:
      - 'api/*.json'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Generate SDK
        run: |
          npx postman-to-sdk generate api/collection.json \
            --lang typescript,python \
            --output generated/
      
      - name: Commit changes
        run: |
          git add generated/
          git commit -m "chore: update generated SDK" || exit 0
          git push
```

## Troubleshooting

### "Invalid collection format"
- Ensure you're using Collection v2.1 format
- Validate with: `postman-to-sdk validate my-collection.json`

### "Missing authentication"
- Define auth at collection level in Postman
- Or pass auth via environment variables

### Generated types are too broad
- Add more examples to your Postman requests
- The tool uses examples to infer types

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors
```bash
git clone https://github.com/yourorg/postman-to-sdk.git
cd postman-to-sdk
npm install
npm run dev
```

## Roadmap

- [ ] Java SDK support
- [ ] C# SDK support
- [ ] GraphQL collection support
- [ ] Custom template support
- [ ] IDE extensions
- [ ] Mock server generation

## License

MIT © [Your Name]

---

**Made with ❤️ for developers who hate writing boilerplate client code**