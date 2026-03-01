 **File: `package.json`**
```json
{
  "name": "api-docs-generator",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "next": "^13.2.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "generate-docs": "python src/api/generate_docs.py"
  }
}
```

**File: `src/api/api_data.json`**
```json
{
  "endpoints": [
    {
      "path": "/example",
      "method": "GET",
      "summary": "Example endpoint summary",
      "description": "This is an example endpoint for demonstration purposes.",
      "parameters": [],
      "responses": {
        "200": {
          "description": "Success response",
          "schema": {}
        },
        "404": {
          "description": "Not found"
        }
      }
    }
  ]
}
```

**File: `src/api/generate_docs.py`**
```python
import json
import requests

def fetch_api_data():
    response = requests.get('http://example.com/api-spec')
    return response.json()

def main():
    api_data = fetch_api_data()
    with open('api_data.json', 'w') as f:
        json.dump(api_data, f)

if __name__ == "__main__":
    main()
```

**File: `public/index.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Documentation</title>
</head>
<body>
    <h1>API Documentation</h1>
    <ul id="endpoints"></ul>
    <script src="/_next/static/chunks/pages/index.js"></script>
</body>
</html>
```

**File: `.gitignore`**
```plaintext
node_modules
*.log
*.env
src/api/api_data.json
```

## FIX_MAP
- ID1 -> Added `generate-docs` script to package.json and updated Python script for API data collection (`src/api/generate_docs.py`).