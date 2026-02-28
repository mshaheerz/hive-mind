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
    "test": "jest"
  },
  "dependencies": {
    "next": "^12.0.0",
    "react": "^17.0.0",
    "react-dom": "^17.0.0",
    "@redoc/react": "^0.2.0"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.6",
    "tailwindcss": "^3.0.0",
    "jest": "^29.0.0",
    "@testing-library/react": "^13.0.0",
    "@testing-library/jest-dom": "^5.16.0"
  }
}
```

**File: `.gitignore`**
```plaintext
node_modules
.next
dist
*.log
*.env
```

**File: `.env.example`**
```dotenv
# Example environment configuration.
# Do NOT commit real secrets. Replace placeholders with actual values in a local .env file.

# API key used by the documentation generator (if needed for external services)
# Example: API_KEY=abcdef123456
API_KEY=your_api_key_here

# Enable or disable debug mode (true|false)
DEBUG=false

# Logging level (error, warn, info, debug)
LOG_LEVEL=info

# Optional process identifier for multi‑process setups
PROCESS_ID=0
```

**File: `tailwind.config.js`**
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind scans all files under src for class names
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
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
 * Custom App component to inject global styles.
 * Tailwind CSS is imported here so every page has access to the utility classes.
 */

import '../styles/globals.css';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  // Ensure the page scrolls to top on navigation (nice UX)
  useEffect(() => {
    const handleRouteChange = () => window.scrollTo(0, 0);
    // Next.js router events could be added here if needed
    return () => {};
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
```

**File: `src/pages/index.js`**
```jsx
/**
 * Landing page – a simple welcome screen.
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
 * Documentation page.
 * Renders the OpenAPI specification using Redoc.
 */

import { RedocStandalone } from '@redoc/react';
import { useEffect, useState } from 'react';

const SPEC_ENDPOINT = '/api/openapi';

export default function Docs() {
  const [specUrl, setSpecUrl] = useState(null);
  const [error, setError] = useState(null);

  // Load the spec URL once the component mounts
  useEffect(() => {
    // In a production build we could pre‑fetch the JSON, but for simplicity we just set the endpoint
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

  // While the spec URL is being prepared, show a loading indicator
  if (!specUrl) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Loading documentation...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <RedocStandalone
        specUrl={specUrl}
        options={{
          hideDownloadButton: false,
          theme: { colors: { primary: { main: '#2563EB' } } }
        }}
      />
    </div>
  );
}
```

**File: `src/pages/api/openapi.js`**
```js
/**
 * API route that returns the OpenAPI specification as JSON.
 * The spec is stored in `src/api/api_data.json`.
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Reads the OpenAPI JSON file from disk.
 * @returns {Promise<object>} Parsed JSON object.
 */
async function readSpecFile() {
  const filePath = path.join(process.cwd(), 'src', 'api', 'api_data.json');
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

/**
 * Next.js API handler.
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
export default async function handler(req, res) {
  try {
    const spec = await readSpecFile();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(spec);
  } catch (err) {
    console.error('Failed to read OpenAPI spec:', err);
    res.status(500).json({ error: 'Unable to load API specification' });
  }
}
```

**File: `src/api/api_data.json`**
```json
{
  "openapi": "3.0.2",
  "info": {
    "title": "Sample API",
    "version":