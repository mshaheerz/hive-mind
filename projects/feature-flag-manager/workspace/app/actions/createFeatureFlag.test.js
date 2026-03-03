import { createFeatureFlag } from '@/app/actions/createFeatureFlag';

test('creates a new feature flag with valid input', async () => {
  const flags = [];
  expect(await createFeatureFlag({ key: 'flag1', description: 'Description', environment: 'development' })).toEqual({
    id: expect.any(String),
    key: 'flag1',
    description: 'Description',
    environment: 'development',
    enabled: false,
    version: 1,
    createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{3}\.\d+Z$/),
    updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{3}\.\d+Z$/)
  });
});
