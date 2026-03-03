### File: `package.json`

```json
{
  "name": "your-project-name",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "next",
    "build": "next build",
    "dev": "next dev",
    "clean": "rm -rf .next dist"
  },
  "dependencies": {
    "@emotion/react": "^11.10.3",
    "@emotion/styled": "^11.10.2",
    "next": "latest",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/next": "latest",
    "@types/react": "^18.0.0",
    "eslint": "^8.43.0",
    "eslint-config-next": "13.4.5",
    "typescript": "^4.9.2"
  }
}
```

### File: `next.config.js`

```javascript
const { withContentlayer } = require('next-contentlayer')

module.exports = withContentlayer({
  images: {
    domains: ['images.unsplash.com']
  },
})
```

### File: `.eslintrc.json`

```json
{
  "extends": [
    "next",
    "next/core-web-vitals",
    "plugin:@emotion/react/recommended",
    "plugin:@emotion/styled/recommended"
  ],
  "rules": {
    "@emotion/react/no-hardcoded-values-in-strings": "error",
    "@emotion/styled/consistent-aspect-ratio": "error"
  }
}
```

### File: `AGENTS.md`

```markdown
# AGENTS.md

## Agents Overview

This file outlines the agents that will be used for code reviews, with detailed descriptions and configurations.

---

## Agent 1: Clean Code Review

**Description**: This agent focuses on improving code quality using "Clean Code" principles. It identifies naming issues, function issues, duplication, over-engineering, magic numbers, structural clarity, and project conventions.

**Configuration**:
- **Dimensions to Check**: Naming, Functions, DRY, YAGNI, Magic Numbers, Clarity, Conventions
- **Severity Levels**: High, Medium, Low
- **Output Format**: Markdown report with severity ratings

---

## Agent 2: React Best Practices Review (Performance-First)

**Description**: This agent helps optimize React components and Next.js pages for performance using a prioritized rule library. It reviews waterfall patterns, bundle size, server/client data fetching, re-renders, rendering, and JS hot paths.

**Configuration**:
- **Rules to Apply**: Waterfalls, Promise.all/defer await, barrel imports, optimizePackageImports, dynamic imports, cache, serialization, RSC boundaries, Server Actions, data fetching, re-rendering, rendering, memoization, useCallback, dependencies
- **Output Format**: Markdown report with summary, critical fixes, high impact, and nice-to-have issues

---

## Agent 3: Performance Optimization Agent

**Description**: This agent is designed to optimize performance by identifying bottlenecks, reducing render time, minimizing bundle size, and enhancing hydration.

**Configuration**:
- **Optimization Targets**: Waterfalls, Promise.all/defer await, barrel imports, optimizePackageImports, dynamic imports, cache, serialization, RSC boundaries, Server Actions, data fetching, re-rendering, rendering, memoization, useCallback, dependencies
- **Output Format**: Markdown report with summary, critical fixes, high impact, and nice-to-have issues

---

## FIX_MAP (if any)

No specific fix map items.

---

# END OF AGENTS.md
```

### File: `CLAUDE.md`

```markdown
## CLAUDE.md

**Purpose**: This file outlines the coding standards and practices that are enforced by the team, including naming conventions, function styles, code smells detection, and tooling setup.

---

## Naming Conventions

- **Functions**: Use camelCase for names, e.g., `handleUserClick`.
- **Variables**: Use snake_case for variable names, e.g., `user_data`.
- **Constants**: Use all capital letters with underscores, e.g., `MAX_RETRIES`.

## Function Styles

- Prefer small functions (100 lines or less) and single responsibilities.
- Avoid complex function bodies.

## Code Smells Detection

- Identify and report naming issues, function size issues, duplication, over-engineering, magic numbers, structural clarity, and project conventions.

## Tooling Setup

- **Linters**: Use ESLint with Next.js configuration for linting React components and pages.
  - Install: `npm install --save-dev eslint @types/next @typescript-eslint/eslint-plugin @typescript-eslint/parser next eslint-config-next`
  - Configuration file: `.eslintrc.json`

## References

- **Clean Code Principles**: Refer to [CLAUDE.md](CLAUDE.md) for detailed information on Clean Code principles.
- **React Best Practices**: See the `references/rules` directory for a comprehensive list of React best practices.

---

# END OF CLAUDE.md
```