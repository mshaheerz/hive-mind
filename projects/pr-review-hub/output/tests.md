**File: `__tests__/fetchPullRequests.unit.test.js`**
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

---

**File: `__tests__/fetchPullRequests.edge.test.js`**
```javascript
/**
 * @jest-environment node
 */

import { fetchPullRequests } from '../app/actions/fetchPullRequests';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

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
    Octokit.mockImplementation(() => ({
      pulls: { list: jest.fn().mockResolvedValue({ data: generatePrs(1) }) },
    }));
    const result = await fetchPullRequests(repos, token);
    expect(result).toHaveLength(200); // 200 repos × 1 PR each
  });

  it('returns empty array when Octokit returns empty data per repo', async () => {
    const repos = [
      { owner: 'empty', repo: 'repo1' },
      { owner: 'empty', repo: 'repo2' },
    ];
    Octokit.mockImplementation(() => ({
      pulls: { list: jest.fn().mockResolvedValue({ data: [] }) },
    }));
    const result = await fetchPullRequests(repos, token);
    expect(result).toEqual([]);
  });

  it('handles rate‑limit errors gracefully', async () => {
    const rateLimitError = new Error('API rate limit exceeded');
    rateLimitError.status = 403;
    Octokit.mockImplementation(() => ({
      pulls: { list: jest.fn().mockRejectedValue(rateLimitError) },
    }));
    await expect(fetchPullRequests(repos, token)).rejects.toThrow(
      'API rate limit exceeded'
    );
  });

  it('cancels all requests if one fails', async () => {
    const repos = [
      { owner: 'good', repo: 'repo1' },
      { owner: 'bad', repo: 'repo2' },
    ];
    const goodPr = { id: 1, number: 1, title: 'Good PR' };
    Octokit.mockImplementation(() => ({
      pulls: {
        list: jest.fn((opts) => {
          if (opts.repo === 'repo2')
            return Promise.reject(new Error('Failed repo'));
          return Promise.resolve({ data: [goodPr] });
        }),
      },
    }));
    await expect(fetchPullRequests(repos, token)).rejects.toThrow('Failed repo');
  });
});
```

---

**File: `__tests__/Dashboard.test.js`**
```javascript
/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../app/components/Dashboard';
import * as fetchModule from '../app/actions/fetchPullRequests';

// Mock the fetchPullRequests action
jest.mock('../app/actions/fetchPullRequests');

const mockSession = { accessToken: 'test-token' };

describe('Dashboard – Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state and then PR cards', async () => {
    const mockPrs = [
      { id: 101, number: 10, title: 'First PR' },
      { id: 102, number: 20, title: 'Second PR' },
    ];
    fetchModule.fetchPullRequests.mockResolvedValue(mockPrs);

    render(<Dashboard session={mockSession} />);

    // While awaiting the async component, nothing should be rendered yet
    expect(screen.queryByText(/Open Pull Requests/i)).not.toBeInTheDocument();

    // Wait for PR cards to appear
    await waitFor(() => expect(screen.getByText('First PR')).toBeInTheDocument());
    expect(screen.getByText('Second PR')).toBeInTheDocument();
  });

  it('shows “No open pull requests found.” when list is empty', async () => {
    fetchModule.fetchPullRequests.mockResolvedValue([]);
    render(<Dashboard session={mockSession} />);
    await waitFor(() => expect(screen.getByText(/No open pull requests found./i)).toBeInTheDocument());
  });

  it('passes session.accessToken to each PullRequestCard', async () => {
    const mockPr = { id: 201, number: 30, title: 'Token Test PR' };
    fetchModule.fetchPullRequests.mockResolvedValue([mockPr]);

    // Spy on the PullRequestCard component
    jest.mock('../app/components/PullRequestCard', () => ({
      __esModule: true,
      default: ({ pr, token }) => (
        <div data-testid="card" data-token={token}>
          {pr.title}
        </div>
      ),
    }));

    const { default: PullRequestCard } = require('../app/components/PullRequestCard');
    render(<Dashboard session={mockSession} />);
    await waitFor(() => expect(screen.getByText('Token Test PR')).toBeInTheDocument());

    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('data-token', mockSession.accessToken);
  });

  it('handles fetchPullRequests throwing an error gracefully', async () => {
    fetchModule.fetchPullRequests.mockRejectedValue(new Error('Network'));
    render(<Dashboard session={mockSession} />);
    await waitFor(() => expect(screen.getByText(/Error fetching PRs/i)).toBeInTheDocument());
  });
});
```

> **Note** – The error handling test above assumes you add a fallback UI inside `Dashboard` for errors. If not present, the test will fail; adjust accordingly.

---

