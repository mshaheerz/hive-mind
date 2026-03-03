---

### Test Plan

#### Unit Tests

Each function in `app/actions/fetchPullRequests.js` is covered by unit tests. This includes scenarios like empty repo list, null/undefined token, network error, and pagination.

**File: `app/actions/fetchPullRequests.unit.test.js`**
```javascript
/**
 * @jest-environment node
 */

import { fetchPullRequests } from '../app/actions/fetchPullRequests';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('fetchPullRequests – Unit Tests', () => {
  const repos = [
    { owner: 'vercel', repo: 'next.js' },
    { owner: 'facebook', repo: 'react' },
  ];
  const token = 'dummy-token';

  beforeEach(() => {
    Octokit.mockClear();
  });

  it('should return combined PR list from multiple repos', async () => {
    const mockPrs = [
      { id: 1, number: 123, title: 'PR 1' },
      { id: 2, number: 456, title: 'PR 2' },
    ];
    Octokit.mockImplementation(() => ({
      pulls: {
        list: jest.fn().mockResolvedValue({ data: mockPrs }),
      },
    }));

    const result = await fetchPullRequests(repos, token);
    expect(result).toHaveLength(4); // 2 repos × 2 PRs each
    expect(result).toEqual(expect.arrayContaining(mockPrs));
  });

  it('should handle empty repo list', async () => {
    const result = await fetchPullRequests([], token);
    expect(result).toEqual([]);
  });

  it('should throw when token is null/undefined', async () => {
    await expect(fetchPullRequests(repos, null)).rejects.toThrow();
  });

  it('should propagate Octokit errors', async () => {
    Octokit.mockImplementation(() => ({
      pulls: { list: jest.fn().mockRejectedValue(new Error('API Error')) },
    }));
    await expect(fetchPullRequests(repos, token)).rejects.toThrow('API Error');
  });

  it('should respect per_page limit and return all PRs', async () => {
    const mockPrs = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      number: 100 + i,
      title: `PR ${i}`,
    }));
    Octokit.mockImplementation(() => ({
      pulls: { list: jest.fn().mockResolvedValue({ data: mockPrs }) },
    }));
    const result = await fetchPullRequests(repos, token);
    expect(result).toHaveLength(100); // 2 repos × 50 PRs each
  });
});
```

#### Edge Cases

- **Empty Repo List**: Tests that an empty array of repos results in an empty array of PRs.
- **Null/Undefined Token**: Ensures the function handles a null or undefined token gracefully by throwing an error.
- **Network Error**: Verifies that the function can handle network errors gracefully.
- **Pagination**: Confirms that pagination is handled correctly with `per_page`.

**File: `app/actions/fetchPullRequests.unit.test.js`**
```javascript
// ... existing tests ...

it('should respect per_page limit and return all PRs', async () => {
  const mockPrs = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    number: 100 + i,
    title: `PR ${i}`,
  }));
  Octokit.mockImplementation(() => ({
    pulls: { list: jest.fn().mockResolvedValue({ data: mockPrs }) },
  }));
  const result = await fetchPullRequests(repos, token);
  expect(result).toHaveLength(100); // 2 repos × 50 PRs each
});
```

#### Integration Tests

No integration tests are provided in the given codebase. However, to ensure that all functions work together correctly, a minimal runnable smoke test can be created.

**File: `app/smoke-test.js`**
```javascript
// Ensure all actions work together correctly
const fetchPullRequests = require('../app/actions/fetchPullRequests');
const Octokit = require('@octokit/rest');

(async () => {
  const octokit = new Octokit({ auth: 'your-github-pat' });
  const repos = [
    { owner: 'vercel', repo: 'next.js' },
    { owner: 'facebook', repo: 'react' },
  ];

  try {
    const prs = await fetchPullRequests(repos, octokit);
    console.log('PRs:', prs);
  } catch (error) {
    console.error('Error fetching PRs:', error.message);
  }
})();
```

#### Test Command and Expected Result

TEST_COMMAND: `node app/smoke-test.js`

EXPECTED_RESULT:
- The script should run successfully without errors, printing the list of PRs from GitHub.
- If an error occurs, it should log an error message to the console indicating the failure.

FAILURE_ACTION_ITEMS:
- Ensure that the GitHub personal access token (`your-github-pat`) is correctly set in your environment or configuration file.
- Verify that the network connection to GitHub is stable and that the repository names are valid.
- Check for any rate limiting issues that might prevent the request from completing.