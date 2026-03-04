/**
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const cliPath = path.resolve(__dirname, '../../src/cli/clean-code-review.js');

describe('clean-code-review CLI – Unit Tests', () => {
  const testDir = path.resolve(__dirname, 'tmp');
  const exampleFile = path.join(testDir, 'example.js');

  beforeAll(() => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
    fs.writeFileSync(exampleFile, 'console.log("hello");');
  });

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
    if (fs.existsSync('clean-code-review.md')) fs.unlinkSync('clean-code-review.md');
  });

  it('generates a report for files containing example.js', () => {
    const result = spawnSync('node', [cliPath], {
      cwd: testDir,
      encoding: 'utf-8',
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Report generated successfully.');

    const report = fs.readFileSync('clean-code-review.md', 'utf-8');
    expect(report).toContain('Naming Issues');
    expect(report).toContain('example.js:1');
  });

  it('creates an empty report when no issues found', () => {
    // Remove example.js
    fs.unlinkSync(exampleFile);
    const result = spawnSync('node', [cliPath], {
      cwd: testDir,
      encoding: 'utf-8',
    });
    expect(result.status).toBe(0);
    const report = fs.readFileSync('clean-code-review.md', 'utf-8');
    expect(report).toBe('');
  });
});
