import { ConfigParser } from '../src/main';
import dotenv from 'dotenv';

beforeEach(() => {
    dotenv.config({ path: '.env.example' });
});

describe('ConfigParser', () => {
    it('should parse local .env file correctly', () => {
        const config_parser = new ConfigParser();
        const parsed_config = config_parser.parse_config('sample.env');
        expect(parsed_config.AWS_ACCESS_KEY_ID).toBe(process.env.AWS_ACCESS_KEY_ID);
        expect(parsed_config.AWS_SECRET_ACCESS_KEY).toBe(process.env.AWS_SECRET_ACCESS_KEY);
    });

    it('should handle empty .env file correctly', () => {
        const config_parser = new ConfigParser();
        const parsed_config = config_parser.parse_config('empty.env');
        expect(parsed_config).toEqual({});
    });

    it('should handle null .env file correctly', () => {
        const config_parser = new ConfigParser();
        const parsed_config = config_parser.parse_config(null);
        expect(parsed_config).toEqual({});
    });
});
