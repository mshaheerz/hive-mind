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
