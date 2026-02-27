import { runScanner } from './scanner/index';
import { buildDependencyGraph } from './static-analysis/index';

runScanner();
buildDependencyGraph();
