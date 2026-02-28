const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'Generated API documentation for complex systems'
    }
  },
  apis: ['./src/routes/*.js'] // Adjust the path to your API route files
};

const swaggerSpec = swaggerJSDoc(options);

function generateApiDoc() {
  return swaggerSpec;
}

module.exports = { generateApiDoc };
