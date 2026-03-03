import { render, screen } from '@testing-library/react';
import FeatureFlagList from '@/app/components/FeatureFlagList';

test('renders feature flag list with no flags', () => {
  render(<FeatureFlagList initialFlags={[]} environment="development" />);
});

test('renders feature flag list with multiple flags', async () => {
  render(
    <FeatureFlagList
      initialFlags={[
        { id: '1', key: 'flag1', description: '', environment: 'development' },
        { id: '2', key: 'flag2', description: '', environment: 'development' }
      ]}
      environment="development"
    />
  );
});
