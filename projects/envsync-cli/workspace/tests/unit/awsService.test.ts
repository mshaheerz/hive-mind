import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { syncLocalToCloud, syncCloudToLocal } from '../src/services/awsSecretManager';
import { SecretsManagerClient, PutSecretValueCommand, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import fs from 'fs';
import path from 'path';

vi.mock('@aws-sdk/client-secrets-manager', async () => {
  const actual = await vi.importActual('@aws-sdk/client-secrets-manager');
  return {
    ...actual,
    SecretsManagerClient: vi.fn().mockImplementation(() => ({
      send: vi.fn(),
    })),
  };
});

describe('AWS Secret Manager integration', () => {
  const clientMock = new SecretsManagerClient({ region: 'us-east-1' }) as any;

  beforeAll(() => {
    // @ts-ignore
    vi.spyOn(SecretsManagerClient.prototype, 'send').mockImplementation(clientMock.send);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('uploads local env to AWS', async () => {
    const env = { FOO: 'bar', BAZ: 'qux' };
    clientMock.send.mockResolvedValueOnce({}); // PutSecretValue

    await syncLocalToCloud(env, 'myapp-secrets');

    expect(clientMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Name: 'myapp-secrets',
          SecretString: JSON.stringify(env),
        }),
      })
    );
  });

  it('downloads env from AWS', async () => {
    const secretJson = JSON.stringify({ FOO: 'bar', BAZ: 'qux' });
    clientMock.send.mockResolvedValueOnce({
      SecretString: secretJson,
    });

    const env = await syncCloudToLocal('myapp-secrets');

    expect(env).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('handles missing secret gracefully', async () => {
    clientMock.send.mockRejectedValueOnce({
      name: 'ResourceNotFoundException',
      message: 'Secret not found',
    });

    await expect(syncCloudToLocal('missing-secret')).rejects.toThrow(/Secret not found/);
  });

  it('fails on network error', async () => {
    clientMock.send.mockRejectedValueOnce(new Error('ECONNRESET'));
    await expect(syncCloudToLocal('any-secret')).rejects.toThrow(/ECONNRESET/);
  });
});
