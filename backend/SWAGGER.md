# API Documentation with Swagger

This backend API uses Swagger/OpenAPI 3.0 for comprehensive API documentation.

## Accessing the Documentation

Once the server is running, you can access the interactive API documentation at:

- **Swagger UI**: `http://localhost:3001/api-docs`
- **OpenAPI JSON Spec**: `http://localhost:3001/api-docs.json`

## Features

### Interactive Documentation
- **Try it out**: Test API endpoints directly from the browser
- **Authentication**: Use the "Authorize" button to add your JWT token
- **Request/Response Examples**: See sample requests and responses for each endpoint
- **Schema Definitions**: View detailed data models and validation rules

### Available Endpoints

#### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT tokens
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user profile (requires authentication)
- `PUT /api/auth/me` - Update user profile (requires authentication)

#### Health Check
- `GET /health` - Check API health status

## Using Authentication

For protected endpoints:

1. First, login or register to get your JWT token
2. Click the "Authorize" button at the top of the Swagger UI
3. Enter your token in the format: `Bearer <your-token-here>`
4. Click "Authorize" and then "Close"
5. Now you can test protected endpoints

## For Frontend Developers

### Using the OpenAPI Spec

You can use the OpenAPI specification to auto-generate API clients for your frontend:

#### Option 1: Direct JSON Import
```typescript
// Download the spec
const spec = await fetch('http://localhost:3001/api-docs.json').then(r => r.json());
```

#### Option 2: Generate TypeScript Client
Use tools like `openapi-typescript` or `swagger-typescript-api`:

```bash
# Install generator
npm install -g swagger-typescript-api

# Generate TypeScript client
swagger-typescript-api -p http://localhost:3001/api-docs.json -o ./src/api -n api-client.ts
```

#### Option 3: Use with React Query/SWR
```typescript
import { useQuery } from '@tanstack/react-query';

// Auto-complete and type safety based on Swagger spec
const { data } = useQuery({
  queryKey: ['profile'],
  queryFn: async () => {
    const response = await fetch('http://localhost:3001/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  }
});
```

### Example API Calls

#### Register
```typescript
const response = await fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe'
  })
});

const { user, token, refreshToken } = await response.json();
```

#### Login
```typescript
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!'
  })
});

const { user, token, refreshToken } = await response.json();
```

#### Get Profile (Protected)
```typescript
const response = await fetch('http://localhost:3001/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const user = await response.json();
```

## Adding Documentation to New Endpoints

When creating new routes, add Swagger documentation using JSDoc comments:

```typescript
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get('/products', getProducts);
```

## Configuration

Swagger configuration is located in `/src/config/swagger.ts`. You can customize:

- API information (title, description, version)
- Server URLs
- Security schemes
- Common schemas
- Tags and grouping

## Best Practices

1. **Always document new endpoints** - Add Swagger comments when creating routes
2. **Use schema references** - Reference common schemas from `#/components/schemas`
3. **Include examples** - Add example values for better developer experience
4. **Document errors** - Include all possible error responses
5. **Keep it updated** - Update documentation when changing endpoints

## Troubleshooting

### Documentation not showing up
- Make sure your route files are included in `swagger.ts` `apis` array
- Check that JSDoc comments follow the correct format
- Restart the dev server after adding new documentation

### Schema not found
- Ensure the schema is defined in `/src/config/swagger.ts` under `components.schemas`
- Use the correct reference format: `$ref: '#/components/schemas/SchemaName'`

## Additional Resources

- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [swagger-ui-express Documentation](https://github.com/scottie1984/swagger-ui-express)
