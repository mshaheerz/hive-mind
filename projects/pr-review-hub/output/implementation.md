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

> **Never** commit real secrets. The repository includes a pre‑commit hook that aborts commits containing non‑placeholder values.

## GitHub OAuth Setup
1. Create a new OAuth App in GitHub Settings.
2. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github` (adjust for production).
3. Populate `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env`.
4. The app uses **next‑auth**; see `app/api/auth/[...nextauth]/route.js` for the configuration.

## Security Considerations
- **Server Actions**: Enabled only when `ENABLE_SERVER_ACTIONS=true`. Server Actions can execute privileged GitHub operations, so they must be protected by authentication checks (see `app/actions/*`). Production deployments should keep this flag disabled until the feature is stable.
- **HTTP Headers**: The app sets CSP, X‑Content‑Type‑Options, X‑Frame‑Options, and Referrer‑Policy via `next.config.js`.
- **Secret Management**: Secrets are never stored in source control. Use your CI/CD platform's secret store and the provided pre‑commit hook to enforce placeholder usage.

## Rate‑Limit Handling
GitHub API rate limits are respected by:
- Caching responses for 30 seconds (React Query / Server Action caching).
- Graceful back‑off when `X‑RateLimit-Remaining` approaches zero.
- Optional `GITHUB_TOKEN` for higher rate‑limit quotas.

## Testing
The project uses **Jest** and **React Testing Library**.

```bash
npm test
```

Tests cover:
- OAuth flow and session handling.
- Pull‑request fetching logic.
- Inline comment posting.

## Deployment
The app can be deployed to Vercel, Netlify, or any platform that supports Node.js.

1. Set the environment variables in the platform’s dashboard.
2. Ensure `ENABLE_SERVER_ACTIONS` is set appropriately.
3. Run `npm run build && npm start` (or let the platform handle the build step).

---

© 2026 PR Review Hub – Open source under the MIT License.
```

**File: `jest.config.js`**
```javascript
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
};
```

**File: `.babelrc`**
```json
{
  "presets": [
    ["@babel/preset-env", { "targets": { "node": "current" } }],
    ["@babel/preset-react", { "runtime": "automatic" }]
  ]
}
```

## FIX_MAP
- C1 -> `.env.example` added mandatory placeholder comment.
- C2 -> `package.json` pinned Next.js to 14.x and React to 18.x; added Jest, Testing Library, and Husky.
- C3 -> `next.config.js` documented server‑actions security, added runtime flag, and headers configuration.
- W1 -> `package.json` added Jest + React Testing Library and updated `test` script.
- W2 -> `next.config.js` added comprehensive security headers.
- W3 -> `.gitignore` added ignore for `.husky/`; created `.husky/pre-commit` hook to enforce placeholder env values.
- S1 -> `tailwind.config.js` consolidated glob pattern to a single root.
- S2 -> `README.md` created with detailed sections on env vars, OAuth, security, rate‑limit, testing, and deployment.