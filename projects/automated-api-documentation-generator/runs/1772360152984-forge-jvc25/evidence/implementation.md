 ```json
{
  "setup": {
    "name": "My New Project",
    "version": "1.0.0",
    "dependencies": {
      "react": "^17.0.2",
      "react-dom": "^17.0.2",
      "next": "^12.0.0"
    },
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start"
    }
  },
  "configFiles": [
    {
      "file": ".env.local",
      "content": "NEXT_PUBLIC_API_KEY=your_api_key_here"
    },
    {
      "file": "next.config.js",
      "content": "module.exports = {\n  publicRuntimeConfig: {\n    apiKey: process.env.NEXT_PUBLIC_API_KEY,\n  },\n};"
    }
  ]
}
```