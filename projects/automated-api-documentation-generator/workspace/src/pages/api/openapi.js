/**
 * @fileoverview API route that returns the generated OpenAPI specification.
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Absolute path to the generated OpenAPI JSON file.
 */
const SPEC_PATH = path.join(process.cwd(), 'src', 'api', 'api_data.json');

/**
 * GET handler for /api/openapi.
 *
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
export default async function handler(req, res) {
  try {
    const data = await fs.readFile(SPEC_PATH, 'utf-8');
    const json = JSON.parse(data);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(json);
  } catch (err) {
    console.error('Failed to read OpenAPI spec:', err);
    res.status(500).json({ error: 'Unable to load API documentation.' });
  }
}
