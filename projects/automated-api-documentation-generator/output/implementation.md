 **File: `package.json`**
```json
{
  "name": "api-doc-generator",
  "version": "1.0.0",
  "description": "Automated API Documentation Generator for complex systems",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^12.0.7",
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "swagger-jsdoc": "^6.1.0",
    "redoc": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^14.14.32",
    "@types/react": "^17.0.0",
    "@types/react-dom": "^17.0.3",
    "typescript": "^4.1.2"
  }
}
```

**File: `.gitignore`**
```
node_modules
*.env
*.log
*.pid
*.seed
*.status
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*
```

**File: `.env.example`**
```
# API_KEY=your_api_key_here
# DEBUG=true
```

**File: `src/pages/index.js`**
```jsx
import Head from 'next/head';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Redoc from 'redoc';

export default function Home() {
  const [apiDocs, setApiDocs] = useState(null);

  useEffect(() => {
    async function fetchApiDocs() {
      try {
        const response = await axios.get('/api/docs');
        setApiDocs(response.data);
      } catch (error) {
        console.error('Error fetching API documentation:', error);
      }
    }

    fetchApiDocs();
  }, []);

  return (
    <div>
      <Head>
        <title>API Documentation</title>
        <meta name="description" content="Generated API documentation" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="p-4">
        {apiDocs ? (
          <Redoc spec={apiDocs} />
        ) : (
          <p>Loading API Documentation...</p>
        )}
      </main>
    </div>
  );
}
```

**File: `src/pages/api/docs.js`**
```js
import { generateApiDoc } from '../../utils/generateDocs';

export default function handler(req, res) {
  const apiDocumentation = generateApiDoc();
  res.status(200).json(apiDocumentation);
}
```

**File: `src/utils/generateDocs.js`**
```javascript
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'Generated API documentation for complex systems'
    }
  },
  apis: ['./src/routes/*.js'] // Adjust the path to your API route files
};

const swaggerSpec = swaggerJSDoc(options);

function generateApiDoc() {
  return swaggerSpec;
}

module.exports = { generateApiDoc };
```

**File: `src/routes/index.js`**
```javascript
/**
 * @swagger/index.js - Sample API endpoint documentation
 */
const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api:
 *   get:
 *     summary: Returns the list of users
 *     responses:
 *       200:
 *         description: A list of users
 */
router.get('/', (req, res) => {
  res.json({ message: 'API Documentation Example' });
});

module.exports = router;
```

**Dependencies:**
- "next": "^12.0.7"
- "react": "^17.0.2"
- "react-dom": "^17.0.2"
- "swagger-jsdoc": "^6.1.0"
- "redoc": "^2.0.0"
- "@types/node": "^14.14.32"
- "@types/react": "^17.0.0"
- "@types/react-dom": "^17.0.3"
- "typescript": "^4.1.2"