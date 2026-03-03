// ... existing tests ...

it('should render the correct title and pass session.accessToken', async () => {
  const mockPr = { id: 201, number: 30, title: 'Token Test PR' };
  fetchModule.fetchPullRequests.mockResolvedValue([mockPr]);

  // Spy on the PullRequestCard component
  jest.mock('../app/components/PullRequestCard', () => ({
    __esModule: true,
    default: ({ pr, token }) => (
      <div data-testid="card" data-token={token}>
        {pr.title}
      </div>
    ),
  }));

  const { default: PullRequestCard } = require('../app/components/PullRequestCard');
  render(<Dashboard session={mockSession} />);
  await waitFor(() => expect(screen.getByText('Token Test PR')).toBeInTheDocument());

  const card = screen.getByTestId('card');
  expect(card).toHaveAttribute('data-token', mockSession.accessToken);
});
