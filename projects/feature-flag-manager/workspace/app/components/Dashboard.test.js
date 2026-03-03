// Test file for Dashboard component edge cases

import { render, screen } from '@testing-library/react';
import Dashboard from '@/app/components/Dashboard';

describe('Dashboard Component', () => {
  it('handles empty flags list with default environment', async () => {
    render(<Dashboard />);
    await screen.findByText('Development');
    expect(screen.getByTestId('feature-flag-list')).toBeInTheDocument();
  });

  it('filters flags correctly based on selected environment', async () => {
    const flags = [
      { id: '1', key: 'flag1', description: '', environment: 'development' },
      { id: '2', key: 'flag2', description: '', environment: 'staging' }
    ];
    await fetch('/api/featureFlags?env=development', { method: 'POST', body: JSON.stringify(flags) });

    render(<Dashboard />);
    const select = screen.getByTestId('environment-controls');
    fireEvent.change(select, { target: { value: 'staging' } });
    expect(screen.getByText('Staging')).toBeInTheDocument();
  });
});
