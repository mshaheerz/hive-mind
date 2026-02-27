import { syncLocalToCloud, syncCloudToLocal } from '../../src/sync/syncer';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SecretClient, SecretProperties, SecretPropertiesWithVersion } from '@azure/keyvault-secrets';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { parseEnvFile } from '../../src/utils/envParser';

/**
 * Mocking external SDKs to isolate logic
 * 1. AWS SDK client
 * 2. Azure SecretClient
 * 3. GCP SecretManagerServiceClient
 */

const mockAWSClient = vi.fn(() => ({
  send: vi.fn(),
}));
const mockAzureClient = vi.fn(() => ({
  getSecret: vi.fn(),
  setSecret: vi.fn(),
}));
const mockGCPClient = vi.fn(() => ({
  accessSecretVersion: vi.fn(),
  createSecret: vi.fn(),
  addSecretVersion: vi.fn(),
}));

// Replace actual imports with mocks
vi.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: mockAWSClient,
  GetSecretValueCommand: vi.fn(),
  PutSecretValueCommand: vi.fn(),
}));
vi.mock('@azure/keyvault-secrets', () => ({
  SecretClient: mockAzureClient,
}));
vi.mock('@google-cloud/secret-manager', () => ({
  SecretManagerServiceClient: mockGCPClient,
}));

// Helper: fake env content
const envContent = `
  API_KEY=12345
  DB_PASS=secret
`;
const envMap = parseEnvFile(envContent);

describe('syncer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pushes local env to AWS Secrets Manager', async () => {
    const awsSend = mockAWSClient().send;
    awsSend.mockResolvedValueOnce({}); // PutSecretValue
    await syncLocalToCloud({ provider: 'aws', env: envMap, secretName: 'myapp' });

    expect(awsSend).toHaveBeenCalledTimes(2);
    const calls = awsSend.mock.calls.map(c => c[0].input);
    expect(calls).toEqual(
      expect.arrayContaining([
        { SecretId: 'myapp', SecretString: JSON.stringify(envMap) },
      ])
    );
  });

  it('pulls secrets from Azure to local env', async () => {
    const azureGet = mockAzureClient().getSecret;
    azureGet.mockResolvedValueOnce({ value: '12345' });
    azureGet.mockResolvedValueOnce({ value: 'secret' });

    const result = await syncCloudToLocal({ provider: 'azure', secretName: 'myapp' });

    expect(azureGet).toHaveBeenCalledTimes(2);
    expect(result).toEqual(envMap);
  });

  it('handles GCP secret access errors gracefully', async () => {
    const gcpAccess = mockGCPClient().accessSecretVersion;
    gcpAccess.mockRejectedValueOnce(new Error('Not Found'));

    await expect(
      syncCloudToLocal({ provider: 'gcp', secretName: 'myapp' })
    ).rejects.toThrow('Not Found');
  });

  it('ignores empty keys during sync', async () => {
    const envWithEmpty = { EMPTY: '', VALID: 'ok' };
    const awsSend = mockAWSClient().send;
    awsSend.mockResolvedValueOnce({});

    await syncLocalToCloud({ provider: 'aws', env: envWithEmpty, secretName: 'app' });

    const calls = awsSend.mock.calls.map(c => c[0].input);
    // Expect only VALID to be sent
    expect(calls[0].SecretString).toContain('"VALID":"ok"');
    expect(calls[0].SecretString).not.toContain('"EMPTY":"');
  });
});
