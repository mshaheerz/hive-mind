/**
 * @jest-environment node
 */

import { fetchPullRequests } from '../app/actions/fetchPullRequests';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('fetchPullRequests', () => {
  const mockRepos = [
    { owner: 'vercel', repo: 'next.js' },
    { owner: 'facebook', repo: 'react' },
  ];
  const mockToken = 'fake-token';

  beforeEach(() => {
    Octokit.mockImplementation(() => ({
      pulls: {
        list: jest.fn().mockResolvedValue({
          data: [
            {
              id: 1,
              number: 123,
              title: 'Test PR',
              html_url: 'https://github.com/vercel/next.js/pull/123',
            },
          ],
        }),
      },
    }));
  });

  it('returns an array of PR objects', async () => {
    const prs = await fetchPullRequests(mockRepos, mockToken);
    expect(Array.isArray(prs)).toBe(true);
    expect(prs).toHaveLength(2); // two repos, each returns one mock PR
    expect(prs[0]).toHaveProperty('id');
    expect(prs[0]).toHaveProperty('title');
  });
});
