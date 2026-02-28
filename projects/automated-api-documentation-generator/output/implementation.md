**File: `package.json`**
```json
{
  "name": "api-doc-generator",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "generate-docs": "python src/generate_docs.py"
  },
  "dependencies": {
    "next": "^12.0.0",
    "react": "^17.0.0",
    "react-dom": "^17.0.0",
    "@redoc/react": "^0.2.0",
    "@tailwindcss/aspect-ratio": "^0.4.2"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.6",
    "tailwindcss": "^3.0.0",
    "jest": "^29.0.0",
    "@testing-library/react": "^13.0.0",
    "@testing-library/jest-dom": "^5.16.0",
    "supertest": "^6.3.3"
  }
}
```

**File: `.gitignore`**
```gitignore
node_modules
.next
dist
*.log
*.env
.env.local
.env.development
.env.production
*.pid
```

**File: `.env.example`**
```dotenv
# -------------------------------------------------
# Example environment configuration.
# -------------------------------------------------
# Do NOT commit real secrets. Replace placeholders with actual values in a local .env file.

# Logging level (error, warn, info, debug). Default is 'info'.
LOG_LEVEL=info

# Optional process identifier for multi‑process setups. Default is '0'.
PROCESS_ID=0
```

**File: `tailwind.config.js`**
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind scans all files under src and pages for class names
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: [
    // Aspect ratio plugin is optional but added for future UI components
    // Requires version ^0.4.2 as per project policy
    require('@tailwindcss/aspect-ratio')
  ]
};
```

**File: `postcss.config.js`**
```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

**File: `src/pages/_app.js`**
```js
/**
 * @fileoverview Custom App component to inject global styles and initialise Tailwind.
 * This file ensures every page has access to Tailwind utilities.
 */

import '../styles/globals.css';
import { useEffect } from 'react';

/**
 * Root component wrapper for all Next.js pages.
 *
 * @param {object} props - Component props.
 * @param {React.ComponentType} props.Component - Active page component.
 * @param {object} props.pageProps - Props for the page.
 * @returns {JSX.Element}
 */
export default function MyApp({ Component, pageProps }) {
  // Scroll to top on route changes – simple UX improvement.
  useEffect(() => {
    const handleRouteChange = () => window.scrollTo(0, 0);
    // In a full implementation you could subscribe to router events here.
    return () => {};
  }, []);

  return <Component {...pageProps} />;
}
```

**File: `src/pages/index.jsx`**
```jsx
/**
 * @fileoverview Landing page – a simple welcome screen.
 */

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <h1 className="text-3xl font-bold underline">
        Welcome to API Documentation Generator!
      </h1>
    </div>
  );
}
```

**File: `src/pages/docs.jsx`**
```jsx
/**
 * @fileoverview Documentation page.
 * Renders the OpenAPI specification using Redoc.
 */

import { RedocStandalone } from '@redoc/react';
import { useEffect, useState } from 'react';

const SPEC_ENDPOINT = '/api/openapi';

/**
 * Docs component – fetches the spec URL and renders Redoc.
 *
 * @returns {JSX.Element}
 */
export default function Docs() {
  const [specUrl, setSpecUrl] = useState(null);
  const [error, setError] = useState(null);

  // Initialise the spec URL once the component mounts.
  useEffect(() => {
    setSpecUrl(SPEC_ENDPOINT);
  }, []);

  if (error) {
    return (
      <div className="p-8 text-red-600">
        <h2 className="text-xl font-semibold">Failed to load documentation</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  if (!specUrl) {
    return (
      <div className="p-8">
        <p>Loading documentation...</p>
      </div>
    );
  }

  return (
    <RedocStandalone specUrl={specUrl} />
  );
}
```

**File: `src/pages/api/openapi.js`**
```js
/**
 * @fileoverview API route that returns the generated OpenAPI specification.
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Absolute path to the generated OpenAPI JSON file.
 */
const SPEC_PATH = path.join(process.cwd(), 'src', 'api', 'api_data.json');

/**
 * GET handler for /api/openapi.
 *
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
export default async function handler(req, res) {
  try {
    const data = await fs.readFile(SPEC_PATH, 'utf-8');
    const json = JSON.parse(data);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(json);
  } catch (err) {
    console.error('Failed to read OpenAPI spec:', err);
    res.status(500).json({ error: 'Unable to load API documentation.' });
  }
}
```

