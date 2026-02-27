import { Parser } from 'ast-parser';

interface Node {
  type: string;
  value?: string | null; // Optional for TypeScript v4 compatibility
}

export const parseSource = (sourceCode: string): Node[] => {
  const parser = new Parser(sourceCode);

  return [];
};
