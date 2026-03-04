/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import Home from '../../app/page';
import { getServerSession } from 'next-auth';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));
jest.mock('../../app/api/auth/[...nextauth]/route', () => ({
  authOptions: { /* minimal mock */ },
}));

// Mock Dashboard to keep the test focused on Home
jest.mock('../../app/components/Dashboard', () => () => (
  <div data-testid="dashboard">Dashboard</div>
));

describe('Home – Page Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows sign‑in button when no session', async () => {
    getServerSession.mockResolvedValue(null);
    render(<Home />);
    const btn = await screen.findByRole('link', {
      name: /sign in with github/i,
    });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('href', '/api/auth/signin');
  });

  it('renders Dashboard when session exists', async () => {
    const mockSession = { accessToken: 'session-token' };
    getServerSession.mockResolvedValue(mockSession);
    render(<Home />);
    const dash = await screen.findByTestId('dashboard');
    expect(dash).toBeInTheDocument();
  });
});
