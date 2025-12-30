import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { config } from './config';
import { connectDatabase } from './config/database';
import { swaggerSpec } from './config/swagger';
import apiRoutes from './routes';
import { registerEventHandlers } from './events/handlers';

const app: Express = express();

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resource loading
})); // Security headers
app.use(compression()); // Compress responses
app.use(morgan(config.env === 'development' ? 'dev' : 'combined')); // Logging

// CORS configuration
app.use(
    cors({
        // origin: [config.cors.frontendUrl, config.cors.adminUrl],
        origin: "*",
        credentials: true,
    })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/health', (res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.env,
    });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     description: Returns the health status of the API
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 */

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Infi-Commerce API Documentation',
}));

// Swagger JSON spec
app.get('/api-docs.json', (res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Mount API routes
app.use('/api', apiRoutes);
// API routes will be added here
// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
    });
});

// Error handler - Must have 4 parameters for Express to recognize it as error handler
app.use((err: any, _req: Request, res: Response, _next: Function) => {
    console.error('Error:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: config.env === 'development' ? err.name : 'Error',
        message,
        ...(config.env === 'development' && { stack: err.stack }),
    });
});

// Start server
const startServer = async () => {
    try {
        // Register event handlers
        registerEventHandlers();

        // Connect to database
        await connectDatabase();

        // Start listening
        app.listen(config.port, () => {
            console.log(`🚀 Server running on port ${config.port}`);
            console.log(`📍 Environment: ${config.env}`);
            console.log(`🔗 API URL: ${config.apiUrl}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
