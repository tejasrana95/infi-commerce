# Static File Server

Dedicated static file server for serving uploaded files independently from the main backend API.

## Features

- 🚀 **Lightweight** - Minimal Express server optimized for file serving
- 🔒 **Security Headers** - Helmet with X-Content-Type-Options, X-Frame-Options
- 📦 **Compression** - Gzip compression for text-based files
- 💾 **Caching** - Aggressive caching with ETag support
- 🌐 **CORS** - Configurable cross-origin resource sharing
- ⏱️ **Rate Limiting** - Prevent abuse with request limits
- 🛡️ **Safe Downloads** - Force download for potentially dangerous files

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `STATIC_PORT` | `3003` | Server port |
| `UPLOAD_DIR` | `../uploads` | Path to uploads directory |
| `STATIC_CORS_ORIGINS` | `*` | Comma-separated allowed origins |
| `STATIC_RATE_LIMIT` | `2000` | Max requests per minute per IP |
| `STATIC_CACHE_MAX_AGE` | `31536000` | Cache max-age in seconds |

## Endpoints

- `GET /health` - Health check
- `GET /{path}` - Serve files from uploads directory

## Production

```bash
# Build
npm run build

# Start production server
npm start
```

For production, use Nginx as a reverse proxy. See `/docs/nginx-static-server.conf`.
