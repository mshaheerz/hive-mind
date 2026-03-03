import { render, screen } from '@testing-library/react';
import EnvironmentControls from '@/app/components/EnvironmentControls';

test('renders environment controls with default value', () => {
  render(<EnvironmentControls />);
  expect(screen.getByText('Environment:')).toBeInTheDocument();
  const select = screen.getByRole('combobox');
  expect(select).toHaveValue('development');
});

test('changes environment when selected', async () => {
  render(<EnvironmentControls onChange={(env) => {}} />);
  const select = screen.getByTestId('environment-controls');
  fireEvent.change(select, { target: { value: 'staging' } });
  expect(screen.getByText('Staging')).toBeInTheDocument();
});
