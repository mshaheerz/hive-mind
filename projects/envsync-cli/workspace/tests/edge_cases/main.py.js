import { sync } from '../src/main';

describe('Edge Cases', () => {
    it('should handle missing arguments correctly', async () => {
        try {
            await sync();
            expect.fail('Expected error');
        } catch (error) {
            expect(error.message).toBe('Missing argument: --local-file');
        }
    });

    it('should handle non-existent local .env file correctly', async () => {
        const mockAWSClient = jest.fn();
        mockAWSClient.mockReturnValue({
            getSecretValue: jest.fn()
        });

        global.AWSClient = mockAWSClient;

        await sync('nonexistent.env', 'aws');

        expect(global.AWSClient).toHaveBeenCalled();
    });

    it('should handle invalid cloud provider correctly', async () => {
        try {
            await sync('sample.env', 'invalid-provider');
            expect.fail('Expected error');
        } catch (error) {
            expect(error.message).toBe("Unsupported cloud provider");
        }
    });
});
