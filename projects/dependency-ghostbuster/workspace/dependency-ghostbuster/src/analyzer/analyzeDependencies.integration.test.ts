import { expect, describe } from '@jest/globals';
import { analyzeDependencies } from './analyzeDependencies';

describe('analyzeDependencies', () => {
    it('should correctly identify unused dependencies', async () => {
        const mockModuleCode = `
            import 'dependency-ghostbuster'; // Assuming dependency-ghostbuster is used
        `;
        expect(analyzeDependencies(mockModuleCode)).toBe('');
    });
});
