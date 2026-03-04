**File: `__tests__/app/actions/fetchPullRequests.unit.more.test.js`**  
```javascript
/**
 * @jest-environment node
 */

import { fetchPullRequests } from '../../app/actions/fetchPullRequests';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('fetchPullRequests – Additional Unit Tests', () => {
  const repos = [
    { owner: 'vercel', repo: 'next.js' },
    { owner: 'facebook', repo: 'react' },
  ];
  const token = 'valid-token';

  beforeEach(() => {
    Octokit.mockClear();
  });

  // ------------------------------------------------------------------
  // 1️⃣ Token validation
  // ------------------------------------------------------------------
  it('throws if token is undefined', async () => {
    await expect(fetchPullRequests(repos, undefined)).rejects.toThrow(
      /token must be a non‑empty string/i
    );
  });

  it('throws if token is null', async () => {
    await expect(fetchPullRequests(repos, null)).rejects.toThrow(
      /token must be a non‑empty string/i
    );
  });

  it('throws if token is an empty string', async () => {
    await expect(fetchPullRequests(repos, '')).rejects.toThrow(
      /token must be a non‑empty string/i
    );
  });

  // ------------------------------------------------------------------
  // 2️⃣ Repos validation
  // ------------------------------------------------------------------
  it('throws if repos is not an array', async () => {
    await expect(fetchPullRequests(null, token)).rejects.toThrow(
      /repos must be an array/i
    );
  });

  // ------------------------------------------------------------------
  // 3️⃣ Correct Octokit usage
  // ------------------------------------------------------------------
  it('instantiates Octokit with the given token', async () => {
    Octokit.mockImplementation(() => ({
      pulls: { list: jest.fn().mockResolvedValue({ data: [] }) },
    }));

    await fetchPullRequests(repos, token);
    expect(Octokit).toHaveBeenCalledWith({ auth: token });
  });

  // ------------------------------------------------------------------
  // 4️⃣ Per‑page limit enforcement
  // ------------------------------------------------------------------
  it('returns at most 50 PRs per repo', async () => {
    const mockPrs = Array.from({ length: 75 }, (_, i) => ({
      id: i,
      number: 1000 + i,
      title: `PR ${i}`,
    }));
    Octokit.mockImplementation(() => ({
      pulls: { list: jest.fn().mockResolvedValue({ data: mockPrs }) },
    }));

    const result = await fetchPullRequests(repos, token);
    // 50 per repo × 2 = 100
    expect(result).toHaveLength(100);
    // All items should come from the first 50 of each mockPrs array
    expect(result[0].id).toBe(0);
    expect(result[49].id).toBe(49);
    expect(result[50].id).toBe(0); // reset for second repo
  });

  // ------------------------------------------------------------------
  // 5️⃣ Aggregation
  // ------------------------------------------------------------------
  it('aggregates PRs from all repos', async () => {
    const mockA = [{ id: 1, number: 101, title: 'A' }];
    const mockB = [{ id: 2, number: 202, title: 'B' }];
    Octokit.mockImplementation(() => ({
      pulls: {
        list: jest.fn((opts) => {
          if (opts.repo === 'next.js') return Promise.resolve({ data: mockA });
          if (opts.repo === 'react') return Promise.resolve({ data: mockB });
          return Promise.resolve({ data: [] });
        }),
      },
    }));

    const result = await fetchPullRequests(repos, token);
    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([...mockA, ...mockB]));
  });

  // ------------------------------------------------------------------
  // 6️⃣ Error propagation & cancellation
  // ------------------------------------------------------------------
  it('rejects when any request fails and cancels all', async () => {
    Octokit.mockImplementation(() => ({
      pulls: {
        list: jest.fn((opts) => {
          if (opts.repo === 'react')
            return Promise.reject(new Error('Repo error'));
          return Promise.resolve({ data: [] });
        }),
      },
    }));

    await expect(fetchPullRequests(repos, token)).rejects.toThrow(
      /Repo error/i
    );
  });

  // ------------------------------------------------------------------
  // 7️⃣ Rate‑limit handling
  // ------------------------------------------------------------------
  it('propagates rate‑limit errors with status 403', async () => {
    const rateErr = new Error('API rate limit exceeded');
    rateErr.status = 403;
    Octokit.mockImplementation(() => ({
      pulls: { list: jest.fn().mockRejectedValue(rateErr) },
    }));

    await expect(fetchPullRequests(repos, token)).rejects.toThrow(
      /API rate limit exceeded/i
    );
  });

  // ------------------------------------------------------------------
  // 8️⃣ Empty data
  // ------------------------------------------------------------------
  it('returns an empty array when all repos return empty data', async () => {
    Octokit.mockImplementation(() => ({
      pulls: { list: jest.fn().mockResolvedValue({ data: [] }) },
    }));

    const result = await fetchPullRequests(repos, token);
    expect(result).toEqual([]);
  });
});
```

