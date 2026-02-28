/**
 * Integration test that exercises the full generation pipeline.
 * It writes a temporary JSON file, runs the generator,
 * and verifies the output file contains expected sections.
 */
import { generateDocumentation } from '../index.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Integration: Documentation Generation', () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'api-doc-'));

  const apiConfig = {
    endpoints: [
      {
        method: 'GET',
        path: '/users',
        description: 'Get users',
        responses: [{ status: 200, description: 'OK', schema: {} }],
      },
      {
        method: 'POST',
        path: '/users',
        description: 'Create user',
        responses: [{ status: 201, description: 'Created', schema: {} }],
      },
    ],
  };

  const outputPath = path.join(tmpDir, 'API.md');

  beforeAll(async () => {
    // Simulate the generator writing to a file
    const docs = generateDocumentation(apiConfig);
    await fs.writeFile(outputPath, docs, 'utf8');
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('creates a markdown file with the correct header', async () => {
    const content = await fs.readFile(outputPath, 'utf8');
    expect(content).toMatch(/^# API Documentation/);
  });

  it('includes all endpoint paths', async () => {
    const content = await fs.readFile(outputPath, 'utf8');
    expect(content).toContain('/users');
  });

  it('includes HTTP methods in uppercase', async () => {
    const content = await fs.readFile(outputPath, 'utf8');
    expect(content).toContain('GET');
    expect(content).toContain('POST');
  });

  it('handles missing optional fields gracefully', async () => {
    const badConfig = {
      endpoints: [
        {
          method: 'GET',
          path: '/missing',
          // No description
          responses: [{ status: 404, description: 'Not Found', schema: {} }],
        },
      ],
    };
    const docs = generateDocumentation(badConfig);
    expect(docs).toContain('/missing');
    expect(docs).toContain('Not Found');
    // The generator should not crash or omit the endpoint entirely
  });
});
