// ... existing tests ...

it('should return combined PR list from multiple repos', async () => {
  const mockPrs = [
    { id: 1, number: 123, title: 'PR 1' },
    { id: 2, number: 456, title: 'PR 2' },
  ];
  Octokit.mockImplementation(() => ({
    pulls: { list: jest.fn().mockResolvedValue({ data: mockPrs }) },
  }));

  const result = await fetchPullRequests(repos, token);
  expect(result).toHaveLength(4); // 2 repos × 2 PRs each
  expect(result).toEqual(expect.arrayContaining(mockPrs));
});
