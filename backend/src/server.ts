import dotenv from 'dotenv';
dotenv.config();

import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0,
    });
}

import express, { Express, Request, Response, RequestHandler } from 'express';
import { createServer } from 'http';

import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { connectDatabase } from './config/database';
import { swaggerSpec } from './config/swagger';
import apiRoutes from './routes';
import { registerEventHandlers } from './events/handlers';
import { channelMiddleware } from './middleware/channel.middleware';
import { optionalApiKeyAuth } from './middleware/apiKeyAuth';
import { globalApiLimiter } from './middleware/rateLimit';
import { socketService } from './services/socket.service';
import cacheService from './services/cache.service';

const app: Express = express();
const httpServer = createServer(app);

// Trust Proxy (Required for correct IP detection behind Nginx/ALB)
// This enables secure use of rate limiting and IP based middlewares
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resource loading
})); // Security headers
app.use(compression() as unknown as RequestHandler); // Compress responses
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

// NOTE: Static files are now served by the dedicated static-server on port 3003
// See /static-server/README.md for setup instructions

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    const cacheStats = cacheService.getStats();
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.env,
        cache: {
            backend: cacheStats.backend,
            memcached: {
                enabled: cacheStats.memcached.enabled,
                connected: cacheStats.memcached.connected,
            },
            redis: {
                enabled: cacheStats.redis.enabled,
                connected: cacheStats.redis.connected,
            },
            memoryFallbackSize: cacheStats.memory.size,
        },
    });
});

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: Server health and status endpoints
 *
 * /health:
 *   get:
 *     summary: Server health check
 *     tags: [Health]
 *     description: Returns the health status of the API server. Used by load balancers, container orchestration (Kubernetes), and monitoring tools.
 *     responses:
 *       200:
 *         description: Server is healthy and running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                   description: Health status indicator
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-01-03T12:00:00.000Z"
 *                   description: Current server timestamp
 *                 environment:
 *                   type: string
 *                   enum: [development, staging, production]
 *                   example: development
 *                   description: Current running environment
 */

// Swagger documentation (only in non-production)
if (config.env !== 'production') {
    app.use('/api-docs', swaggerUi.serve as unknown as RequestHandler[], swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Infi-Commerce API Documentation',
    }) as unknown as RequestHandler);

    // Swagger JSON spec
    app.get('/api-docs.json', (_req: Request, res: Response) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
}

// Global API key authentication middleware - validates key if provided, allows if not

// Apply Global Rate Limiting
app.use('/api', globalApiLimiter);

app.use('/api', optionalApiKeyAuth);

// Global Channel Middleware
app.use('/api', channelMiddleware);

// Mount API routes
app.use('/api', apiRoutes);
// API routes will be added here


// Sentry error handler (must be registered before any other error middleware)
if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
}

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

        // Initialize Socket.IO
        socketService.initialize(httpServer);

        // Start listening
        httpServer.listen(config.port, () => {
            console.log(`Server running on port ${config.port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
