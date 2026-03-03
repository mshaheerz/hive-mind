**File: `.env.example`**
```dotenv
# ------------------------------------------------------------
# IMPORTANT: These values are placeholders ONLY.
# NEVER commit real secrets or production credentials.
# CI/CD pipelines should enforce that only placeholder values
# exist in this file (e.g., using a secret‑scan pre‑commit hook).
# ------------------------------------------------------------
APP_ENV=development
NEXTAUTH_SECRET=your-nextauth-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
# Optional personal access token for server‑side actions (fallback)
GITHUB_TOKEN=your-github-pat
```

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
    "@prisma/client": "^5.12.0",
    "autoprefixer": "^10.4.15",
    "lucide-react": "^0.363.0",
    "next": "14.2.5",
    "next-auth": "^4.24.7",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "tailwindcss": "^3.4.1"
  },
  "devDependencies": {
    "eslint": "9.5.0",
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

**File: `next.config.js`**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions are powerful but can expose privileged operations.
    // They should only be enabled for authenticated GitHub users.
    // Production environments should keep this disabled unless the
    // feature is officially stable.
    serverActions: process.env.ENABLE_SERVER_ACTIONS === 'true',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },

  // Security‑related HTTP headers
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; img-src https: data:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.github.com;",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

**File: `.gitignore`**
```gitignore
.DS_Store
*.log
.env
.env.local
.env.production

node_modules/
.next/
out/
coverage/
.turbo/

# Husky hooks (generated, but keep versioned)
.husky/
```

**File: `.husky/pre-commit`**
```bash
#!/bin/sh
# ------------------------------------------------------------
# Pre‑commit hook: abort if any .env file contains non‑placeholder values.
# This helps enforce the policy described in `.env.example`.
# ------------------------------------------------------------

# Find tracked or newly added .env files
files=$(git ls-files -m -o --exclude-standard | grep -E '^\.env(\..*)?$')
if [ -z "$files" ]; then
  exit 0
fi

# Define allowed placeholder patterns (adjust if you add more)
allowed_patterns='^(APP_ENV=development|NEXTAUTH_SECRET=your-nextauth-secret|GITHUB_CLIENT_ID=your-github-client-id|GITHUB_CLIENT_SECRET=your-github-client-secret|GITHUB_TOKEN=your-github-pat)$'

for f in $files; do
  if grep -vE "$allowed_patterns" "$f" > /dev/null; then
    echo "Error: $f contains non‑placeholder secret values. Commit aborted."
    exit 1
  fi
done

exit 0
```

**File: `tailwind.config.js`**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**File: `README.md`**
```markdown
# PR Review Hub

A self‑hosted dashboard that aggregates open Pull Requests from multiple GitHub repositories, allowing developers to review and comment inline without leaving the app.

## Table of Contents
- [Features](#features)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [GitHub OAuth Setup](#github-oauth-setup)
- [Security Considerations](#security-considerations)
- [Rate‑Limit Handling](#rate-limit-handling)
- [Testing](#testing)
- [Deployment](#deployment)

## Features
- Aggregate open PRs from ≥ 5 repositories.
- Inline commenting that syncs back to GitHub.
- Real‑time refresh (≤ 30 s) using Server Actions.
- GitHub OAuth authentication respecting repository permissions.

## Quick Start
```bash
# Clone the repo
git clone https://github.com/your-org/pr-review-hub.git
cd pr-review-hub

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env
# edit .env with your own values

# Run locally
npm run dev
```

## Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `APP_ENV` | Application mode (development/production) | `development` |
| `NEXTAUTH_SECRET` | Secret for NextAuth session encryption | `your-nextauth-secret` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID | `your-github-client-id` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret | `your-github-client-secret` |
| `GITHUB_TOKEN` *(optional)* | Personal Access Token used for server‑side GitHub actions when a user token is not available | `your-github-pat` |

> **Never** commit real secrets. The repository includes a pre‑commit hook that aborts commits containing non‑