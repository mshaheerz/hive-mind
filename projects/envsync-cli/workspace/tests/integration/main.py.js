import { sync } from '../src/main';

describe('Integration Tests', () => {
    it('should handle successful sync between local and AWS Secret Manager', async () => {
        const mockAWSClient = jest.fn();
        mockAWSClient.mockReturnValue({
            getSecretValue: jest.fn().mockResolvedValueOnce({ SecretString: 'test-secret' }),
            putSecretValue: jest.fn().mockResolvedValueOnce({})
        });

        global.AWSClient = mockAWSClient;

        await sync('sample.env', 'aws');

        expect(global.AWSClient).toHaveBeenCalledTimes(2);
    });

    it('should handle successful sync between local and GCP Secret Manager', async () => {
        const mockGCPClient = jest.fn();
        mockGCPClient.mockReturnValue({
            getSecret: jest.fn().mockResolvedValueOnce({ data: 'test-secret' }),
            createSecret: jest.fn().mockResolvedValueOnce({})
        });

        global.GCPClient = mockGCPClient;

        await sync('sample.env', 'gcp');

        expect(global.GCPClient).toHaveBeenCalledTimes(2);
    });

    it('should handle successful sync between local and Azure Key Vault', async () => {
        const mockAZUREClient = jest.fn();
        mockAZUREClient.mockReturnValue({
            getSecret: jest.fn().mockResolvedValueOnce({ value: 'test-secret' }),
            setSecret: jest.fn().mockResolvedValueOnce({})
        });

        global.AZUREClient = mockAZUREClient;

        await sync('sample.env', 'azure');

        expect(global.AZUREClient).toHaveBeenCalledTimes(2);
    });
});
