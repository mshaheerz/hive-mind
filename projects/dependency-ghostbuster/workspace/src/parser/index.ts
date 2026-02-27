/**
 * @fileoverview Parser – extracts every module specifier used in a file.
 *
 * Supported import styles:
 *   • ES6 static `import … from 'module'`
 *   • CommonJS `require('module')`
 *   • Dynamic `import('module')`
 *
 * The function returns a `Set` of raw specifiers (e.g. `'lodash'`,
 * `'../utils'`). Relative specifiers are kept as‑is; the caller decides
 * whether they refer to a workspace package or an external dependency.
 */

import { readFile } from 'node:fs/promises';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import type * as t from '@babel/types';

/**
 * Parses a file and extracts all imported module specifiers.
 *
 * @param filePath Absolute path to the file to analyse.
 * @returns Set of module specifiers found in the file.
 */
export async function parseFile(filePath: string): Promise<Set<string>> {
  const imports = new Set<string>();

  try {
    const code = await readFile(filePath, 'utf‑8');

    const ast = parse(code, {
      sourceType: 'unambiguous',
      plugins: [
        'typescript',
        'jsx',
        'dynamicImport',
        'classProperties',
        'optionalChaining',
        'nullishCoalescingOperator',
      ],
    });

    // Walk the AST and collect import specifiers.
    traverse(ast, {
      // import foo from 'module';
      ImportDeclaration(path) {
        const source = path.node.source.value;
        imports.add(source);
      },

      // const foo = require('module');
      CallExpression(path) {
        const callee = path.node.callee as t.Expression;
        // Detect require('module')
        if (
          t.isIdentifier(callee) &&
          callee.name === 'require' &&
          path.node.arguments.length === 1
        ) {
          const arg = path.node.arguments[0];
          if (t.isStringLiteral(arg)) {
            imports.add(arg.value);
          }
        }

        // Detect import('module')
        if (t.isImport(callee) && path.node.arguments.length === 1) {
          const arg = path.node.arguments[0];
          if (t.isStringLiteral(arg)) {
            imports.add(arg.value);
          }
        }
      },
    });
  } catch (err) {
    console.error(`Failed to parse ${filePath}:`, err);
    // Propagate the error so the caller can decide whether to abort or continue.
    throw err;
  }

  return imports;
}
