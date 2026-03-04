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
