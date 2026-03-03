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
