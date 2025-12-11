import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Infi-Commerce API',
        version: '1.0.0',
        description: 'Multi-store ecommerce platform API with comprehensive features including international shipping, multi-currency support, and digital products',
        contact: {
            name: 'API Support',
            email: 'support@infi-commerce.com',
        },
        license: {
            name: 'ISC',
            url: 'https://opensource.org/licenses/ISC',
        },
    },
    servers: [
        {
            url: config.apiUrl,
            description: `${config.env.charAt(0).toUpperCase() + config.env.slice(1)} server`,
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter your JWT token in the format: Bearer <token>',
            },
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    error: {
                        type: 'string',
                        description: 'Error type',
                    },
                    message: {
                        type: 'string',
                        description: 'Error message',
                    },
                    stack: {
                        type: 'string',
                        description: 'Error stack trace (development only)',
                    },
                },
            },
            User: {
                type: 'object',
                description: 'Admin user account (for admin, store_admin, super_admin)',
                properties: {
                    _id: {
                        type: 'string',
                        description: 'User ID',
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Admin email address',
                    },
                    firstName: {
                        type: 'string',
                        description: 'Admin first name',
                    },
                    lastName: {
                        type: 'string',
                        description: 'Admin last name',
                    },
                    role: {
                        type: 'string',
                        enum: ['admin', 'store_admin', 'super_admin'],
                        description: 'Admin role',
                    },
                    storeId: {
                        type: 'string',
                        description: 'Store ID (for store_admin)',
                    },
                    permissions: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                        description: 'Granular permissions',
                    },
                    isActive: {
                        type: 'boolean',
                        description: 'Whether the account is active',
                    },
                    emailVerified: {
                        type: 'boolean',
                        description: 'Whether email is verified',
                    },
                    lastLogin: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Last login timestamp',
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Account creation timestamp',
                    },
                },
            },
            Customer: {
                type: 'object',
                description: 'Customer account (for shoppers)',
                properties: {
                    _id: {
                        type: 'string',
                        description: 'Customer ID',
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Customer email address',
                    },
                    firstName: {
                        type: 'string',
                        description: 'Customer first name',
                    },
                    lastName: {
                        type: 'string',
                        description: 'Customer last name',
                    },
                    phone: {
                        type: 'string',
                        description: 'Customer phone number',
                    },
                    isActive: {
                        type: 'boolean',
                        description: 'Whether the account is active',
                    },
                    emailVerified: {
                        type: 'boolean',
                        description: 'Whether email is verified',
                    },
                    addresses: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                type: {
                                    type: 'string',
                                    enum: ['billing', 'shipping'],
                                },
                                firstName: { type: 'string' },
                                lastName: { type: 'string' },
                                address1: { type: 'string' },
                                address2: { type: 'string' },
                                city: { type: 'string' },
                                state: { type: 'string' },
                                country: { type: 'string' },
                                postalCode: { type: 'string' },
                                phone: { type: 'string' },
                                isDefault: { type: 'boolean' },
                            },
                        },
                        description: 'Customer addresses',
                    },
                    wishlist: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                        description: 'Wishlist product IDs',
                    },
                    preferences: {
                        type: 'object',
                        properties: {
                            currency: { type: 'string' },
                            language: { type: 'string' },
                            newsletter: { type: 'boolean' },
                        },
                        description: 'Customer preferences',
                    },
                    lastLogin: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Last login timestamp',
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Account creation timestamp',
                    },
                },
            },
        },
        Store: {
            type: 'object',
            description: 'Store/Shop entity in the multi-store platform',
            properties: {
                _id: {
                    type: 'string',
                    description: 'Store ID',
                },
                name: {
                    type: 'string',
                    description: 'Store name',
                },
                slug: {
                    type: 'string',
                    description: 'URL-friendly store identifier',
                },
                domain: {
                    type: 'string',
                    description: 'Store domain',
                },
                description: {
                    type: 'string',
                    description: 'Store description',
                },
                logo: {
                    type: 'string',
                    format: 'uri',
                    description: 'Store logo URL',
                },
                currency: {
                    type: 'string',
                    description: 'Default currency code (3 letters)',
                    example: 'USD',
                },
                timezone: {
                    type: 'string',
                    description: 'Store timezone',
                    example: 'UTC',
                },
                isActive: {
                    type: 'boolean',
                    description: 'Whether the store is active',
                },
                settings: {
                    type: 'object',
                    description: 'Store-specific settings',
                },
                createdAt: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Store creation timestamp',
                },
                updatedAt: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Last update timestamp',
                },
            },
        },
    },
    Category: {
        type: 'object',
        description: 'Product category with parent-child hierarchy and SEO support',
        properties: {
            _id: {
                type: 'string',
                description: 'Category ID',
            },
            title: {
                type: 'string',
                description: 'Category title',
            },
            slug: {
                type: 'string',
                description: 'URL-friendly category identifier',
            },
            description: {
                type: 'string',
                description: 'Category description (HTML supported)',
            },
            storeId: {
                type: 'string',
                description: 'Store ID this category belongs to',
            },
            parentCategory: {
                type: 'string',
                description: 'Parent category ID (null for root categories)',
            },
            image: {
                type: 'string',
                format: 'uri',
                description: 'Category image URL',
            },
            status: {
                type: 'string',
                enum: ['active', 'inactive', 'draft'],
                description: 'Category status',
            },
            seo: {
                type: 'object',
                properties: {
                    metaTitle: { type: 'string' },
                    metaDescription: { type: 'string' },
                    metaKeywords: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    canonicalUrl: { type: 'string' },
                    ogTitle: { type: 'string' },
                    ogDescription: { type: 'string' },
                    ogImage: { type: 'string' },
                    twitterCard: { type: 'string' },
                },
                description: 'SEO metadata',
            },
            level: {
                type: 'number',
                description: 'Hierarchy level (0 for root)',
            },
            path: {
                type: 'string',
                description: 'Full category path (e.g., electronics/computers)',
            },
            sortOrder: {
                type: 'number',
                description: 'Display order',
            },
            isVisible: {
                type: 'boolean',
                description: 'Whether category is visible',
            },
            createdAt: {
                type: 'string',
                format: 'date-time',
            },
            updatedAt: {
                type: 'string',
                format: 'date-time',
            },
        },
    },
    Product: {
        type: 'object',
        properties: {
            _id: {
                type: 'string',
                description: 'Product ID',
            },
            name: {
                type: 'string',
                description: 'Product name',
            },
            slug: {
                type: 'string',
                description: 'URL-friendly product identifier',
            },
            description: {
                type: 'string',
                description: 'Product description',
            },
            price: {
                type: 'number',
                description: 'Product price',
            },
            currency: {
                type: 'string',
                description: 'Price currency code',
            },
            images: {
                type: 'array',
                items: {
                    type: 'string',
                },
                description: 'Product image URLs',
            },
            stock: {
                type: 'number',
                description: 'Available stock quantity',
            },
            category: {
                type: 'string',
                description: 'Category ID',
            },
            isActive: {
                type: 'boolean',
                description: 'Whether the product is active',
            },
        },
    },
    Order: {
        type: 'object',
        properties: {
            _id: {
                type: 'string',
                description: 'Order ID',
            },
            orderNumber: {
                type: 'string',
                description: 'Unique order number',
            },
            user: {
                type: 'string',
                description: 'User ID',
            },
            items: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        product: {
                            type: 'string',
                            description: 'Product ID',
                        },
                        quantity: {
                            type: 'number',
                            description: 'Quantity ordered',
                        },
                        price: {
                            type: 'number',
                            description: 'Price at time of order',
                        },
                    },
                },
            },
            total: {
                type: 'number',
                description: 'Order total amount',
            },
            status: {
                type: 'string',
                enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
                description: 'Order status',
            },
            createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Order creation timestamp',
            },
        },
    },
    tags: [
        {
            name: 'Health',
            description: 'Health check endpoints',
        },
        {
            name: 'Customer Auth',
            description: 'Customer authentication and profile management',
        },
        {
            name: 'Admin Auth',
            description: 'Admin authentication and profile management (for admin users only)',
        },
        {
            name: 'Users',
            description: 'User management endpoints (admin)',
        },
        {
            name: 'Stores',
            description: 'Store/Shop management endpoints',
        },
        {
            name: 'Products',
            description: 'Product management endpoints',
        },
        {
            name: 'Categories',
            description: 'Category management endpoints',
        },
        {
            name: 'Attributes',
            description: 'Product attributes for filters and variations',
        },
        {
            name: 'Sales',
            description: 'Sales and discount management',
        },
        {
            name: 'Currencies',
            description: 'Multi-currency support and exchange rates',
        },
        {
            name: 'Geo',
            description: 'Geographic data (countries, states, cities)',
        },
        {
            name: 'GeoGroups',
            description: 'Geographic groups for shipping zones',
        },
        {
            name: 'Orders',
            description: 'Order management endpoints',
        },
        {
            name: 'Cart',
            description: 'Shopping cart endpoints',
        },
        {
            name: 'Payments',
            description: 'Payment processing endpoints',
        },
        {
            name: 'Shipping',
            description: 'Shipping and delivery endpoints',
        },
    ],
};

const options: swaggerJsdoc.Options = {
    swaggerDefinition,
    // Path to the API routes files where JSDoc comments are
    apis: [
        './src/routes/*.ts',
        './src/controllers/*.ts',
        './src/models/*.ts',
    ],
};

export const swaggerSpec = swaggerJsdoc(options);
