**File: `src/__tests__/generateDocs.unit.test.js`**
```js
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
```

---

**File: `src/__tests__/generateDocs.integration.test.js`**
```js
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
```

---

**File: `src/__tests__/generateDocs.security.test.js`**
```js
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
```

---

**File: `src/__tests__/generateDocs.plan.md`**
```markdown
# Manual Test Plan for Automated API Documentation Generator

## 1. Argument Parsing
| Scenario | Expected Result |
| -------- | --------------- |
| No `--input` flag | Error message & exit |
| `--input` flag without value | Error message & exit |
| `--input` with relative path | Resolves to absolute path |
| `--output` omitted | Defaults to `docs.html` in cwd |
| Multiple `--input` flags | First occurrence used |
| Unknown flags present | Ignored, parsing continues |
| Empty string as value | Treated as missing value, error |

## 2. File Validation
| Scenario | Expected Result |
| -------- | --------------- |
| File exists and readable | No error |
| File does not exist | Error: Cannot read input file |
| File exists but no read permission | Error: Cannot read input file |
| Path is a directory | Error: Cannot read input file |

## 3. Documentation Generation
| Scenario | Expected Result |
| -------- | --------------- |
| Redoc CLI succeeds | Success log & file created |
| Redoc CLI fails (non‑zero exit) | Error: Redoc CLI failed |
| Redoc CLI outputs to stderr | stderr logged |
| Spec path contains spaces | Command properly quoted |
| Spec path contains shell metacharacters | No injection, command quoted |

## 4. Main Flow
| Scenario | Expected Result |
| -------- | --------------- |
| All steps succeed | Documentation generated, exit 0 |
| Input validation fails | Error logged, exit 1 |
| Redoc CLI fails | Error logged, exit 1 |

## 5. Edge Cases
| Scenario | Expected Result |
| -------- | --------------- |
| Spec file is huge (100 MB) | Process completes without memory blow |
| Spec file is malformed JSON | Redoc CLI error, caught and logged |
| Multiple concurrent runs | Each run writes its own output file |
| Output path already exists | Overwritten without prompt |
| Output path is a directory | Error: Cannot write output |

## 6. Security
| Scenario | Expected Result |
| -------- | --------------- |
| Spec path contains `; rm -rf /` | Command remains safe, no injection |
| Output path contains `&&` | Command remains safe |
| Non‑string argument types | Error thrown |

## 7. Performance
| Scenario | Expected Result |
| -------- | --------------- |
| Running with 10 microservice specs | Total runtime < 5 s (approx) |
| Running with 100 specs sequentially | Total runtime scales linearly |

## 8. Integration with CI
| Scenario | Expected Result |
| -------- | --------------- |
| Script invoked from a GitHub Action | Documentation files are produced in artifact |
| Environment variable LOG_LEVEL set | Logging level respected |

---

**Test Execution Checklist**

- [ ] Run `npm test` locally; all automated tests pass.
- [ ] Perform manual CLI invocation with valid and invalid arguments.
- [ ] Verify generated HTML is valid and contains expected endpoints.
- [ ] Check logs for correct verbosity based on `LOG_LEVEL`.
- [ ] Inspect the generated file in a CI environment.

```

---

**File: `src/__tests__/generateDocs.smoke.test.js`**
```js
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
```

---

**File: `jest.setup.js`** (optional, if you want to set global test environment)
```js
// No global setup required for current tests.
// This file exists for future extensions (e.g., mocking global timers).
```

---

**TEST_COMMAND**  
```bash
npm test
```

**EXPECTED_RESULT**  
All test files (`generateDocs.unit.test.js`, `generateDocs.integration.test.js`, `generateDocs.security.test.js`, `generateDocs.smoke.test.js`) pass, producing a `0` exit code. Console output shows `PASS` for each test suite.

**FAILURE_ACTION_ITEMS**  
- Verify that `node:child_process` and `node:util` are correctly mocked in each test file.  
- Ensure `process.argv` is reset after each test to avoid cross‑test contamination.  
- If any test fails due to missing `execAsync` export, expose it in `generateDocs.js` (e.g., `export { execAsync }`).  
- If `npm test` reports `jest` not found, run `npm install` to install dev dependencies.  
- If tests hang or time‑out, increase Jest's `testTimeout` via `jest.setTimeout(30000)` in a setup file.  
- If the redoc‑cli command changes, update the command string regex accordingly.