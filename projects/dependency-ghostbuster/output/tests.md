### File: `package.json`

```json
{
  "name": "dependency-ghostbuster",
  "version": "1.0.0",
  "description": "Static analysis tool for detecting truly unused dependencies in monorepos",
  "main": "dist/main.js",
  "bin": {
    "ghostbuster": "dist/main.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/main.js",
    "test": "vitest run"
  },
  "keywords": [
    "dependency",
    "analysis",
    "monorepo",
    "unused-dependencies"
  ],
  "author": "NOVA",
  "license": "MIT",
  "devDependencies": {
    "@babel/plugin-proposal-class-properties": "^7.19.3",
    "@babel/parser": "^7.24.0",
    "@babel/traverse": "^7.24.0",
    "@types/node": "^20.11.0",
    "eslint": "^8.38.0",
    "eslint-config-next": "^14.0.12",
    "jest": "^29.5.0",
    "p-limit": "^4.0.0",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.3.3",
    "vitest": "^1.3.1"
  },
  "dependencies": {
    "@babel/core": "^7.24.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "globby": "^14.0.2"
  }
}
```

### File: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

### File: `src/config/constants.ts`

```ts
export const DEPENDENCY_LIST_FILENAME = 'dependency-list.json';
```

### File: `src/scanner/parser.ts`

```ts
import { parse } from '@babel/core';

export async function parseFile(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    parse(filePath, { ast: true }, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
}
```

### File: `src/scanner/index.ts`

```ts
import { parseFile } from './parser';
import * as fs from 'fs';

export async function scanSourceCode(dirPath: string): Promise<Map<string, any>> {
  const files = await fs.promises.readdir(dirPath);
  const dependencies = new Map<string, any>();

  for (const file of files) {
    const filePath = `${dirPath}/${file}`;
    try {
      const result = await parseFile(filePath);
      dependencies.set(filePath, result);
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error);
    }
  }

  return dependencies;
}
```

### File: `src/static-analysis/dependency-graph.ts`

```ts
import { DependencyGraph } from 'dep-graph';

export function createDependencyGraph(dependencies: Map<string, any>): DependencyGraph {
  const graph = new DependencyGraph();

  for (const [filePath, result] of dependencies) {
    if (result.ast && result.ast.body) {
      for (const node of result.ast.body) {
        if (node.type === 'CallExpression') {
          const calleeName = node.callee.name;
          if (calleeName.startsWith('import')) {
            graph.addDependency(filePath, node.arguments[0].value);
          }
        }
      }
    }
  }

  return graph;
}
```

### File: `src/static-analysis/index.ts`

```ts
import { scanSourceCode } from './scanner';
import { DependencyGraph } from './dependency-graph';

export async function analyzeDependencies(dirPath: string): Promise<DependencyGraph> {
  const dependencies = await scanSourceCode(dirPath);
  return createDependencyGraph(dependencies);
}
```

### File: `src/dynamic-import-detection/babel-integration.ts`

```ts
import { transform } from '@babel/core';

export async function detectDynamicImports(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    transform(
      fs.readFileSync(filePath, 'utf8'),
      {
        plugins: ['@babel/plugin-proposal-class-properties'],
        ast: true,
      },
      (err, result) => {
        if (err) {
          reject(err);
        }
        const dynamicImports = result.ast.body
          .filter((node) => node.type === 'ImportDeclaration')
          .map((node) => node.source.value);

        resolve(dynamicImports);
      }
    );
  });
}
```

### File: `src/dynamic-import-detection/index.ts`

```ts
import { detectDynamicImports } from './babel-integration';

export async function getDynamicImports(dirPath: string): Promise<string[]> {
  const files = await fs.promises.readdir(dirPath);
  const dynamicImports = new Set<string>();

  for (const file of files) {
    const filePath = `${dirPath}/${file}`;
    try {
      const imports = await detectDynamicImports(filePath);
      imports.forEach((importPath) => dynamicImports.add(importPath));
    } catch (error) {
      console.error(`Error detecting dynamic imports in ${filePath}:`, error);
    }
  }

  return Array.from(dynamicImports);
}
```

### File: `src/unused-dependency-identification/test-usage-analysis.ts`

```ts
import { analyzeDependencies, getDynamicImports } from '../static-analysis';
import * as fs from 'fs';

export async function identifyUnusedDependencies(
  dirPath: string,
  testFilePath: string
): Promise<string[]> {
  const graph = await analyzeDependencies(dirPath);
  const dynamicImports = await getDynamicImports(dirPath);

  const unusedDependencies = Array.from(graph.dependencies.keys()).filter(
    (filePath) => !dynamicImports.includes(filePath)
  );

  return unusedDependencies;
}
```

### File: `src/unused-dependency-identification/index.ts`

```ts
import { identifyUnusedDependencies } from './test-usage-analysis';

export async function analyzeTestUsage(dirPath: string, testFilePath: string): Promise<string[]> {
  return identifyUnusedDependencies(dirPath, testFilePath);
}
```

### File: `src/reporter/report-generator.ts`

```ts
import { DependencyGraph } from 'dep-graph';
import * as fs from 'fs';

export function generateReport(dependencyGraph: DependencyGraph): string {
  let report = '';

  dependencyGraph.dependencies.forEach((deps, filePath) => {
    report += `Unused dependencies in ${filePath}:\n`;
    deps.forEach((dependency) => {
      report += `- ${dependency}\n`;
    });
  });

  return report;
}
```

### File: `src/reporter/index.ts`

```ts
import { generateReport } from './report-generator';

export async function runGhostbuster(dirPath: string, testFilePath: string): Promise<void> {
  const graph = await analyzeTestUsage(dirPath, testFilePath);
  if (graph.dependencies.size > 0) {
    console.log(generateReport(graph));
  } else {
    console.log('No unused dependencies found.');
  }
}
```

### File: `src/main.ts`

```ts
import { runGhostbuster } from './reporter';

async function runGhostbuster(dirPath: string, testFilePath: string): Promise<void> {
  await runGhostbuster(dirPath, testFilePath);
}

runGhostbuster(process.cwd(), 'tests');
```

### Dependencies

- Node.js v16+ or later
- npm (comes with Node.js)
- ESLint and Jest CLI for testing
- Tailwind CSS for styling (optional)

**File: `.gitignore`**

```plaintext
node_modules/
dist/
*.log
.DS_Store
.env*
```

**File: `.env.example`**

```plaintext
# Example .env file
GITHUB_TOKEN=
```

### Web Project Setup

If you need a web project setup, here's a minimal scaffold using Next.js with Tailwind CSS:

**Directory Structure:**

```
dependency-ghostbuster/
├── next.config.js
├── package.json
└── public/
    └── favicon.ico
```

**File: `next.config.js`**

```js
module.exports = {
  reactStrictMode: true,
  tailwindcss: {
    cssPath: './src/styles/tailwind.css',
    configPath: './tailwind.config.js',
  },
};
```

**File: `package.json`**

```json
{
  "name": "dependency-ghostbuster-web",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@tailwindcss/aspect-ratio": "^2.0.5",
    "@tailwindcss/forms": "^0.5.3",
    "@tailwindcss/line-clamp": "^0.1.5",
    "@tailwindcss/typography": "^0.5.4",
    "next": "^14.0.12",
    "react
```

### Unit Tests

**File: `src/scanner/parser.ts.spec