const request = require('supertest');
const { app } = require('../../src/web_server/app'); // Adjust the import path as necessary

describe('Integration Tests for API', () => {
  it('should handle GET /api correctly', (done) => {
    request(app)
      .get('/api')
      .expect(200, 'API route works!', done);
  });
});
