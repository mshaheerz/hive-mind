/**
 * @jest-environment node
 */

import path from 'path';
import { spawnSync } from 'child_process';

const cliPath = path.resolve(__dirname, '../../src/cli/react-best-practices-review.js');

// Prepare a fake rules directory
const rulesDir = path.resolve(__dirname, '../../src/cli/references/rules');
const ruleFiles = ['promise.all.js', 'waterfall.js', 'defer-async.js'];

beforeAll(() => {
  if (!fs.existsSync(rulesDir)) fs.mkdirSync(rulesDir, { recursive: true });
  ruleFiles.forEach((f) => fs.writeFileSync(path.join(rulesDir, f), 'stub'));
});

afterAll(() => {
  fs.rmSync(rulesDir, { recursive: true, force: true });
});

describe('react-best-practices-review CLI – Unit Tests', () => {
  it('searches for keyword and prints matching rules', () => {
    const result = spawnSync('node', [cliPath, 'promise'], {
      encoding: 'utf-8',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('- promise.all.js');
    expect(result.stdout).not.toContain('- waterfall.js');
  });

  it('errors when no keyword is supplied', () => {
    const result = spawnSync('node', [cliPath], {
      encoding: 'utf-8',
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toContain('Please provide a keyword to search for.');
  });

  it('prints nothing when no rules match', () => {
    const result = spawnSync('node', [cliPath, 'nonexistent'], {
      encoding: 'utf-8',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
  });
});
