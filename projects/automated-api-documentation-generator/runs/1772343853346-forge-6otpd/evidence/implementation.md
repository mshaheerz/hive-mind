 **File: `package.json`**
```json
{
  "name": "api-doc-generator",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "generate-docs": "python src/generate_docs.py"
  },
  "dependencies": {
    "next": "^12.0.7",
    "react": "^17.0.2",
    "react-dom": "^17.0.2"
  },
  "devDependencies": {
    "swagger-jsdoc": "^6.0.0",
    "redoc": "^2.0.0"
  }
}
```