---

**File: `__tests__/app/actions/fetchPullRequests.integration.test.js`**  
```javascript
/**
 * @jest-environment node
 */

import { fetchPullRequests } from '../../app/actions/fetchPullRequests';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('fetchPullRequests – Integration Style Tests', () => {
  const repos = [
    { owner: 'vercel', repo: 'next.js' },
    { owner: 'facebook', repo: 'react' },
  ];
  const token = 'integration-token';

  beforeEach(() => {
    Octokit.mockClear();
  });

  // Simulate a real‑world scenario where the first repo has many PRs
  // and the second repo has none.
  it('handles mixed PR counts across repos', async () => {
    const manyPrs = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      number: 1000 + i,
      title: `PR ${i}`,
    }));
    Octokit.mockImplementation(() => ({
      pulls: {
        list: jest.fn((opts) => {
          if (opts.repo === 'next.js')
            return Promise.resolve({ data: manyPrs });
          if (opts.repo === 'react')
            return Promise.resolve({ data: [] });
          return Promise.resolve({ data: [] });
        }),
      },
    }));

    const result = await fetchPullRequests(repos, token);
    expect(result).toHaveLength(30);
    expect(result[0].id).toBe(0);
    expect(result[29].id).toBe(29);
  });

  // Verify that the function respects the per_page limit even when
  // more than 50 PRs exist in a repo.
  it('does not exceed the per_page limit when PRs > 50', async () => {
    const manyPrs = Array.from({ length: 120 }, (_, i) => ({
      id: i,
      number: 2000 + i,
      title: `PR ${i}`,
    }));
    Octokit.mockImplementation(() => ({
      pulls: { list: jest.fn().mockResolvedValue({ data: manyPrs }) },
    }));

    const result = await fetchPullRequests(repos, token);
    expect(result).toHaveLength(100); // 50 × 2 repos
  });
});
```

---

**File: `__tests__/app/components/Dashboard.unit.test.js`**  
```javascript
/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import Dashboard from '../../app/components/Dashboard';
import * as actions from '../../app/actions/fetchPullRequests';
import { Github } from 'lucide-react';

// Mock the server action
jest.mock('../../app/actions/fetchPullRequests', () => ({
  fetchPullRequests: jest.fn(),
}));

// Mock the PullRequestCard component to avoid deep rendering
jest.mock('../../app/components/PullRequestCard', () => () => (
  <div data-testid="pr-card">Card</div>
));

describe('Dashboard – Server Component', () => {
  const mockSession = { accessToken: 'dummy-access' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the header with the Github icon', () => {
    actions.fetchPullRequests.mockResolvedValue([]);
    render(<Dashboard session={mockSession} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Open Pull Requests'
    );
    // The icon is a React component; ensure it renders
    expect(screen.getByTestId('lucide-github')).toBeInTheDocument();
  });

  it('shows “No open pull requests found.” when the list is empty', async () => {
    actions.fetchPullRequests.mockResolvedValue([]);
    render(<Dashboard session={mockSession} />);
    expect(
      await screen.findByText(/no open pull requests found/i)
    ).toBeInTheDocument();
  });

  it('renders a PullRequestCard for each PR', async () => {
    const prs = [
      { id: 1, number: 101, title: 'PR 1' },
      { id: 2, number: 102, title: 'PR 2' },
    ];
    actions.fetchPullRequests.mockResolvedValue(prs);
    render(<Dashboard session={mockSession} />);
    const cards = await screen.findAllByTestId('pr-card');
    expect(cards).toHaveLength(2);
  });

  it('passes the correct props to PullRequestCard', async () => {
    const pr = { id: 99, number: 999, title: 'Special PR' };
    actions.fetchPullRequests.mockResolvedValue([pr]);

    render(<Dashboard session={mockSession} />);
    // Since PullRequestCard is mocked, we can't inspect props directly.
    // Instead we verify that the mock was called with the expected args.
    const PullRequestCard = require('../../app/components/PullRequestCard').default;
    expect(PullRequestCard).toHaveBeenCalledWith(
      expect.objectContaining({ pr, token: mockSession.accessToken }),
      {}
    );
  });
});
```

---

**File: `__tests__/app/page/Home.unit.test.js`**  
```javascript
/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import Home from '../../app/page';
import { getServerSession } from 'next-auth';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));
jest.mock('../../app/api/auth/[...nextauth]/route', () => ({
  authOptions: { /* minimal mock */ },
}));

// Mock Dashboard to keep the test focused on Home
jest.mock('../../app/components/Dashboard', () => () => (
  <div data-testid="dashboard">Dashboard</div>
));

describe('Home – Page Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows sign‑in button when no session', async () => {
    getServerSession.mockResolvedValue(null);
    render(<Home />);
    const btn = await screen.findByRole('link', {
      name: /sign in with github/i,
    });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('href', '/api/auth/signin');
  });

  it('renders Dashboard when session exists', async () => {
    const mockSession = { accessToken: 'session-token' };
    getServerSession.mockResolvedValue(mockSession);
    render(<Home />);
    const dash = await screen.findByTestId('dashboard');
    expect(dash).toBeInTheDocument();
  });
});
```

