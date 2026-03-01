const request = require('supertest');
const { app } = require('../../app'); // Adjust the import path as necessary

describe('Routes Index', () => {
  it('should respond with a welcome message on GET /', (done) => {
    request(app)
      .get('/')
      .expect(200, "Welcome to DevEnvSetupWizard", done);
  });
});
