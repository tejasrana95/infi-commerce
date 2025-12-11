# Infi-Commerce Backend API

Express.js REST API for multi-store ecommerce platform with MongoDB.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure `.env` file with your MongoDB connection and other credentials

4. Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Documentation

This API uses **Swagger/OpenAPI 3.0** for comprehensive interactive documentation.

### Accessing Documentation

Once the server is running, visit:

- **Swagger UI**: [http://localhost:3001/api-docs](http://localhost:3001/api-docs)
- **OpenAPI JSON Spec**: [http://localhost:3001/api-docs.json](http://localhost:3001/api-docs.json)

The Swagger UI provides:
- Interactive API testing
- Request/response examples
- Schema definitions
- Authentication testing with JWT tokens

📖 **For detailed documentation guide, see [SWAGGER.md](./SWAGGER.md)**

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user profile (requires authentication)
- `PUT /api/auth/me` - Update user profile (requires authentication)

### Health Check
- `GET /health` - Server health status

## Project Structure

```
src/
├── config/           # Configuration files (including Swagger)
├── models/           # MongoDB models
├── controllers/      # Request handlers
├── routes/           # API routes
├── middleware/       # Custom middleware
├── services/         # Business logic
├── utils/            # Helper functions
└── server.ts         # Entry point
```

## Features

- **API Documentation** - Swagger/OpenAPI 3.0 with interactive UI
- **JWT Authentication** - Secure token-based authentication
- **Role-based Authorization** - Customer, Admin, Vendor roles
- **MongoDB with Mongoose ODM** - Robust data modeling
- **Input Validation** - Request validation with express-validator
- **Error Handling** - Centralized error handling
- **Security Headers** - Helmet for security best practices
- **CORS Support** - Configured for frontend and admin apps
- **Request Compression** - Gzip compression for responses
- **Logging** - Morgan for HTTP request logging

## Development

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

### Testing
```bash
npm test
```

## Environment Variables

See `.env.example` for all available configuration options including:
- Server configuration (PORT, API_URL)
- Database (MONGODB_URI)
- JWT secrets
- Payment gateways (Stripe, Razorpay, PayPal)
- AWS S3 for file uploads
- SMTP for emails
- Exchange rate API

## Notes

- Default port is **3001** (changed from 5000 to avoid conflicts with macOS ControlCenter)
- MongoDB connection string should be configured in `.env`
- All authentication endpoints are documented in Swagger UI
- Protected endpoints require Bearer token in Authorization header
