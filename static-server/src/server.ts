import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app: Express = express();

// Configuration
const PORT = parseInt(process.env.STATIC_PORT || '3003', 10);
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
const CORS_ORIGINS = process.env.STATIC_CORS_ORIGINS?.split(',').map(o => o.trim()) || ['*'];
const RATE_LIMIT = parseInt(process.env.STATIC_RATE_LIMIT || '2000', 10);
const CACHE_MAX_AGE = parseInt(process.env.STATIC_CACHE_MAX_AGE || '31536000', 10);

// Resolve absolute path for uploads directory
const uploadsPath = path.isAbsolute(UPLOAD_DIR) ? UPLOAD_DIR : path.join(__dirname, '..', UPLOAD_DIR);

// Ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
    console.error(`❌ Uploads directory not found: ${uploadsPath}`);
    console.error('Please ensure UPLOAD_DIR is set correctly in your .env file');
    process.exit(1);
}

console.log(`📁 Serving files from: ${uploadsPath}`);

// Security headers with Helmet
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Disable CSP for static files
}));

// CORS configuration
const corsOptions: cors.CorsOptions = {
    origin: CORS_ORIGINS.includes('*') ? '*' : CORS_ORIGINS,
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Range', 'Accept-Encoding'],
    exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges', 'ETag', 'Last-Modified'],
    credentials: false,
    maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));

// Compression for text-based files
app.use(compression({
    filter: (req: Request, res: Response) => {
        // Don't compress already compressed formats
        const contentType = res.getHeader('Content-Type') as string;
        if (contentType) {
            const skipTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/', 'audio/'];
            if (skipTypes.some(type => contentType.includes(type))) {
                return false;
            }
        }
        return compression.filter(req, res);
    },
    level: 6, // Balanced compression level
}));

// Logging
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: RATE_LIMIT,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uploadsDir: uploadsPath,
    });
});

// Custom middleware to set caching and security headers for static files
const staticMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Set cache headers
    res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}, immutable`);

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // Force download for potentially dangerous file types
    const ext = path.extname(req.path).toLowerCase();
    const forceDownload = ['.exe', '.sh', '.bat', '.cmd', '.ps1', '.php', '.js', '.html', '.htm'];
    if (forceDownload.includes(ext)) {
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(req.path)}"`);
    }

    next();
};

// Serve static files
app.use('/', staticMiddleware, express.static(uploadsPath, {
    dotfiles: 'deny', // Deny access to dotfiles
    etag: true, // Enable ETag for caching
    lastModified: true, // Enable Last-Modified header
    maxAge: CACHE_MAX_AGE * 1000, // Convert seconds to milliseconds
    index: false, // Disable directory indexing
    redirect: false, // Don't redirect directories
    setHeaders: (res: Response, filePath: string) => {
        // Set Content-Type based on file extension
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes: Record<string, string> = {
            '.webp': 'image/webp',
            '.avif': 'image/avif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff2': 'font/woff2',
            '.woff': 'font/woff',
        };
        if (mimeTypes[ext]) {
            res.setHeader('Content-Type', mimeTypes[ext]);
        }
    },
}));

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: `File not found: ${req.path}`,
    });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Static file server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔒 CORS origins: ${CORS_ORIGINS.join(', ')}`);
    console.log(`⏱️  Rate limit: ${RATE_LIMIT} requests/minute`);
    console.log(`💾 Cache max-age: ${CACHE_MAX_AGE} seconds`);
});

export default app;
