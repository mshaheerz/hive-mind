/**
 * @fileoverview Integration test for the /api/openapi endpoint.
 */

const request = require('supertest');
const next = require('next');

let server;
let app;

beforeAll(async () => {
  const dev = process.env.NODE_ENV !== 'production';
  app = next({ dev });
  await app.prepare();
  const handle = app.getRequestHandler();

  // Create a minimal server that forwards to Next.js handler
  const express = require('express');
  const expressApp = express();
  expressApp.all('*', (req, res) => handle(req, res));
  server = expressApp.listen(0); // random open port
});

afterAll(() => {
  server.close();
});

test('GET /api/openapi returns JSON spec', async () => {
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const response = await request(baseUrl).get('/api/openapi');
  expect(response.status).toBe(200);
  expect(response.headers['content-type']).toMatch(/application\/json/);
  expect(response.body).toHaveProperty('openapi');
  expect(response.body).toHaveProperty('info');
  expect(response.body).toHaveProperty('paths');
});
