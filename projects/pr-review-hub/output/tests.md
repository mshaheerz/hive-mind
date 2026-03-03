### Unit Tests for Each Function

**File: `app/actions/fetchPullRequests.test.js`**
```javascript
import { fetchPullRequests } from '../app/actions/fetchPullRequests';
import Octokit from '@octokit/rest';

describe('fetchPullRequests', () => {
  const token = 'dummy-token';
  let octokit;

  beforeEach(() => {
    octokit = new Octokit({ auth: token });
  });

  it('should fetch open pull requests for a list of repositories', async () => {
    const repos = [
      { owner: 'vercel', repo: 'next.js' },
      { owner: 'facebook', repo: 'react' },
    ];
    const mockPrs = [
      { id: 1, number: 123, title: 'PR 1' },
      { id: 2, number: 456, title: 'PR 2' },
    ];

    // Mock the Octokit pulls.list method
    octokit.pulls.list.mockResolvedValue({ data: mockPrs });

    const result = await fetchPullRequests(repos, token);
    expect(result).toHaveLength(4); // 2 repos × 2 PRs each
    expect(result).toEqual(expect.arrayContaining(mockPrs));
  });

  it('should handle empty response from Octokit', async () => {
    const repos = [
      { owner: 'empty', repo: 'repo1' },
      { owner: 'empty', repo: 'repo2' },
    ];

    // Mock the Octokit pulls.list method to return an empty array
    octokit.pulls.list.mockResolvedValue({ data: [] });

    const result = await fetchPullRequests(repos, token);
    expect(result).toEqual([]);
  });

  it('should handle rate-limit errors gracefully', async () => {
    const rateLimitError = new Error('API rate limit exceeded');
    rateLimitError.status = 403;
    octokit.pulls.list.mockRejectedValue(rateLimitError);

    await expect(fetchPullRequests(repos, token)).rejects.toThrow(
      'API rate limit exceeded'
    );
  });
});
```

### Edge Cases (Empty, Null, Overflow, etc.)

**File: `app/actions/fetchPullRequests.edge.test.js`**
```javascript
import { fetchPullRequests } from '../app/actions/fetchPullRequests';
import Octokit from '@octokit/rest';

describe('fetchPullRequests – Edge Cases', () => {
  const token = 'edge-token';

  // Helper to generate many PRs
  const generatePrs = (count) =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      number: 200 + i,
      title: `Edge PR ${i}`,
    }));

  it('handles a very large number of repos (200)', async () => {
    const repos = Array.from({ length: 200 }, (_, i) => ({
      owner: `owner${i}`,
      repo: `repo${i}`,
    }));
    octokit.pulls.list.mockResolvedValue({ data: generatePrs(1) });

    const result = await fetchPullRequests(repos, token);
    expect(result).toHaveLength(200); // 200 repos × 1 PR each
  });

  it('returns empty array when Octokit returns empty data per repo', async () => {
    const repos = [
      { owner: 'empty', repo: 'repo1' },
      { owner: 'empty', repo: 'repo2' },
    ];
    octokit.pulls.list.mockResolvedValue({ data: [] });

    const result = await fetchPullRequests(repos, token);
    expect(result).toEqual([]);
  });

  it('handles rate‑limit errors gracefully', async () => {
    const rateLimitError = new Error('API rate limit exceeded');
    rateLimitError.status = 403;
    octokit.pulls.list.mockRejectedValue(rateLimitError);

    await expect(fetchPullRequests(repos, token)).rejects.toThrow(
      'API rate limit exceeded'
    );
  });

  it('cancels all requests if one fails', async () => {
    const repos = [
      { owner: 'good', repo: 'repo1' },
      { owner: 'bad', repo: 'repo2' },
    ];
    octokit.pulls.list.mockImplementation((opts) => {
      if (opts.repo === 'repo2')
        return Promise.reject(new Error('Failed repo'));
      return Promise.resolve({ data: [] });
    });

    await expect(fetchPullRequests(repos, token)).rejects.toThrow('Failed repo');
  });
});
```

### Integration Tests

**File: `app/actions/fetchPullRequests.integration.test.js`**
```javascript
import { fetchPullRequests } from '../app/actions/fetchPull Requests';
import Octokit from '@octokit/rest';

describe('fetchPullRequests Integration Tests', () => {
  const token = 'dummy-token';
  let octokit;

  beforeEach(() => {
    octokit = new Octokit({ auth: token });
  });

  it('should fetch and process PRs for multiple repos', async () => {
    const repos = [
      { owner: 'vercel', repo: 'next.js' },
      { owner: 'facebook', repo: 'react' },
    ];
    const mockPrs = [
      { id: 1, number: 123, title: 'PR 1' },
      { id: 2, number: 456, title: 'PR 2' },
    ];

    // Mock the Octokit pulls.list method
    octokit.pulls.list.mockResolvedValue({ data: mockPrs });

    const result = await fetchPullRequests(repos, token);
    expect(result).toHaveLength(4); // 2 repos × 2 PRs each
    expect(result).toEqual(expect.arrayContaining(mockPrs));
  });
});
```

### Test Plan for Manual Testing

1. **Basic Functionality**: Ensure that the function correctly processes a list of repositories and returns an array of pull requests.
2. **Edge Cases**:
   - Empty repository list: Verify that it handles this gracefully by returning an empty array.
   - Rate-limit errors: Simulate API rate limit errors to ensure the function can handle them and return appropriate error messages.
3. **Concurrency**: Test concurrent requests for multiple repositories to ensure they are processed efficiently without conflicts.

### Minimal Runnable Smoke Test

```bash
TEST_COMMAND: npm test
EXPECTED_RESULT: All tests pass with no failures
FAILURE_ACTION_ITEMS:
- Check that all test files exist in the specified directories.
- Ensure that the necessary environment variables (like `NEXTAUTH_SECRET`) are set correctly.
- Verify that Octokit is properly mocked and that the error handling is working as expected.
```

### Additional Notes

- **Environment Variables**: Ensure that any sensitive information like tokens or secrets are not hard-coded in test files. Consider using a `.env.local` file for local testing.
- **Logging**: Implement logging within the function to capture debug messages during execution, which can be helpful for troubleshooting issues.
- **Error Handling**: Test various error scenarios to ensure robustness of the function.

This setup provides a comprehensive test suite that covers the core functionality and edge cases of the `fetchPullRequests` function.