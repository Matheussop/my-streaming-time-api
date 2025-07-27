import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My Streaming Time API',
      version: '1.3.0',
      description: 'API documentation for My Streaming Time',
    },
    servers: [
      {
        url: 'http://localhost:5000',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts', './src/server.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;
