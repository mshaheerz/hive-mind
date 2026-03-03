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
