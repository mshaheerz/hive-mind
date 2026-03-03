### File: `package.json`

```json
{
  "name": "@cloudeos/clean-code-review",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "@rushstack/eslint-config-cloudeos": "^2.0.0"
  },
  "devDependencies": {
    "eslint-plugin-clean-code-review": "^3.0.0",
    "eslint-plugin-react-best-practices": "^4.0.0"
  }
}
```

### File: `.eslintrc.json`

```json
{
  "extends": "@rushstack/eslint-config-cloudeos",
  "plugins": [
    "clean-code-review",
    "react-best-practices"
  ],
  "rules": {
    "clean-code-review/naming-issues": "error",
    "clean-code-review/functions-issues": "error",
    "clean-code-review/duplication-issues": "error",
    "clean-code-review/over-engineering": "error",
    "clean-code-review/magic-numbers": "error",
    "clean-code-review/structural-clarity": "error",
    "clean-code-review/project-conventions": "error",
    "react-best-practices/waterfalls": "error",
    "react-best-practices/bundle-size": "error",
    "react-best-practices/server-client-data-fetching": "error",
    "react-best-practices/re-renders": "error",
    "react-best-practices/rendering": "error"
  }
}
```

### File: `README.md`

```markdown
# Clean Code Review and React Best Practices

This repository contains tools and configurations to perform clean code reviews using the "Clean Code" principles and optimize React/Next.js performance following best practices.

## Requirements

- Node.js installed on your machine.
- Package manager (npm or yarn).

## Installation

1. **Install ESLint** globally if not already installed:

   ```bash
   npm install -g eslint
   ```

2. **Clone the repository**:

   ```bash
   git clone https://github.com/cloudeos/clean-code-review.git
   cd clean-code-review
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

## Usage

### Clean Code Review

1. **Reviewing a specific file or directory**:

   ```bash
   npx eslint --ext=.ts,.tsx src/path/to/file.tsx
   ```

2. **Running all clean code review checks in the repository**:

   ```bash
   npx eslint
   ```

### React Best Practices Review

1. **Reviewing a specific file or directory**:

   ```bash
   npx eslint --ext=.ts,.tsx src/path/to/file.tsx
   ```

2. **Running all React best practices review checks in the repository**:

   ```bash
   npx eslint
   ```

### Customizing Rules

1. **Modify `.eslintrc.json` to include or exclude specific rules**.

### Running Ship Faster (Optional)

- If you are using the Ship Faster tool, ensure that the output reports are persisted at `run_dir/evidence/react-best-practices-review.md`.

## Example Reports

See detailed examples and references for more scenarios and how to apply these tools effectively.

---

## FIX_MAP
- **101** -> Fixed naming issues in `src/components/HelloWorld.tsx`
- **202** -> Resolved function size issue in `src/pages/HomePage.tsx`
- **303** -> Eliminated duplication logic in `src/utils/dataFetcher.ts`