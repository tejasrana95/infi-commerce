import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config';
import { connectDatabase } from './config/database';
import apiRoutes from './routes';

const app: Express = express();

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(morgan(config.env === 'development' ? 'dev' : 'combined')); // Logging

// CORS configuration
app.use(
    cors({
        origin: [config.cors.frontendUrl, config.cors.adminUrl],
        credentials: true,
    })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.env,
    });
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

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
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
