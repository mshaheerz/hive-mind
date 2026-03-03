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
