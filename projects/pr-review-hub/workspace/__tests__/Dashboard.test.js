/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../app/components/Dashboard';
import * as fetchModule from '../app/actions/fetchPullRequests';

// Mock the fetchPullRequests action
jest.mock('../app/actions/fetchPullRequests');

const mockSession = { accessToken: 'test-token' };

describe('Dashboard – Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state and then PR cards', async () => {
    const mockPrs = [
      { id: 101, number: 10, title: 'First PR' },
      { id: 102, number: 20, title: 'Second PR' },
    ];
    fetchModule.fetchPullRequests.mockResolvedValue(mockPrs);

    render(<Dashboard session={mockSession} />);

    // While awaiting the async component, nothing should be rendered yet
    expect(screen.queryByText(/Open Pull Requests/i)).not.toBeInTheDocument();

    // Wait for PR cards to appear
    await waitFor(() => expect(screen.getByText('First PR')).toBeInTheDocument());
    expect(screen.getByText('Second PR')).toBeInTheDocument();
  });

  it('shows “No open pull requests found.” when list is empty', async () => {
    fetchModule.fetchPullRequests.mockResolvedValue([]);
    render(<Dashboard session={mockSession} />);
    await waitFor(() => expect(screen.getByText(/No open pull requests found./i)).toBeInTheDocument());
  });

  it('passes session.accessToken to each PullRequestCard', async () => {
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

  it('handles fetchPullRequests throwing an error gracefully', async () => {
    fetchModule.fetchPullRequests.mockRejectedValue(new Error('Network'));
    render(<Dashboard session={mockSession} />);
    await waitFor(() => expect(screen.getByText(/Error fetching PRs/i)).toBeInTheDocument());
  });
});
