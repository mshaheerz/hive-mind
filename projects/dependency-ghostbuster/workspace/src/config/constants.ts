/**
 * @fileoverview Global constants used across the project.
 *
 * These constants can be overridden by environment variables or a
 * configuration file in the future if needed.
 */

export const PACKAGE_JSON_GLOB = '**/package.json';
export const NODE_MODULES_IGNORE = '!**/node_modules/**';

export const SOURCE_GLOB = '**/*.{js,jsx,ts,tsx}';
export const DEFAULT_IGNORE_PATTERNS = [
  '!**/node_modules/**',
  '!**/dist/**',
  '!**/build/**',
  '!**/coverage/**',
  '!**/tmp/**',
  '!**/generated/**'
];

export const TEST_FILE_REGEX = /\.(test|spec)\.[jt]sx?$/i;
export const TESTS_DIR_NAME = '__tests__';
