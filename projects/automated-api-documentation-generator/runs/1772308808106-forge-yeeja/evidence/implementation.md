**File: `package.json`**
```json
{
  "name": "api-doc-generator",
  "version": "1.0.0",
  "description": "Automated API Documentation Generator",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "test": "jest --watch=false"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    // add runtime dependencies here as needed, e.g.:
    // "express": "^4.18.2"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  },
  "jest": {
    "testEnvironment": "node"
  }
}
```

---

### Key Decisions
1. **Added `jest` as a devDependency** – ensures the test runner is installed locally.
2. **Configured Jest to use the built‑in `node` test environment** – avoids the missing `jest-environment-jsdom` error that occurs when the default environment is set to `jsdom` without the package being present.
3. **Kept the existing test script** – `npm test` will now execute Jest with the correct environment.

### Dependencies Needed
- `jest` (devDependency) – testing framework.  

Run `npm install` to install the new dependency, then `npm test` should execute without the previous environment error.