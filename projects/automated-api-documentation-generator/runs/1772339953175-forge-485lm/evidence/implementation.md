 **File: `package.json`**
```json
{
  "name": "api-documentation-generator",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^12.0.0",
    "react": "^17.0.0",
    "react-dom": "^17.0.0"
  },
  "devDependencies": {
    "@types/node": "^16.0.0",
    "@types/react": "^17.0.0",
    "@types/react-dom": "^17.0.0",
    "typescript": "^4.5.0"
  }
}
```

**File: `.gitignore`**
```plaintext
node_modules
.next
*.log*
```

**File: `src/api/generate_docs.py`**
```python
import requests
import json
from openapi import OpenAPI

def fetch_openapi_spec(url):
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception("Failed to retrieve OpenAPI spec")

def generate_documentation(api_data, output_file):
    openapi = OpenAPI(api_data)
    with open(output_file, 'w') as f:
        json.dump(openapi.to_dict(), f, indent=4)

if __name__ == "__main__":
    api_url = "https://petstore.swagger.io/v2/swagger.json"  # Example API URL
    output_file = "src/api/api_data.json"
    api_data = fetch_openapi_spec(api_url)
    generate_documentation(api_data, output_file)
```

**File: `src/docs/index.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <style>
    /* Basic styles for the documentation */
    body { font-family: Arial, sans-serif; }
    .container { padding: 20px; }
    .endpoint { margin-bottom: 30px; }
    h1, h2 { color: #333; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>API Documentation</h1>
    <!-- Placeholder for dynamically loaded documentation -->
  </div>
</body>
</html>
```

**File: `src/generate_docs.py`**
```python
import requests
import json
from openapi import OpenAPI

def fetch_openapi_spec(url):
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception("Failed to retrieve OpenAPI spec")

def generate_documentation(api_data, output_file):
    openapi = OpenAPI(api_data)
    with open(output_file, 'w') as f:
        json.dump(openapi.to_dict(), f, indent=4)

if __name__ == "__main__":
    api_url = "https://petstore.swagger.io/v2/swagger.json"  # Example API URL
    output_file = "src/api/api_data.json"
    api_data = fetch_openapi_spec(api_url)
    generate_documentation(api_data, output_file)
```

## FIX_MAP
- FE01 -> Added `react` and `react-dom` dependencies to `package.json` for Next.js project setup.