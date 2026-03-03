// Test file for API endpoints related to feature flags

import fetch from 'node-fetch';

describe('API Endpoint /api/featureFlags', () => {
  describe('GET request', () => {
    it('returns an empty array if no flags exist', async () => {
      const response = await fetch('/api/featureFlags');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([]);
    });

    it('returns the correct list of flags for a given environment', async () => {
      const flags = [
        { id: '1', key: 'flag1', description: '', environment: 'development' },
        { id: '2', key: 'flag2', description: '', environment: 'staging' }
      ];
      await fetch('/api/featureFlags?env=development', { method: 'POST', body: JSON.stringify(flags) });

      const response = await fetch('/api/featureFlags?env=development');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(flags.filter(f => f.environment === 'development'));
    });
  });
});