**File: `src/api/api_data.json`**
```json
{
  "openapi": "3.0.2",
  "info": {
    "title": "Sample API",
    "version": "1.0.0",
    "description": "A minimal example API used for demonstrating the documentation generator."
  },
  "paths": {
    "/hello": {
      "get": {
        "summary": "Greeting endpoint",
        "description": "Returns a friendly greeting.",
        "responses": {
          "200": {
            "description": "Successful greeting",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Hello, world!"
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

**File: `src/generate_docs.py`**
```python
"""
@fileoverview generate_docs.py
Generates a basic OpenAPI specification JSON file for the sample API.
The script can be extended to parse real source code/comments.
"""

import json
from pathlib import Path

# Named constants
OUTPUT_PATH = Path(__file__).parent / "api_data.json"

# Sample OpenAPI spec (kept minimal for demonstration)
SPEC = {
    "openapi": "3.0.2",
    "info": {
        "title": "Sample API",
        "version": "1.0.0",
        "description": "A minimal example API used for demonstrating the documentation generator."
    },
    "paths": {
        "/hello": {
            "get": {
                "summary": "Greeting endpoint",
                "description": "Returns a friendly greeting.",
                "responses": {
                    "200": {
                        "description": "Successful greeting",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "message": {
                                            "type": "string",
                                            "example": "Hello, world!"
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


def main() -> None:
    """Write SPEC to OUTPUT_PATH handling any I/O errors."""
    try:
        OUTPUT_PATH.write_text(json.dumps(SPEC, indent=2))
        print(f"OpenAPI spec written to {OUTPUT_PATH}")
    except OSError as exc:
        print(f"Failed to write OpenAPI spec: {exc}")


if __name__ == "__main__":
    main()
```

**File: `__tests__/api.test.js`**
```js
/**
 * @fileoverview Integration test for the /api/openapi endpoint.
 */

const request = require('supertest');
const next = require('next');

let server;
let app;

beforeAll(async () => {
  const dev = process.env.NODE_ENV !== 'production';
  app = next({ dev });
  await app.prepare();
  const handle = app.getRequestHandler();

  // Create a minimal server that forwards to Next.js handler
  const express = require('express');
  const expressApp = express();
  expressApp.all('*', (req, res) => handle(req, res));
  server = expressApp.listen(0); // random open port
});

afterAll(() => {
  server.close();
});

test('GET /api/openapi returns JSON spec', async () => {
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const response = await request(baseUrl).get('/api/openapi');
  expect(response.status).toBe(200);
  expect(response.headers['content-type']).toMatch(/application\/json/);
  expect(response.body).toHaveProperty('openapi');
  expect(response.body).toHaveProperty('info');
  expect(response.body).toHaveProperty('paths');
});
```

## FIX_MAP
- L1 -> Updated `.env.example` to remove explicit API_KEY and DEBUG placeholders and only expose safe, non‑secret variables.
- L2 -> Added `*.pid` to `.gitignore` and ensured `.env.example` contains only non‑sensitive defaults for LOG_LEVEL and PROCESS_ID.
- L3 -> Added robust error handling in the API route (`src/pages/api/openapi.js`) and in the Python generation script.
- L4 -> Same change as L1 (see `.env.example`).
- L5 -> Same change as L2 (see `.gitignore`).

## Dependencies
**Node (npm)**
- next (>=12.0.0 <13.0.0)
- react (>=17.0.0 <18.0.0)
- react-dom (>=17.0.0 <18.0.0)
- @redoc/react (>=0.2.0 <0.3.0)
- @tailwindcss/aspect-ratio (^0.4.2)
- tailwindcss (>=3.0.0 <4.0.0)
- autoprefixer (>=10.4.0 <11.0.0)
- postcss (>=8.4.6 <9.0.0)
- jest (>=29.0.0 <30.0.0)
- @testing-library/react (>=13.0.0 <14.0.0)
- @testing-library/jest-dom (>=5.16.0 <6.0.0)
- supertest (>=6.3.3 <7.0.0)

**Python**
- No external packages required (uses built‑in `json` and `pathlib`).