# Infi-Commerce Backend API

Express.js REST API for multi-store ecommerce platform with MongoDB.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp env.example .env
```

3. Configure `.env` file with your MongoDB connection and other credentials

4. Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile

### Health Check
- `GET /health` - Server health status

## Project Structure

```
src/
├── config/           # Configuration files
├── models/           # MongoDB models
├── controllers/      # Request handlers
├── routes/           # API routes
├── middleware/       # Custom middleware
├── services/         # Business logic
├── utils/            # Helper functions
└── server.ts         # Entry point
```

## Features

- JWT authentication
- Role-based authorization
- MongoDB with Mongoose ODM
- Input validation
- Error handling
- Security headers (Helmet)
- CORS support
- Request compression
- Logging (Morgan)
