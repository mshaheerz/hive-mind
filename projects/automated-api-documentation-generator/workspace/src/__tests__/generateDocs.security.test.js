/**
 * @fileoverview Security‑related tests for the CLI.
 * Ensures no command‑injection vulnerabilities and that input is sanitized.
 */
import { jest } from '@jest/globals';
import * as generateDocs from '../generateDocs.js';

jest.mock('node:child_process', () => ({
  exec: jest.fn(),
}));
jest.mock('node:util', () => ({
  promisify: jest.fn(() => jest.fn()),
}));

describe('Security: Command injection', () => {
  const mockExecAsync = generateDocs.execAsync;

  beforeEach(() => {
    mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
  });

  test('input path containing shell metacharacters is quoted', () => {
    process.argv = [
      'node',
      'generateDocs.js',
      '--input',
      'spec;rm -rf /',
      '--output',
      'docs.html',
    ];
    const { input, output } = generateDocs.parseArgs();
    generateDocs.generateDocumentation(input, output);

    const expectedCmd = `npx redoc-cli bundle "${input}" -o "${output}"`;
    expect(mockExecAsync).toHaveBeenCalledWith(expectedCmd);
    // The command string should not contain unescaped semicolons
    expect(expectedCmd).not.toMatch(/;|&&|\|/);
  });

  test('output path containing shell metacharacters is quoted', () => {
    process.argv = [
      'node',
      'generateDocs.js',
      '--input',
      'spec.json',
      '--output',
      'docs.html;rm -rf /',
    ];
    const { input, output } = generateDocs.parseArgs();
    generateDocs.generateDocumentation(input, output);

    const expectedCmd = `npx redoc-cli bundle "${input}" -o "${output}"`;
    expect(mockExecAsync).toHaveBeenCalledWith(expectedCmd);
    expect(expectedCmd).not.toMatch(/;|&&|\|/);
  });

  test('rejects non‑string arguments', () => {
    // Simulate passing a buffer as an argument
    const args = ['node', 'generateDocs.js', '--input', Buffer.from('spec.json')];
    process.argv = args;
    expect(() => generateDocs.parseArgs()).toThrow(/Missing required argument/);
  });
});
