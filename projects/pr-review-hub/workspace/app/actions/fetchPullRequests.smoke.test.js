// @flow
import { fetchPullRequests } from '../app/actions/fetchPullRequests';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('fetchPullRequests Smoke Test', () => {
  const repos = [
    { owner: 'vercel', repo: 'next.js' },
  ];
  const token = 'dummy-token';

  beforeEach(() => {
    Octokit.mockClear();
  });

  it('should fetch and process a single PR for a repo', async () => {
    const mockPrs = [{ id: 1, number: 123, title: 'PR 1' }];
    Octokit.mockImplementation(() => ({
      pulls: {
        list: jest.fn().mockResolvedValue({ data: mockPrs }),
      },
    }));

    const result = await fetchPullRequests(repos, token);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(mockPrs[0]);
  });
});
