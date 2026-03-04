/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import Dashboard from '../../app/components/Dashboard';
import * as actions from '../../app/actions/fetchPullRequests';
import { Github } from 'lucide-react';

// Mock the server action
jest.mock('../../app/actions/fetchPullRequests', () => ({
  fetchPullRequests: jest.fn(),
}));

// Mock the PullRequestCard component to avoid deep rendering
jest.mock('../../app/components/PullRequestCard', () => () => (
  <div data-testid="pr-card">Card</div>
));

describe('Dashboard – Server Component', () => {
  const mockSession = { accessToken: 'dummy-access' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the header with the Github icon', () => {
    actions.fetchPullRequests.mockResolvedValue([]);
    render(<Dashboard session={mockSession} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Open Pull Requests'
    );
    // The icon is a React component; ensure it renders
    expect(screen.getByTestId('lucide-github')).toBeInTheDocument();
  });

  it('shows “No open pull requests found.” when the list is empty', async () => {
    actions.fetchPullRequests.mockResolvedValue([]);
    render(<Dashboard session={mockSession} />);
    expect(
      await screen.findByText(/no open pull requests found/i)
    ).toBeInTheDocument();
  });

  it('renders a PullRequestCard for each PR', async () => {
    const prs = [
      { id: 1, number: 101, title: 'PR 1' },
      { id: 2, number: 102, title: 'PR 2' },
    ];
    actions.fetchPullRequests.mockResolvedValue(prs);
    render(<Dashboard session={mockSession} />);
    const cards = await screen.findAllByTestId('pr-card');
    expect(cards).toHaveLength(2);
  });

  it('passes the correct props to PullRequestCard', async () => {
    const pr = { id: 99, number: 999, title: 'Special PR' };
    actions.fetchPullRequests.mockResolvedValue([pr]);

    render(<Dashboard session={mockSession} />);
    // Since PullRequestCard is mocked, we can't inspect props directly.
    // Instead we verify that the mock was called with the expected args.
    const PullRequestCard = require('../../app/components/PullRequestCard').default;
    expect(PullRequestCard).toHaveBeenCalledWith(
      expect.objectContaining({ pr, token: mockSession.accessToken }),
      {}
    );
  });
});
