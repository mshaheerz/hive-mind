/**
 * @fileoverview Unit tests for src/generateDocs.js.
 * The `child_process.exec` function is mocked to avoid spawning
 * real processes during testing.
 */

import { jest } from '@jest/globals';
import { promises as fsPromises } from 'node:fs';
import path from 'node:path';
import * as generateDocsModule from '../generateDocs.js';

const { access } = fsPromises;

// Mock execAsync inside the module
jest.mock('node:util', () => ({
  promisify: jest.fn(() => jest.fn()),
}));

// Helper to reset process.argv after each test
const ORIGINAL_ARGV = process.argv.slice();

afterEach(() => {
  process.argv = ORIGINAL_ARGV.slice();
  jest.clearAllMocks();
});

describe('Argument parsing', () => {
  test('throws when input flag is missing', () => {
    process.argv = ['node', 'generateDocs.js'];
    expect(() => generateDocsModule.parseArgs()).toThrow(
      /Missing required argument/
    );
  });

  test('parses input and output correctly', () => {
    process.argv = [
      'node',
      'generateDocs.js',
      '--input',
      'spec.json',
      '--output',
      'out.html',
    ];
    const { input, output } = generateDocsModule.parseArgs();
    expect(path.basename(input)).toBe('spec.json');
    expect(path.basename(output)).toBe('out.html');
  });

  test('uses default output when not provided', () => {
    process.argv = ['node', 'generateDocs.js', '--input', 'spec.json'];
    const { output } = generateDocsModule.parseArgs();
    expect(path.basename(output)).toBe('docs.html');
  });
});

describe('File validation', () => {
  test('resolves when file exists', async () => {
    // Mock access to resolve
    jest.spyOn(fsPromises, 'access').mockResolvedValue(undefined);
    await expect(
      generateDocsModule.validateFileExists('/tmp/spec.json')
    ).resolves.not.toThrow();
  });

  test('rejects when file does not exist', async () => {
    jest
      .spyOn(fsPromises, 'access')
      .mockRejectedValue(new Error('ENOENT: no such file'));
    await expect(
      generateDocsModule.validateFileExists('/tmp/missing.json')
    ).rejects.toThrow(/Cannot read input file/);
  });
});
