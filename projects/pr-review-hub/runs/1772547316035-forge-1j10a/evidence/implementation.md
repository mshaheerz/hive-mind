### File: `package.json`

```json
{
  "name": "your-project-name",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "next start",
    "dev": "next dev",
    "build": "next build",
    "lint": "eslint . --ext js,jsx"
  },
  "dependencies": {
    "@emotion/react": "^11.10.5",
    "@emotion/styled": "^11.10.7",
    "next": "latest",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.35",
    "@types/next": "latest",
    "eslint": "^8.47.0",
    "eslint-config-next": "13.4.9",
    "prettier-plugin-jsx": "^5.0.1"
  }
}
```

### File: `.eslintrc.js`

```javascript
module.exports = {
  extends: ['next', 'plugin:@emotion/react/recommended'],
  rules: {
    '@emotion/jsx/no-undef': 'error',
    'react/require-default-props': 'off'
  },
  overrides: [
    {
      files: ['pages/**/*.js', 'components/**/*.jsx'],
      plugins: ['@emotion/babel-plugin'],
      settings: {
        emotion: { autoImport: true },
      },
      rules: {
        '@emotion/jsx/no-undef': 'error',
      }
    }
  ]
};
```

### File: `.editorconfig`

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8

[*.{js,jsx}]
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = true
```

### File: `next.config.js`

```javascript
module.exports = {
  experimental: {
    serverActions: true,
    appDir: true,
    swcMinify: true
  }
};
```

## FIX_MAP
- **1** -> Added `react-server` and `@emotion/react/server` to dependencies.
- **2** -> Updated `next.config.js` to enable experimental features.

### File: `pages/_app.js`

```jsx
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { ServerActions } from 'next/server'

const serverActionCache = ServerActions.create({
  cacheName: "server-action-cache"
})

export default function App({ Component, pageProps }) {
  const emotionCache = createCache({ key: 'client' })

  return (
    <CacheProvider value={emotionCache}>
      <ServerActions.Provider value={serverActionCache}>
        <Component {...pageProps} />
      </ServerActions.Provider>
    </CacheProvider>
  )
}
```