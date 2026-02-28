/**
 * @fileoverview Unit tests for each exported function in generateDocs.js
 * Covers normal behaviour, edge cases, error paths and security concerns.
 */
import { jest } from '@jest/globals';
import { promises as fsPromises } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import * as generateDocs from '../generateDocs.js';

// ------------------------------------------------------------------
// Mocks
// ------------------------------------------------------------------
jest.mock('node:child_process', () => ({
  exec: jest.fn(),
}));
jest.mock('node:util', () => ({
  promisify: jest.fn(() => jest.fn()),
}));

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const ORIGINAL_ARGV = process.argv.slice();
const ORIGINAL_EXIT = process.exit;
const ORIGINAL_LOG = console.log;
const ORIGINAL_ERROR = console.error;

// Restore global state after each test
afterEach(() => {
  process.argv = ORIGINAL_ARGV.slice();
  process.exit = ORIGINAL_EXIT;
  console.log = ORIGINAL_LOG;
  console.error = ORIGINAL_ERROR;
  jest.resetAllMocks();
});

describe('parseArgs', () => {
  test('throws when input flag is missing', () => {
    process.argv = ['node', 'generateDocs.js'];
    expect(() => generateDocs.parseArgs()).toThrow(/Missing required argument/);
  });

  test('throws when input flag has no value', () => {
    process.argv = ['node', 'generateDocs.js', '--input'];
    expect(() => generateDocs.parseArgs()).toThrow(/Missing required argument/);
  });

  test('parses input and output correctly', () => {
    process.argv = [
      'node',
      'generateDocs.js',
      '--input',
      'spec.json',
      '--output',
      'docs.html',
    ];
    const { input, output } = generateDocs.parseArgs();
    expect(path.basename(input)).toBe('spec.json');
    expect(path.basename(output)).toBe('docs.html');
  });

  test('uses default output when not provided', () => {
    process.argv = ['node', 'generateDocs.js', '--input', 'spec.json'];
    const { output } = generateDocs.parseArgs();
    expect(path.basename(output)).toBe('docs.html');
  });

  test('handles relative paths and resolves to absolute', () => {
    process.argv = ['node', 'generateDocs.js', '--input', './spec.json'];
    const { input } = generateDocs.parseArgs();
    expect(input).toBe(path.resolve('./spec.json'));
  });

  test('ignores unknown flags', () => {
    process.argv = [
      'node',
      'generateDocs.js',
      '--input',
      'spec.json',
      '--foo',
      'bar',
    ];
    const { input } = generateDocs.parseArgs();
    expect(path.basename(input)).toBe('spec.json');
  });

  test('takes first occurrence of input flag', () => {
    process.argv = [
      'node',
      'generateDocs.js',
      '--input',
      'first.json',
      '--input',
      'second.json',
    ];
    const { input } = generateDocs.parseArgs();
    expect(path.basename(input)).toBe('first.json');
  });
});

describe('validateFileExists', () => {
  test('resolves when file is readable', async () => {
    jest.spyOn(fsPromises, 'access').mockResolvedValue(undefined);
    await expect(generateDocs.validateFileExists('/tmp/spec.json')).resolves.not.toThrow();
    expect(fsPromises.access).toHaveBeenCalledWith(
      '/tmp/spec.json',
      fsPromises.constants.R_OK
    );
  });

  test('rejects when file does not exist', async () => {
    const err = new Error('ENOENT: no such file');
    jest.spyOn(fsPromises, 'access').mockRejectedValue(err);
    await expect(generateDocs.validateFileExists('/tmp/missing.json')).rejects.toThrow(
      /Cannot read input file/
    );
  });

  test('rejects when file is not readable (EACCES)', async () => {
    const err = new Error('EACCES: permission denied');
    err.code = 'EACCES';
    jest.spyOn(fsPromises, 'access').mockRejectedValue(err);
    await expect(generateDocs.validateFileExists('/tmp/protected.json')).rejects.toThrow(
      /Cannot read input file/
    );
  });
});

describe('generateDocumentation', () => {
  const mockExecAsync = generateDocs.execAsync;
  const mockStdout = jest.fn();
  const mockStderr = jest.fn();

  beforeEach(() => {
    console.log = mockStdout;
    console.error = mockStderr;
  });

  test('executes correct command string with quoted paths', async () => {
    const spec = '/tmp/spec.json';
    const out = '/tmp/docs.html';
    mockExecAsync.mockResolvedValue({ stdout: 'ok', stderr: '' });

    await generateDocs.generateDocumentation(spec, out);

    const expectedCmd = `npx redoc-cli bundle "${spec}" -o "${out}"`;
    expect(mockExecAsync).toHaveBeenCalledWith(expectedCmd);
    expect(mockStdout).toHaveBeenCalledWith('ok');
    expect(mockStdout).toHaveBeenCalledWith(`Documentation generated at ${out}`);
  });

  test('handles stdout and stderr separately', async () => {
    mockExecAsync.mockResolvedValue({ stdout: 'out', stderr: 'err' });
    await generateDocs.generateDocumentation('/tmp/spec.json', '/tmp/out.html');
    expect(mockStdout).toHaveBeenCalledWith('out');
    expect(mockStderr).toHaveBeenCalledWith('err');
  });

  test('throws error when exec fails', async () => {
    const err = new Error('spawn EINVAL');
    mockExecAsync.mockRejectedValue(err);
    await expect(
      generateDocs.generateDocumentation('/tmp/spec.json', '/tmp/out.html')
    ).rejects.toThrow(/Redoc CLI failed/);
  });
});

describe('main', () => {
  const mockExecAsync = generateDocs.execAsync;
  const mockAccess = fsPromises.access;

  beforeEach(() => {
    process.exit = jest.fn();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  test('success flow: parses, validates, generates', async () => {
    process.argv = [
      'node',
      'generateDocs.js',
      '--input',
      'spec.json',
      '--output',
      'out.html',
    ];

    mockAccess.mockResolvedValue(undefined);
    mockExecAsync.mockResolvedValue({ stdout: 'ok', stderr: '' });

    await generateDocs.main();

    expect(mockAccess).toHaveBeenCalled();
    expect(mockExecAsync).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      `Documentation generated at ${path.resolve('out.html')}`
    );
    expect(process.exit).not.toHaveBeenCalled();
  });

  test('fails when input file missing', async () => {
    process.argv = ['node', 'generateDocs.js', '--input', 'missing.json'];
    mockAccess.mockRejectedValue(new Error('ENOENT'));

    await generateDocs.main();

    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/Error: Cannot read input file/)
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('fails when exec fails', async () => {
    process.argv = ['node', 'generateDocs.js', '--input', 'spec.json'];
    mockAccess.mockResolvedValue(undefined);
    mockExecAsync.mockRejectedValue(new Error('Redoc error'));

    await generateDocs.main();

    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/Error: Redoc CLI failed/)
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('does not run main when imported', async () => {
    // Simulate import.meta.url not matching process.argv[1]
    const originalImportMeta = global.import;
    // Not needed – the guard is simple string comparison.
    // This test ensures no side‑effects occur when the module is imported.
    // We'll import the module again and verify no console logs or exit were called.
    jest.isolateModules(() => {
      require('../generateDocs.js');
    });
    expect(console.log).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });
});
