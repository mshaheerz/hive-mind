**File: `package.json`**
```json
{
  "name": "pr-review-hub",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest --coverage",
    "lint": "next lint",
    "prepare": "husky install"
  },
  "dependencies": {
    "@octokit/rest": "^20.0.2",
    "autoprefixer": "^10.4.15",
    "lucide-react": "^0.363.0",
    "next": "14.2.5",
    "next-auth": "^4.24.7",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "tailwindcss": "^3.4.1"
  },
  "devDependencies": {
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.5",
    "postcss": "^8.4.31",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/user-event": "^14.5.2",
    "babel-jest": "^29.7.0",
    "@babel/preset-env": "^7.24.0",
    "@babel/preset-react": "^7.24.0",
    "husky": "^9.0.0"
  }
}
```