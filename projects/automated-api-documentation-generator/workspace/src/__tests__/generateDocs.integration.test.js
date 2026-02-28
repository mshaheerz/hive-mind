/**
 * @fileoverview Integration test that exercises the full CLI flow
 * with mocked filesystem and child_process to simulate a real run.
 */
import { jest } from '@jest/globals';
import { promises as fsPromises } from 'node:fs';
import path from 'node:path';
import * as generateDocs from '../generateDocs.js';

jest.mock('node:child_process', () => ({
  exec: jest.fn(),
}));
jest.mock('node:util', () => ({
  promisify: jest.fn(() => jest.fn()),
}));

describe('Integration: CLI flow', () => {
  const mockExecAsync = generateDocs.execAsync;
  const mockAccess = fsPromises.access;

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
    mockExecAsync.mockResolvedValue({ stdout: 'ok', stderr: '' });
    console.log = jest.fn();
    console.error = jest.fn();
    process.exit = jest.fn();
  });

  test('generates docs and exits cleanly', async () => {
    await generateDocs.main();

    // Verify that the command was built correctly
    const expectedCmd = `npx redoc-cli bundle "${path.resolve(
      'spec.json'
    )}" -o "${path.resolve('docs.html')}"`;
    expect(mockExecAsync).toHaveBeenCalledWith(expectedCmd);

    // Verify logs
    expect(console.log).toHaveBeenCalledWith(
      `Documentation generated at ${path.resolve('docs.html')}`
    );

    // Exit not called on success
    expect(process.exit).not.toHaveBeenCalled();
  });

  test('fails gracefully when spec file missing', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'));

    await generateDocs.main();

    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/Error: Cannot read input file/)
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('fails gracefully when redoc-cli errors', async () => {
    mockExecAsync.mockRejectedValue(new Error('CLI error'));

    await generateDocs.main();

    expect(console.error).toHaveBeenCalledWith(
      expect.stringMatching(/Error: Redoc CLI failed/)
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
