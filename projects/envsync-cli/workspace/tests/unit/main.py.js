import { sync } from '../src/main';
import dotenv from 'dotenv';

beforeEach(() => {
    dotenv.config({ path: '.env.example' });
});

describe('sync function', () => {
    it('should sync local .env file with AWS Secret Manager correctly', async () => {
        const mockAWSClient = jest.fn();
        mockAWSClient.mockReturnValue({
            getSecretValue: jest.fn().mockResolvedValueOnce({ SecretString: 'test-secret' })
        });

        global.AWSClient = mockAWSClient;

        await sync('sample.env', 'aws');

        expect(global.AWSClient).toHaveBeenCalled();
        expect(global.AWSClient.mock.calls[0][0]).toBe('aws');
    });

    it('should sync local .env file with GCP Secret Manager correctly', async () => {
        const mockGCPClient = jest.fn();
        mockGCPClient.mockReturnValue({
            getSecret: jest.fn().mockResolvedValueOnce({ data: 'test-secret' })
        });

        global.GCPClient = mockGCPClient;

        await sync('sample.env', 'gcp');

        expect(global.GCPClient).toHaveBeenCalled();
        expect(global.GCPClient.mock.calls[0][0]).toBe('gcp');
    });

    it('should sync local .env file with Azure Key Vault correctly', async () => {
        const mockAZUREClient = jest.fn();
        mockAZUREClient.mockReturnValue({
            getSecret: jest.fn().mockResolvedValueOnce({ value: 'test-secret' })
        });

        global.AZUREClient = mockAZUREClient;

        await sync('sample.env', 'azure');

        expect(global.AZUREClient).toHaveBeenCalled();
        expect(global.AZUREClient.mock.calls[0][0]).toBe('azure');
    });

    it('should handle empty local .env file correctly', async () => {
        const mockAWSClient = jest.fn();
        mockAWSClient.mockReturnValue({
            getSecretValue: jest.fn()
        });

        global.AWSClient = mockAWSClient;

        await sync('empty.env', 'aws');

        expect(global.AWSClient).toHaveBeenCalled();
    });

    it('should handle null local .env file correctly', async () => {
        const mockAWSClient = jest.fn();
        mockAWSClient.mockReturnValue({
            getSecretValue: jest.fn()
        });

        global.AWSClient = mockAWSClient;

        await sync(null, 'aws');

        expect(global.AWSClient).toHaveBeenCalled();
    });

    it('should handle massive data correctly', async () => {
        const mockAWSClient = jest.fn();
        mockAWSClient.mockReturnValue({
            getSecretValue: jest.fn().mockResolvedValueOnce({ SecretString: new Array(100000).fill('a').join('') })
        });

        global.AWSClient = mockAWSClient;

        await sync('large.env', 'aws');

        expect(global.AWSClient).toHaveBeenCalled();
    });

    it('should handle special characters correctly', async () => {
        const mockAWSClient = jest.fn();
        mockAWSClient.mockReturnValue({
            getSecretValue: jest.fn().mockResolvedValueOnce({ SecretString: '$pecial!@#%^&*()' })
        });

        global.AWSClient = mockAWSClient;

        await sync('special.env', 'aws');

        expect(global.AWSClient).toHaveBeenCalled();
    });
});
