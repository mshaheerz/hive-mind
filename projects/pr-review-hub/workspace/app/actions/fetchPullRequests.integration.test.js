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
