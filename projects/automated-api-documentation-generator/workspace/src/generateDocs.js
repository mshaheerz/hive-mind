/**
 * @fileoverview CLI script to generate static HTML documentation
 *               from an OpenAPI/Swagger JSON file using Redoc.
 *
 * Usage:
 *   node src/generateDocs.js --input ./spec.json --output ./docs.html
 *
 * The script validates input arguments, ensures the specification file
 * exists, and then invokes `redoc-cli` to bundle the spec into a single
 * HTML file. All async operations are wrapped with proper error handling.
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { access, constants } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const execAsync = promisify(exec);

/**
 * Named constants for default values and error messages.
 */
const DEFAULT_OUTPUT = 'docs.html';
const INPUT_FLAG = '--input';
const OUTPUT_FLAG = '--output';
const REDOC_CLI_CMD = 'npx redoc-cli bundle';

/**
 * Parses command‑line arguments and returns an object with `input` and `output` paths.
 *
 * @returns {{ input: string, output: string }}
 * @throws {Error} If required arguments are missing or malformed.
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf(INPUT_FLAG);
  const outputIdx = args.indexOf(OUTPUT_FLAG);

  if (inputIdx === -1 || inputIdx + 1 >= args.length) {
    throw new Error(`Missing required argument: ${INPUT_FLAG} <spec-file>`);
  }

  const inputPath = path.resolve(args[inputIdx + 1]);
  const outputPath =
    outputIdx !== -1 && outputIdx + 1 < args.length
      ? path.resolve(args[outputIdx + 1])
      : path.resolve(DEFAULT_OUTPUT);

  return { input: inputPath, output: outputPath };
}

/**
 * Checks whether a file exists and is readable.
 *
 * @param {string} filePath - Absolute path to the file.
 * @returns {Promise<void>}
 * @throws {Error} If the file cannot be accessed.
 */
async function validateFileExists(filePath) {
  try {
    await access(filePath, constants.R_OK);
  } catch (err) {
    throw new Error(`Cannot read input file at ${filePath}: ${err.message}`);
  }
}

/**
 * Executes Redoc CLI to bundle the OpenAPI spec into a static HTML file.
 *
 * @param {string} specPath - Absolute path to the OpenAPI JSON/YAML file.
 * @param {string} outPath - Absolute path where the HTML should be written.
 * @returns {Promise<void>}
 */
async function generateDocumentation(specPath, outPath) {
  const cmd = `${REDOC_CLI_CMD} "${specPath}" -o "${outPath}"`;
  try {
    const { stdout, stderr } = await execAsync(cmd);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`Documentation generated at ${outPath}`);
  } catch (err) {
    throw new Error(`Redoc CLI failed: ${err.message}`);
  }
}

/**
 * Main entry point – orchestrates argument parsing, validation,
 * and documentation generation.
 */
async function main() {
  try {
    const { input, output } = parseArgs();
    await validateFileExists(input);
    await generateDocumentation(input, output);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Execute only if the script is run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
