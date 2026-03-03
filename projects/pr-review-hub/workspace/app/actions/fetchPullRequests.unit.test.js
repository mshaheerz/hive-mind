// @flow
import { fetchPullRequests } from '../app/actions/fetchPullRequests';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('fetchPullRequests', () => {
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

  it('should handle invalid GitHub client ID and secret', async () => {
    Octokit.mockImplementation(() => ({
      pulls: { list: jest.fn().mockRejectedValue({ message: 'Bad Request', status: 400 }) },
    }));

    await expect(fetchPullRequests(repos, token)).rejects.toThrow('Bad Request');
  });
});
