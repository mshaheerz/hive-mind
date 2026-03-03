import { getFeatureFlags } from '@/app/actions/getFeatureFlags';

test('returns all flags when no environment is provided', async () => {
  const flags = [
    { id: '1', key: 'flag1', description: '', environment: 'development' },
    { id: '2', key: 'flag2', description: '', environment: 'development' }
  ];
  jest.spyOn(global.console, 'warn').mockImplementation(() => {});
  expect(await getFeatureFlags()).toEqual(flags);
});

test('returns flags for a given environment', async () => {
  const developmentFlags = [
    { id: '1', key: 'flag1', description: '', environment: 'development' },
    { id: '2', key: 'flag2', description: '', environment: 'development' }
  ];
  jest.spyOn(global.console, 'warn').mockImplementation(() => {});
  expect(await getFeatureFlags('development')).toEqual(developmentFlags);
});