---

**File: `__tests__/cli/cleanCodeReview.unit.test.js`**  
```javascript
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
```

---

**File: `__tests__/cli/reactBestPracticesReview.unit.test.js`**  
```javascript
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
```

---

**File: `__tests__/smoke.test.js`**  
```javascript
/**
 * @jest-environment node
 */

import { fetchPullRequests } from './app/actions/fetchPullRequests';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('Smoke – fetchPullRequests minimal test', () => {
  beforeAll(() => {
    Octokit.mockImplementation(() => ({
      pulls: { list: jest.fn().mockResolvedValue({ data: [] }) },
    }));
  });

  it('returns an empty array when no repos are provided', async () => {
    const result = await fetchPullRequests([], 'dummy-token');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});
```

---

**File: `__tests__/testPlan.md`**  
```markdown
# Test Plan – PR Review Hub

| Layer | Feature | Test Scenario | Edge Cases | Pass/Fail Criteria |
|-------|---------|---------------|------------|--------------------|
| **Unit** | `fetchPullRequests` | Valid token, 2 repos, each 1 PR | Token null/undefined/empty, repos not array, repo missing owner/repo | Throws appropriate error; returns combined array |
| | | Large repo list (200) | >50 PRs per repo | Returns 100 PRs (50 per repo) |
| | | Rate‑limit error (403) | One request fails | Promise rejects with original error |
| | | Empty data | All repos return empty | Returns empty array |
| | | Invalid token | | Throws validation error |
| **Integration** | `Dashboard` | Renders header, icon, PR cards | Empty PR list | Shows "No open pull requests found." |
| | | Session present | | Renders Dashboard component |
| **Component** | `Home` | No session | | Shows sign‑in button |
| | | Session present | | Renders Dashboard |
| **CLI** | `clean-code-review` | Scan folder with example.js | No files | Generates empty report |
| | | Generate report | File write error | Prints error |
| | | Search rules | Keyword missing | Prints usage error |
| | | Search rules | No matches | Prints nothing |
| **Security** | OAuth flow | Token leakage | | No sensitive data logged |
| | | Rate‑limit handling | | No infinite retries |
| **Performance** | `fetchPullRequests` | 200 repos, 50 PRs each | | All requests complete within reasonable time (mocked) |

**Manual Test Checklist**

1. **Authentication** – Sign in with GitHub, verify token is stored in session.
2. **Dashboard** – Verify PRs from 5 configured repos appear.
3. **Inline Comment** – Post a comment via the UI, confirm it appears on GitHub.
4. **Refresh** – Modify a PR on GitHub, confirm dashboard updates within 30 s.
5. **Rate‑limit** – Simulate 60 requests per minute, verify graceful degradation.
6. **Large Data** – Add 200 repos, confirm dashboard loads without UI freeze.
7. **Error Paths** – Disconnect network, verify user-friendly error message.
8. **CLI** – Run `clean-code-review` and `react-best-practices-review` with various arguments, confirm output matches expectations.
9. **Security** – Inspect network requests, ensure no credentials are sent to third parties.

**What “Done” Looks Like**

- All unit and integration tests pass (`npm test` → 100 % coverage for `fetchPullRequests`).
- Dashboard renders correctly with mock data.
- Home page behaves as expected with and without session.
- CLI scripts generate reports and handle edge cases.
- Manual checklist items are verified and documented.
```

---

**File: `jest.config.js`** (ensure test environment for each test file)  
```javascript
module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-react'] }],
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['app/**/*.js', 'src/**/*.ts', 'src/**/*.js'],
};
```

---

**END OF TESTS**

**TEST_COMMAND:** `npm test`

**EXPECTED_RESULT:**  
All tests should pass (`PASS` output for every test file). Coverage should reach at least 90 % for `fetchPullRequests` and overall test coverage should be > 80 %.

**FAILURE_ACTION_ITEMS:**
- If `fetchPullRequests` tests fail, verify the token validation logic and that the function throws the correct error messages.
- If Dashboard tests fail, ensure the component imports and renders `PullRequestCard` correctly and that the mock is set up properly.
- If Home tests fail, confirm that `getServerSession` is mocked correctly and that the component renders the expected UI based on session presence.
- If CLI tests fail, check file system paths, permissions, and that the CLI scripts handle edge cases as coded.
- If any test reports a coverage shortfall, add missing edge‑case tests or adjust mock implementations to cover all branches.