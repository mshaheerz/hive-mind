import { reportUnusedDependencies } from './reporter';

async function runGhostbuster(dirPath: string, testFilePath: string): Promise<void> {
  await reportUnusedDependencies(dirPath, testFilePath);
}

runGhostbuster(process.cwd(), 'tests');
