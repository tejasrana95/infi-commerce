import { Response } from 'express';
import { body } from 'express-validator';
import jwt, { SignOptions } from 'jsonwebtoken';
import Customer from '../models/Customer';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

// Validation rules
export const customerRegisterValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
];

export const customerLoginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

// Generate JWT tokens for customers
const generateCustomerTokens = (customerId: string, email: string) => {
    const accessToken = jwt.sign(
        { id: customerId, email, type: 'customer' },
        config.jwt.secret as string,
        { expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'] }
    );

    const refreshToken = jwt.sign(
        { id: customerId, type: 'customer' },
        config.jwt.refreshSecret as string,
        { expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'] }
    );

    return { accessToken, refreshToken };
};

/**
 * @swagger
 * /api/auth/customer/register:
 *   post:
 *     summary: Register a new customer
 *     tags: [Customer Auth]
 *     description: Create a new customer account for shopping
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: customer@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: SecurePass123!
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *     responses:
 *       201:
 *         description: Customer registered successfully
 *       400:
 *         description: Validation error or customer already exists
 */
export const registerCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password, firstName, lastName, phone } = req.body;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
        throw new AppError('Customer with this email already exists', 400);
    }

    // Create new customer
    const customer = await Customer.create({
        email,
        password,
        firstName,
        lastName,
        phone,
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateCustomerTokens(
        customer._id.toString(),
        customer.email
    );

    res.status(201).json({
        message: 'Customer registered successfully',
        customer: {
            id: customer._id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
        },
        accessToken,
        refreshToken,
    });
});

/**
 * @swagger
 * /api/auth/customer/login:
 *   post:
 *     summary: Login customer
 *     tags: [Customer Auth]
 *     description: Authenticate customer and receive access tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: customer@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export const loginCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    // Find customer
    const customer = await Customer.findOne({ email });
    if (!customer) {
        throw new AppError('Invalid email or password', 401);
    }

    // Check if customer is active
    if (!customer.isActive) {
        throw new AppError('Account is deactivated. Please contact support.', 403);
    }

    // Verify password
    const isPasswordValid = await customer.comparePassword(password);
    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    customer.lastLogin = new Date();
    await customer.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateCustomerTokens(
        customer._id.toString(),
        customer.email
    );

    res.json({
        message: 'Login successful',
        customer: {
            id: customer._id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            emailVerified: customer.emailVerified,
        },
        accessToken,
        refreshToken,
    });
});

/**
 * @swagger
 * /api/auth/customer/refresh:
 *   post:
 *     summary: Refresh customer access token
 *     tags: [Customer Auth]
 *     description: Get a new access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
export const refreshCustomerToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
    }

    try {
        const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;

        // Verify it's a customer token
        if (decoded.type !== 'customer') {
            throw new AppError('Invalid token type', 401);
        }

        // Find customer
        const customer = await Customer.findById(decoded.id);
        if (!customer || !customer.isActive) {
            throw new AppError('Invalid refresh token', 401);
        }

        // Generate new tokens
        const tokens = generateCustomerTokens(
            customer._id.toString(),
            customer.email
        );

        res.json(tokens);
    } catch (error) {
        throw new AppError('Invalid or expired refresh token', 401);
    }
});

/**
 * @swagger
 * /api/auth/customer/me:
 *   get:
 *     summary: Get current customer profile
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export const getCustomerProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customer = await Customer.findById(req.user!.id).select('-password');

    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    res.json({ customer });
});

/**
 * @swagger
 * /api/auth/customer/me:
 *   put:
 *     summary: Update customer profile
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
export const updateCustomerProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { firstName, lastName, phone } = req.body;

    const customer = await Customer.findByIdAndUpdate(
        req.user!.id,
        { firstName, lastName, phone },
        { new: true, runValidators: true }
    ).select('-password');

    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    res.json({
        message: 'Profile updated successfully',
        customer,
    });
});
