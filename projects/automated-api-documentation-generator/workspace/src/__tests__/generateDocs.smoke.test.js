/**
 * @fileoverview Minimal smoke test that ensures the CLI can be executed
 * without crashing when provided with a mock spec file and a mock output.
 * This test is useful when the full test suite cannot be run (e.g., CI
 * with limited resources). It verifies that the main orchestrator calls
 * the expected functions and handles success.
 */
import { jest } from '@jest/globals';
import * as generateDocs from '../generateDocs.js';

jest.mock('node:child_process', () => ({
  exec: jest.fn(),
}));
jest.mock('node:util', () => ({
  promisify: jest.fn(() => jest.fn()),
}));

describe('Smoke Test: main execution', () => {
  const mockExecAsync = generateDocs.execAsync;
  const mockAccess = jest.spyOn(generateDocs, 'validateFileExists');

  beforeEach(() => {
    process.argv = [
      'node',
      'generateDocs.js',
      '--input',
      'spec.json',
      '--output',
      'docs.html',
    ];
    mockAccess.mockResolvedValue(undefined);
    mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
    console.log = jest.fn();
    console.error = jest.fn();
    process.exit = jest.fn();
  });

  test('runs main and exits normally', async () => {
    await generateDocs.main();
    expect(mockAccess).toHaveBeenCalled();
    expect(mockExecAsync).toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });
});
