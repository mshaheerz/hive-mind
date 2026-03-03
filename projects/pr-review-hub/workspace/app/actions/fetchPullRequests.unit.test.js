// ... existing tests ...

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
