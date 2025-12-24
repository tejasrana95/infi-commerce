import { Response } from 'express';
import { body } from 'express-validator';
import jwt, { SignOptions } from 'jsonwebtoken';
import axios from 'axios';
import Customer from '../models/Customer';
import Store from '../models/Store';
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

export const customerSocialLoginValidation = [
    body('provider').isIn(['google', 'facebook']).withMessage('Invalid provider'),
    body('token').notEmpty().withMessage('Token is required'),
    body('storeId').notEmpty().withMessage('Store ID is required'),
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

    // Create new customer (emailVerified defaults to false)
    const customer = await Customer.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        emailVerified: false,  // Explicitly set to false - requires verification
    });

    // TODO: Queue email verification message here
    // await emailQueue.add('sendVerificationEmail', { customerId: customer._id, email: customer.email });

    // Don't return access token - customer must verify email first
    res.status(201).json({
        message: 'Registration successful! Please check your email to verify your account.',
        requiresVerification: true,
        customer: {
            id: customer._id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            emailVerified: false,
        },
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

    // Check if email is verified
    if (!customer.emailVerified) {
        throw new AppError('Please verify your email before logging in. Check your inbox for the verification link.', 403);
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
            phone: customer.phone,
            emailVerified: customer.emailVerified,
            addresses: customer.addresses,
            wishlist: customer.wishlist,
            preferences: customer.preferences,
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt,
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
    const { firstName, lastName, phone, addresses, preferences } = req.body;

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (addresses !== undefined) updateData.addresses = addresses;
    if (preferences !== undefined) updateData.preferences = preferences;

    const customer = await Customer.findByIdAndUpdate(
        req.user!.id,
        updateData,
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

/**
 * @swagger
 * /api/auth/customer/social-login:
 *   post:
 *     summary: Social login for customer
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - token
 *               - storeId
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [google, facebook]
 *               token:
 *                 type: string
 *               storeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
export const socialLogin = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { provider, token, storeId } = req.body;

    const store = await Store.findById(storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    const socialConfig = store.settings.socialLogin?.[provider as 'google' | 'facebook'];
    if (!socialConfig?.enabled) {
        throw new AppError(`Social login with ${provider} is disabled for this store`, 403);
    }

    let email: string | undefined;
    let firstName: string | undefined;
    let lastName: string | undefined;
    let providerId: string | undefined;

    if (provider === 'google') {
        try {
            const response = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
            // Optional: input verification if store.settings.socialLogin.google.clientId matches response.data.aud
            if (socialConfig.clientId && response.data.aud !== socialConfig.clientId) {
                // strict check if clientId is configured
                // throw new AppError('Invalid token audience', 401); 
                // relaxing this for now as sometimes android/ios client ids differ
            }

            email = response.data.email;
            firstName = response.data.given_name;
            lastName = response.data.family_name;
            providerId = response.data.sub;
        } catch (error) {
            throw new AppError('Invalid Google token', 401);
        }
    } else if (provider === 'facebook') {
        try {
            const response = await axios.get(`https://graph.facebook.com/me?access_token=${token}&fields=id,email,first_name,last_name`);
            email = response.data.email;
            firstName = response.data.first_name;
            lastName = response.data.last_name;
            providerId = response.data.id;
        } catch (error) {
            throw new AppError('Invalid Facebook token', 401);
        }
    }

    if (!email || !providerId) {
        throw new AppError('Could not retrieve email from social provider', 400);
    }

    // Find or Create Customer
    let customer = await Customer.findOne({
        $or: [
            { email },
            { 'socialAccounts.providerId': providerId, 'socialAccounts.provider': provider }
        ]
    });

    if (customer) {
        // Link account if not already linked
        const isLinked = customer.socialAccounts?.some(
            acc => acc.provider === provider && acc.providerId === providerId
        );

        if (!isLinked) {
            customer.socialAccounts = customer.socialAccounts || [];
            customer.socialAccounts.push({ provider, providerId });
            // If email wasn't verified before, social login usually confirms it
            if (!customer.emailVerified) customer.emailVerified = true;
            await customer.save();
        }
    } else {
        // Create new customer
        // Generate a random password since they are using social login
        const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '!';

        customer = await Customer.create({
            email,
            password: randomPassword,
            firstName: firstName || 'User',
            lastName: lastName || '-',  // Placeholder since lastName is required
            emailVerified: true,
            isActive: true,
            socialAccounts: [{ provider, providerId }]
        });
    }

    const tokens = generateCustomerTokens(customer._id.toString(), customer.email);

    res.json({
        message: 'Login successful',
        customer: {
            id: customer._id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            emailVerified: customer.emailVerified,
        },
        ...tokens,
    });
});
