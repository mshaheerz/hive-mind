 **File: `package.json`**
```json
{
  "name": "api-documentation-generator",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "swagger-js": "^3.45.2",
    "redoc": "^2.0.0"
  },
  "scripts": {
    "generate-docs": "node generate_docs.js",
    "start": "next start",
    "dev": "next dev"
  },
  "engines": {
    "node": "14.x"
  }
}
```

**File: `src/generate_docs.js`**
```javascript
const swaggerJsClient = require('swagger-js');
const fs = require('fs');
const path = require('path');

async function generateDocs() {
  const apiSpecPath = path.join(__dirname, '../api/api_data.json');
  if (!fs.existsSync(apiSpecPath)) {
    console.error("API specification file does not exist.");
    return;
  }

  try {
    const data = fs.readFileSync(apiSpecPath);
    const apiSpec = JSON.parse(data);

    // Use swagger-js to generate documentation from the API spec
    const redocOutputPath = path.join(__dirname, '../public/index.html');
    await require('redoc').default.generate({
      openApi: apiSpec,
      theme: {
        sidebar: {
          width: '30%'
        }
      },
      layout: "StandaloneLayout"
    }, redocOutputPath);

    console.log("Documentation generated successfully.");
  } catch (error) {
    console.error("Error generating documentation:", error);
  }
}

generateDocs();
```

**File: `public/index.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/redoc@next/bundles/redoc.standalone.css">
</head>
<body>
  <div id="redoc-container"></div>
  <script src="https://unpkg.com/redoc@next/bundles/redoc.standalone.js"></script>
  <script>
    Redoc.init('api/api_data.json', {}, document.getElementById("redoc-container"));
  </script>
</body>
</html>
```

**File: `src/api/api_data.json`**
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Sample API",
    "version": "1.0.0"
  },
  "paths": {
    "/users": {
      "get": {
        "summary": "Get users list",
        "responses": {
          "200": {
            "description": "A list of users.",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "properties": {
                      "id": {
                        "type": "integer"
                      },
                      "name": {
                        "type": "string"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## FIX_MAP
- GEN-1 -> Added `package.json`, `src/generate_docs.js`, and `public/index.html` files to project setup for API documentation generation.