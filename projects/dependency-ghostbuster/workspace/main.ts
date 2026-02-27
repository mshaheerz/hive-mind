import 'reflect-metadata';
import 'zone.js';
require('core-js/stable');
require('core-js/proposal-reflect-metadata');

// Import specific modules for the tool implementation
import * as scanner from './scanner/index';
import * as staticAnalysis from './static-analysis/index';
import * as dynamicImportDetection from './dynamic-import-detection/index';

// Instantiate and initialize components
const scannerInstance = new scanner.Scanner();
const staticAnalysisInstance = new staticAnalysis.StaticAnalysis();
const dynamicImportDetectionInstance = new dynamicImportDetection.DynamicImportDetection();

// Start the tool's main execution
(async () => {
  await scannerInstance.run();
  await staticAnalysisInstance.processDependencies();
  await dynamicImportDetectionInstance.identifyUnusedImports();
})().catch((error) => console.error(error));
