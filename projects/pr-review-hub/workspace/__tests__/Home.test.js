/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import Home from '../app/page';
import * as auth from '../app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));
jest.mock('../app/api/auth/[...nextauth]/route', () => ({
  authOptions: { /* minimal mock */ },
}));

describe('Home – Page Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows sign‑in button when no session', async () => {
    getServerSession.mockResolvedValue(null);
    render(<Home />);
    await waitFor(() => expect(screen.getByRole('link', { name: /sign in with github/i })).toBeInTheDocument());
  });

  it('renders Dashboard when session exists', async () => {
    const mockSession = { accessToken: 'session-token' };
    getServerSession.mockResolvedValue(mockSession);
    // Mock Dashboard to avoid deep rendering
    jest.mock('../app/components/Dashboard', () => () => <div>Dashboard</div>);
    const { default: Dashboard } = require('../app/components/Dashboard');

    render(<Home />);
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
  });
});
