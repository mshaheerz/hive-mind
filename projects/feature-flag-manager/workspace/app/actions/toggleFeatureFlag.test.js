import { toggleFeatureFlag } from '@/app/actions/toggleFeatureFlag';

test('toggles the enabled state of a flag', async () => {
  const flags = [
    { id: '1', key: 'flag1', description: '', environment: 'development' }
  ];
  expect(await toggleFeatureFlag(flags[0].id)).toEqual({
    ...flags[0],
    enabled: true,
    version: 2
  });
  expect(await toggleFeatureFlag(flags[0].id)).toEqual({
    ...flags[0],
    enabled: false,
    version: 3
  });
});

test('throws an error if the flag is not found', async () => {
  expect(() => toggleFeatureFlag('non-existing-id')).toThrow("Feature flag not found");
});
