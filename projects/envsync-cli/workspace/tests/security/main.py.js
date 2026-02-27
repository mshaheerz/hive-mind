import { sync } from '../src/main';

describe('Security Tests', () => {
    it('should handle secure storage and retrieval of secrets', async () => {
        const mockAWSClient = jest.fn();
        mockAWSClient.mockReturnValue({
            getSecretValue: jest.fn().mockResolvedValueOnce({ SecretString: 'secure-secret' })
        });

        global.AWSClient = mockAWSClient;

        await sync('sample.env', 'aws');
    });
});