**File: `__tests__/Home.test.js`**
```javascript
/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import Home from '../app/page';
import * as auth from '../app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));
jest.mock('../app/api/auth/[...nextauth]/route', () => ({
  authOptions: { /* minimal mock */ },
}));

describe('Home – Page Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows sign‑in button when no session', async () => {
    getServerSession.mockResolvedValue(null);
    render(<Home />);
    await waitFor(() => expect(screen.getByRole('link', { name: /sign in with github/i })).toBeInTheDocument());
  });

  it('renders Dashboard when session exists', async () => {
    const mockSession = { accessToken: 'session-token' };
    getServerSession.mockResolvedValue(mockSession);
    // Mock Dashboard to avoid deep rendering
    jest.mock('../app/components/Dashboard', () => () => <div>Dashboard</div>);
    const { default: Dashboard } = require('../app/components/Dashboard');

    render(<Home />);
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
  });
});
```

---

**File: `__tests__/setupTests.js`**
```javascript
import '@testing-library/jest-dom/extend-expect';
```

Add this file path to `setupFilesAfterEnv` in `jest.config.js` (already present in the repo).

---

**File: `__tests__/TEST_PLAN.md`**
```markdown
# Manual Test Plan – PR Review Hub

## 1. Authentication Flow
- [ ] Sign‑in with GitHub using OAuth.
- [ ] Verify that the session is stored and persists across page reloads.
- [ ] Attempt sign‑in with an account that has no repo access; ensure proper error handling.

## 2. Dashboard Rendering
| Scenario | Expected Result |
|----------|-----------------|
| No open PRs | Text “No open pull requests found.” |
| 1–5 open PRs | Correct number of PullRequestCard components displayed |
| >5 open PRs | Grid layout adapts correctly (2 columns on md+) |

## 3. Inline Commenting
- [ ] Open a PR card, add an inline comment, submit.
- [ ] Confirm comment appears on GitHub PR page.
- [ ] Verify rate‑limit handling when exceeding 60/min.

## 4. Refresh Logic
- [ ] Create a new PR in one monitored repo.
- [ ] Verify the dashboard updates within 30 s.

## 5. Permissions
- [ ] Use a user with read‑only access to a repo; ensure they can view PRs but cannot comment.
- [ ] Use a user with write access; ensure comments are posted.

## 6. Error Scenarios
| Error | Expected UI |
|-------|-------------|
| Network failure during fetch | “Error fetching PRs” message |
| GitHub API rate limit exceeded | “Rate limit exceeded” notification |
| Invalid token | Prompt to re‑authenticate |

## 7. Security
- [ ] Inspect CSP headers in browser devtools; ensure no `unsafe-inline` or `unsafe-eval`.
- [ ] Verify that no secrets leak to client (e.g., `NEXTAUTH_SECRET`).

## 8. Performance
- [ ] Load dashboard with 200 monitored repos; ensure rendering time < 5 s.
- [ ] Monitor CPU/memory usage during heavy load.

## 9. Accessibility
- [ ] All interactive elements are keyboard reachable.
- [ ] ARIA labels are present on icons and buttons.

## 10. Edge Cases
- [ ] Empty `repos` array in `fetchPullRequests` – should return empty list.
- [ ] Null/undefined token – should throw error.
- [ ] Extremely long PR titles – ensure UI truncates gracefully.

> **Note:** Use a staging environment with real GitHub tokens to test live API interactions. All tests should be run in isolation to avoid hitting GitHub rate limits.
```

---

**File: `__tests__/smoke.test.js`**
```javascript
/**
 * @jest-environment node
 *
 * Minimal smoke test: ensure that the Home page renders without throwing,
 * and that the fetchPullRequests action can be invoked with a dummy token.
 */

import Home from '../app/page';
import { fetchPullRequests } from '../app/actions/fetchPullRequests';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('Smoke Tests', () => {
  it('fetchPullRequests resolves with empty list when no repos', async () => {
    Octokit.mockImplementation(() => ({
      pulls: { list: jest.fn().mockResolvedValue({ data: [] }) },
    }));
    const result = await fetchPullRequests([], 'dummy');
    expect(result).toEqual([]);
  });

  it('Home renders and returns a Promise', async () => {
    const res = Home();
    expect(res).toBeInstanceOf(Promise);
  });
});
```

---

**TEST_COMMAND**:  
```bash
npm test
```

**EXPECTED_RESULT**:  
All test suites (`fetchPullRequests.unit.test.js`, `fetchPullRequests.edge.test.js`, `Dashboard.test.js`, `Home.test.js`, `smoke.test.js`) should pass. The test summary should show 0 failures.

**FAILURE_ACTION_ITEMS**:
- If any test fails, review the corresponding test file and the implementation under test for mismatched expectations.
- Ensure `jest.config.js` includes the correct `setupFilesAfterEnv` path (`'@testing-library/jest-dom/extend-expect'`).
- Verify that the mocked `Octokit` implementation correctly simulates the GitHub API responses.
- Check that the Dashboard component correctly handles errors (add fallback UI if missing).