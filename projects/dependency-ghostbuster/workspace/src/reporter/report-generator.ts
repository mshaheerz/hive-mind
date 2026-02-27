import { Graph } from './dependency-graph';
import { readFileSync } from 'fs';

const readFromFile = (filePath: string) => {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw new Error('Failed to parse the file.');
  }
};

export async function generateReport(graph: Graph, testUsage: Record<string, any>): Promise<string> {
  const report = `Removal Recommendations:\n`;

  // Generate a list of unused dependencies
  const unusedDependencies = Object.keys(testUsage).filter(key => !graph.getDependencyByName(key));
  for (const dependency of unusedDependencies) {
    report += `- ${dependency}\n`;
  }

  return report;
}
