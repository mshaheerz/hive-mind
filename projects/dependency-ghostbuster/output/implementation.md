### File: `.gitignore`

```
node_modules/
dist/
*.log
.DS_Store
.env*
```

### File: `.env.example`

```
# Example .env file
GITHUB_TOKEN=
```

### File: `package.json`

```json
{
  "name": "dependency-ghostbuster",
  "version": "1.0.0",
  "description": "A static analysis tool to identify and remove unused dependencies in monorepos.",
  "main": "dist/main.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest"
  },
  "keywords": [
    "dependency management",
    "monorepo",
    "static analysis",
    "dynamic imports"
  ],
  "dependencies": {
    "@tailwindcss/aspect-ratio": "^2.0.5",
    "@tailwindcss/forms": "^0.5.3",
    "@tailwindcss/line-clamp": "^0.1.5",
    "@tailwindcss/typography": "^0.5.4",
    "next": "^14.0.12",
    "react": "^18.2.0",
    "typescript": "^4.9.3",
    "eslint": "^8.19.0",
    "jest": "^27.4.3",
    "babel-core": "^6.26.3",
    "dep-graph": "^5.0.0"
  },
  "devDependencies": {
    "@types/next": "^14.0.11",
    "@types/react": "^18.0.17",
    "@typescript-eslint/parser": "^5.29.0",
    "@typescript-eslint/eslint-plugin": "^5.30.0"
  }
}
```

### File: `tailwind.config.js`

```js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### File: `next.config.js`

```js
module.exports = {
  reactStrictMode: true,
  tailwindcss: {
    cssPath: './src/styles/tailwind.css',
    configPath: './tailwind.config.js',
  },
};
```

### File: `src/main.ts`

```ts
import { reportUnusedDependencies } from './reporter';

async function runGhostbuster(dirPath: string, testFilePath: string): Promise<void> {
  await reportUnusedDependencies(dirPath, testFilePath);
}

runGhostbuster(process.cwd(), 'tests');
```

### File: `src/reporter/index.ts`

```ts
import { generateReport } from './report-generator';

export async function reportUnusedDependencies(
  dirPath: string,
  testFilePath: string
): Promise<void> {
  const graph = await analyzeDependencies(dirPath);
  const unusedDependencies = await identifyUnusedDependencies(dirPath, testFilePath);

  if (unusedDependencies.length > 0) {
    console.log(generateReport(graph));
  } else {
    console.log('No unused dependencies found.');
  }
}
```

### File: `src/reporter/report-generator.ts`

```ts
import { DependencyGraph } from './static-analysis';

export function generateReport(graph: DependencyGraph): string {
  let report = 'Unused Dependencies:\n';
  graph.nodes.forEach(node => {
    if (node.dependencies.length === 0) {
      report += `- ${node.name}\n`;
    }
  });
  return report;
}
```

### File: `src/static-analysis/index.ts`

```ts
import { DependencyGraph } from './dependency-graph';

export async function analyzeDependencies(dirPath: string): Promise<DependencyGraph> {
  const dependencyGraph = new DependencyGraph();
  // Implement logic to parse and analyze dependencies
  return dependencyGraph;
}
```

### File: `src/static-analysis/dependency-graph.ts`

```ts
import { AbstractSyntaxTree } from './scanner';

export interface Node {
  name: string;
  dependencies: string[];
}

export class DependencyGraph {
  nodes: Node[] = [];

  addNode(name: string): void {
    this.nodes.push({ name, dependencies: [] });
  }

  addDependency(from: string, to: string): void {
    const fromNode = this.nodes.find(node => node.name === from);
    const toNode = this.nodes.find(node => node.name === to);
    if (fromNode && toNode) {
      fromNode.dependencies.push(toNode.name);
    }
  }

  build(graph: AbstractSyntaxTree): void {
    // Implement logic to build the dependency graph
  }
}
```

### File: `src/scanner/index.ts`

```ts
import { parse } from './parser';
import { DependencyGraph } from './static-analysis';

export async function analyzeSourceCode(dirPath: string): Promise<DependencyGraph> {
  const dependencyGraph = new DependencyGraph();
  // Implement logic to scan and parse source code
  return dependencyGraph;
}
```

### File: `src/scanner/parser.ts`

```ts
import { parse } from 'babel-core';
import { Node, AbstractSyntaxTree } from './static-analysis';

export function parseSourceCode(source: string): AbstractSyntaxTree {
  const ast = parse(source, {
    plugins: ['@babel/plugin-syntax-dynamic-import'],
  });
  return ast;
}
```

### File: `src/scanner/ast-builder.ts`

```ts
import { Node } from './static-analysis';

export function buildAST(ast: any): Node[] {
  // Implement logic to build the AST and extract nodes
  return [];
}
```

### Dependencies

- Node.js v16+ or later
- npm (comes with Node.js)
- ESLint and Jest CLI for testing
- Tailwind CSS for styling (optional)