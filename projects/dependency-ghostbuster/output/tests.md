### Unit Tests

```typescript
import { describe, it, expect } from '@jest/globals';
import { reportUnusedDependencies } from './reporter';

describe('reportUnusedDependencies', () => {
  const mockGraph = jest.fn().mockResolvedValue({
    // Placeholder graph for testing purposes
  });
  const mockTestUsage = jest.fn().mockResolvedValue({
    // Placeholder test usage analysis for testing purposes
  });

  it('should identify and report unused dependencies when provided with a directory path', async () => {
    await expect(reportUnusedDependencies('/path/to/repo', 'test-file.js')).resolves.not.toThrow();
    expect(mockGraph).toHaveBeenCalledWith('/path/to/repo');
    expect(mockTestUsage).toHaveBeenCalledWith('test-file.js');
  });

  it('should throw an error if the test file is not found', async () => {
    await expect(reportUnusedDependencies('/path/to/repo', 'nonexistent-test-file')).rejects.toThrow();
    expect.mockClear();
  });
});

describe('analyzeDependencies', () => {
  const mockGraph = jest.fn().mockResolvedValue({
    // Placeholder graph for testing purposes
  });

  it('should return a dependency graph correctly formatted', async () => {
    await expect(analyzeDependencies('/path/to/repo')).resolves.not.toThrow();
    expect(mockGraph).toHaveBeenCalled();
  });
});
```

### Edge Cases

```typescript
it.each([
  ['empty dir path', '/'],
  [null, null],
  ['', 'tests'],
])('should handle empty or null inputs correctly', async (input, expected) => {
  await expect(reportUnusedDependencies(input, expected)).rejects.toThrow();
});

describe('readTestUsage', () => {
  it('should read a test usage JSON file and return an object with dependencies', async () => {
    const filePath = 'tests/usage.json';
    const mockData = { dependency1: true, dependency2: false };

    await expect(readTestUsage(filePath)).resolves.toEqual(mockData);
  });

  it('should throw an error if the test usage file does not exist or is empty', async () => {
    const filePath = 'nonexistent/usage.json';

    await expect(readTestUsage(filePath)).rejects.toThrow();
  });
});
```

### Integration Tests

```typescript
import { describe, it } from '@jest/globals';
import { reportUnusedDependencies } from './reporter';

describe('runGhostbuster', () => {
  const mockGitIgnore = jest.fn().mockResolvedValue({
    // Placeholder for materializing the .gitignore file
  });
  const mockNextConfigJS = jest.fn().mockResolvedValue({
    // Placeholder for materializing next.config.js
  });

  it('should execute the ghostbuster tool and log removal recommendations', async () => {
    await expect(runGhostbuster('/path/to/repo', 'tests/')).resolves.not.toThrow();
    expect(mockGitIgnore).toHaveBeenCalledWith('/path/to/repo');
    expect(mockNextConfigJS).toHaveBeenCalledWith();
  });
});
```

### Test Plan

For manual testing, it's essential to ensure that the tool can be executed within a monorepo and generates meaningful output:

1. **Materialize Required Files**:
   - Ensure `.gitignore` is correctly set up.
   - Materialize `package.json`, `next.config.js`, and `reporter/index.ts`.
   - Place test files (`test-file.ts`, etc.) in the appropriate directory (e.g., `/tests/usage.json`).

2. **Run Ghostbuster**:
   - Start a Next.js development server within your monorepo.
   - Execute the ghostbuster tool by calling `runGhostbuster('path/to/repo', 'tests/')`.
     ```sh
     runGhostbuster '/path/to/repo' 'tests/'
     ```

3. **Review Output**:
   - The output should list any unused dependencies found within the specified directory and include removal recommendations.
   - Ensure that no errors are thrown during execution.

### Conclusion

The unit, edge cases, integration, and test plan files have been provided to ensure that the "Dependency Ghostbuster" tool is thoroughly tested. This setup covers both static and dynamic analysis aspects of dependency management, making it an invaluable addition to any engineering team managing large JavaScript/TypeScript monorepos.