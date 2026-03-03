### File: `package.json`

```json
{
  "name": "your-project-name",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@types/node": "^20.9.1",
    "@types/react": "^18.2.18",
    "@types/next": "^13.4.6",
    "next": "^13.4.6",
    "react": "^18.2.0",
    "typescript": "^5.2.2"
  },
  "devDependencies": {
    "eslint": "^8.55.0",
    "eslint-config-next": "^13.4.6",
    "prettier": "^2.9.7",
    "typescript-eslint": "^5.55.0"
  }
}
```

### File: `.eslintrc.json`

```json
{
  "extends": ["next", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "default",
        format: ["camelCase"]
      },
      {
        selector: "memberLike",
        format: ["camelCase"]
      }
    ],
    "@typescript-eslint/no-magic-numbers": ["error", { ignoreArrayIndexes: true, ignoreTypeReferences: true }],
    "@typescript-eslint/explicit-function-return-type": ["off"],
    "@next/next/no-server-imports": ["warn"],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### File: `.gitignore`

```plaintext
node_modules/
.next/
build/
.env*
.env.local*
.env.development.local*
.env.production.local*
.DS_Store
*.log
```

### File: `next.config.js`

```javascript
import { withSentryConfig } from '@sentry/nextjs';

const sentryWebpackPluginOptions = {
  // Additional config options for Sentry's NextJS SDK
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
```

### FIX_MAP

## Required FIX_MAP
- `101` -> Added `useMemo` hook to optimize the `getUserData` function in `src/pages/user/[id].tsx`.
- `201` -> Replaced `Promise.all` with `async/await` in `src/services/api.js` to improve readability and performance.
- `301` -> Converted `defer await` usage to `useAsync` hook from `react-use` library in `src/hooks/useApiData.ts`.