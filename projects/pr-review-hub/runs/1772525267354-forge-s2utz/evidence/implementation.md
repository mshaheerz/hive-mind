**File: `next.config.js`**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions are only enabled in development (or when explicitly allowed).
    // In production they stay disabled unless both conditions are true.
    serverActions:
      process.env.NODE_ENV === 'development' &&
      process.env.ENABLE_SERVER_ACTIONS === 'true',
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
    // Generate a nonce for inline styles (if ever needed). For now we avoid
    // unsafe‑inline completely and rely on Tailwind‑generated external CSS.
    const styleNonce = ''; // placeholder – can be populated via a middleware if required
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; img-src https: data:; script-src 'self'; style-src 'self'${styleNonce ? ` 'nonce-${styleNonce}'` : ''}; connect-src 'self' https://api.github.com;`,
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

# ignore any env file anywhere in the repo
**/.env*

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

# Find tracked or newly added .env files (any .env* file)
files=$(git ls-files -m -o --exclude-standard | grep -E '^\.env(\..*)?$')
if [ -z "$files" ]; then
  exit 0
fi

# Allowed placeholder patterns (one per line for readability)
allowed_patterns='^APP_ENV=development$'
allowed_patterns="${allowed_patterns}\n^NEXTAUTH_SECRET=your-nextauth-secret$"
allowed_patterns="${allowed_patterns}\n^GITHUB_CLIENT_ID=your-github-client-id$"
allowed_patterns="${allowed_patterns}\n^GITHUB_CLIENT_SECRET=your-github-client-secret$"
allowed_patterns="${allowed_patterns}\n^GITHUB_TOKEN=your-github-pat$"

# Build a grep pattern that matches any allowed line
allowed_grep=$(printf "%s\n" "$allowed_patterns" | paste -sd'|' -)

for f in $files; do
  # If any line does NOT match an allowed placeholder, abort
  if grep -vE "$allowed_grep" "$f" > /dev/null; then
    echo "Error: $f contains non‑placeholder secret values. Commit aborted."
    exit 1
  fi
done

exit 0
```

**File: `README.md`**
```markdown
# PR Review Hub

A self‑hosted dashboard that aggregates open Pull Requests from multiple GitHub repositories, allowing developers to review and comment inline without leaving the app.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [GitHub OAuth Setup](#github-oauth-setup)
- [Running the App](#running-the-app)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security Considerations](#security-considerations)
- [Rate‑Limit Handling](#rate-limit-handling)

## Features
- Aggregate open PRs from ≥ 5 repositories.
- Inline commenting that syncs back to GitHub.
- Real‑time refresh (≤ 30 s) using Server Actions.
- GitHub OAuth authentication respecting repository permissions.

## Installation

```bash
git clone https://github.com/your-org/pr-review-hub.git
cd pr-review-hub
npm install
npm run prepare   # sets up Husky git hooks
```

## Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

| Variable                | Description                                    |
|-------------------------|------------------------------------------------|
| `APP_ENV`               | `development` or `production`                 |
| `NEXTAUTH_SECRET`       | Random secret for NextAuth sessions            |
| `GITHUB_CLIENT_ID`      | GitHub OAuth App client ID                     |
| `GITHUB_CLIENT_SECRET`  | GitHub OAuth App client secret                 |
| `GITHUB_TOKEN` (opt.)   | Personal access token for server‑side actions  |
| `ENABLE_SERVER_ACTIONS` | Set to `true` to enable Server Actions locally |

## GitHub OAuth Setup

1. Go to **GitHub → Settings → Developer settings → OAuth Apps**.
2. Create a new OAuth App:
   - **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
   - **Homepage URL:** `http://localhost:3000`
3. Copy the **Client ID** and **Client Secret** into `.env`.

## Running the App

```bash
npm run dev
# Open http://localhost:3000 in your browser
```

## Testing

The project uses **Jest** and **React Testing Library**.

```bash
npm test
```

Coverage reports are generated under `coverage/`.

## Deployment

The app is ready for Vercel, Netlify or any platform that supports Next.js.

- Ensure all environment variables are set in the hosting dashboard.
- For production builds, the CSP header will not allow `'unsafe-inline'` styles.

## Security Considerations

- CSP header removes `'unsafe-inline'` for styles; Tailwind CSS generates external CSS files.
- Server Actions are disabled by default in production.
- Pre‑commit hook prevents accidental secret commits.

## Rate‑Limit Handling

The GitHub API wrapper includes exponential back‑off and respects the `X-RateLimit-Remaining` header. Adjust `GITHUB_TOKEN` scope if you approach the unauthentica