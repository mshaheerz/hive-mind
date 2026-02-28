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
    "@redoc/react": "^0.2.0"
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
```

**File: `.env.example`**
```dotenv
# -------------------------------------------------
# Example environment configuration.
# -------------------------------------------------
# Do NOT commit real secrets. Replace placeholders with actual values in a local .env file.

# API key used by the documentation generator (if needed for external services)
# Replace with your real key in .env – do not commit real keys.
# API_KEY=your_real_api_key

# Enable or disable debug mode (true|false)
# DEBUG=true

# Logging level (error, warn, info, debug)
# LOG_LEVEL=info

# Optional process identifier for multi‑process setups
# PROCESS_ID=0
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
 * @param {object} props.pageProps - Props for the active page.
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
      <div className