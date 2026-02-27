import { TestUsageAnalysis, findUnusedDependencies } from './index';

test('Identify Unused Imports', async () => {
  const testCode = `
    import 'lodash';
    console.log(_.identity);
  `;
  expect(findUnusedDependencies(testCode)).toBe(new Map());
});

test('Test Usage Analysis Integration', async () => {
  const unusedImports: Map<string, any> = new Map();
  unusedImports.set('lodash', {
    id: 'lodash',
    name: 'lodash',
    version: '4.17.21'
  });

  expect(findUnusedDependencies('import lodash from "lodash";')).toEqual(new Set());
});
