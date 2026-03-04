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
