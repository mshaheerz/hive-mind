// Test file for featureFlags utility functions

import { readFlags, writeFlags, createFlag } from '@/utils/featureFlags';

describe('readFlags', () => {
  it('returns an empty array if no flags exist', async () => {
    const result = await readFlags();
    expect(result).toEqual([]);
  });

  it('returns the correct list of flags for a given environment', async () => {
    const flags = [
      { id: '1', key: 'flag1', description: '', environment: 'development' },
      { id: '2', key: 'flag2', description: '', environment: 'staging' }
    ];
    await writeFlags(flags);
    const result = await readFlags('development');
    expect(result).toEqual(flags.filter(f => f.environment === 'development'));
  });
});

describe('writeFlags', () => {
  it('writes the correct list of flags to storage', async () => {
    const flags = [
      { id: '1', key: 'flag1', description: '', environment: 'development' },
      { id: '2', key: 'flag2', description: '', environment: 'staging' }
    ];
    await writeFlags(flags);
    expect(readFlags()).toEqual(flags);
  });
});

describe('createFlag', () => {
  it('creates a new flag with unique key and environment', async () => {
    const flags = [
      { id: '1', key: 'flag1', description: '', environment: 'development' }
    ];
    await writeFlags(flags);

    const newFlag = createFlag({ key: 'flag2', description: '', environment: 'development' });
    expect(newFlag).toEqual({
      id: 2,
      key: 'flag2',
      description: '',
      environment: 'development'
    });

    expect(readFlags()).toEqual([
      { id: 1, key: 'flag1', description: '', environment: 'development' },
      { id: 2, key: 'flag2', description: '', environment: 'development' }
    ]);
  });
});
