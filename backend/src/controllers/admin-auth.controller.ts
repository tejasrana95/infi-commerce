import { Response } from 'express';
import { body } from 'express-validator';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

// Validation rules
export const adminRegisterValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('role').isIn(['admin', 'store_admin', 'super_admin']).withMessage('Invalid role'),
];

export const adminLoginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

// Generate JWT tokens for admin users
const generateAdminTokens = (userId: string, email: string, role: string, storeId?: string) => {
    const accessToken = jwt.sign(
        { id: userId, email, role, storeId, type: 'admin' },
        config.jwt.secret as string,
        { expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'] }
    );

    const refreshToken = jwt.sign(
        { id: userId, type: 'admin' },
        config.jwt.refreshSecret as string,
        { expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'] }
    );

    return { accessToken, refreshToken };
};

/**
 * @swagger
 * /api/auth/admin/register:
 *   post:
 *     summary: Register a new admin user
 *     tags: [Admin Auth]
 *     description: Create a new admin, store admin, or super admin account (requires super admin privileges)
 *     security:
 *       - bearerAuth: []
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
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecureAdminPass123!
 *               firstName:
 *                 type: string
 *                 example: Admin
 *               lastName:
 *                 type: string
 *                 example: User
 *               role:
 *                 type: string
 *                 enum: [admin, store_admin, super_admin]
 *                 example: admin
 *               storeId:
 *                 type: string
 *                 description: Required for store_admin role
 *               phone:
 *                 type: string
 *                 example: +1234567890
 *     responses:
 *       201:
 *         description: Admin user registered successfully
 *       400:
 *         description: Validation error or user already exists
 *       403:
 *         description: Insufficient permissions
 */
export const registerAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password, firstName, lastName, phone, role, storeId } = req.body;

    // Only super_admin can create new admin users
    // For initial setup, you might want to allow first admin creation without auth
    // if (req.user && req.user.role !== 'super_admin') {
    //     throw new AppError('Insufficient permissions to create admin users', 403);
    // }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError('Admin user with this email already exists', 400);
    }

    // Validate storeId for store_admin
    if (role === 'store_admin' && !storeId) {
        throw new AppError('Store ID is required for store admin role', 400);
    }

    // Create new admin user
    const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        role,
        storeId: storeId || undefined,
    });

    res.status(201).json({
        message: 'Admin user registered successfully',
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            storeId: user.storeId,
        },
    });
});

/**
 * @swagger
 * /api/auth/admin/login:
 *   post:
 *     summary: Login admin user
 *     tags: [Admin Auth]
 *     description: Authenticate admin user and receive access tokens
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
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecureAdminPass123!
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account deactivated
 */
export const loginAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    // Find admin user
    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
        throw new AppError('Account is deactivated. Please contact super admin.', 403);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateAdminTokens(
        user._id.toString(),
        user.email,
        user.role,
        user.storeId?.toString()
    );

    res.json({
        message: 'Login successful',
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            storeId: user.storeId,
            permissions: user.permissions,
        },
        accessToken,
        refreshToken,
    });
});

/**
 * @swagger
 * /api/auth/admin/refresh:
 *   post:
 *     summary: Refresh admin access token
 *     tags: [Admin Auth]
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
export const refreshAdminToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
    }

    try {
        const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;

        // Verify it's an admin token
        if (decoded.type !== 'admin') {
            throw new AppError('Invalid token type', 401);
        }

        // Find user
        const user = await User.findById(decoded.id);
        if (!user || !user.isActive) {
            throw new AppError('Invalid refresh token', 401);
        }

        // Generate new tokens
        const tokens = generateAdminTokens(
            user._id.toString(),
            user.email,
            user.role,
            user.storeId?.toString()
        );

        res.json(tokens);
    } catch (error) {
        throw new AppError('Invalid or expired refresh token', 401);
    }
});

/**
 * @swagger
 * /api/auth/admin/me:
 *   get:
 *     summary: Get current admin user profile
 *     tags: [Admin Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export const getAdminProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.id).select('-password');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.json({ user });
});

/**
 * @swagger
 * /api/auth/admin/me:
 *   put:
 *     summary: Update admin user profile
 *     tags: [Admin Auth]
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
export const updateAdminProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { firstName, lastName, phone } = req.body;

    const user = await User.findByIdAndUpdate(
        req.user!.id,
        { firstName, lastName, phone },
        { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.json({
        message: 'Profile updated successfully',
        user,
    });
});
