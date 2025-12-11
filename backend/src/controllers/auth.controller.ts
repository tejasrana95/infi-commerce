import { Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

// Validation rules
export const registerValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
];

export const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
];

// Generate JWT tokens
const generateTokens = (userId: string, email: string, role: string, storeId?: string) => {
    const accessToken = jwt.sign(
        { id: userId, email, role, storeId },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
        { id: userId },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
};

// Register new user
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password, firstName, lastName, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError('User with this email already exists', 400);
    }

    // Create new user
    const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        role: 'customer',
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
        user._id.toString(),
        user.email,
        user.role
    );

    res.status(201).json({
        message: 'User registered successfully',
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        },
        accessToken,
        refreshToken,
    });
});

// Login user
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
        throw new AppError('Account is deactivated', 403);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
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
        },
        accessToken,
        refreshToken,
    });
});

// Refresh access token
export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
    }

    try {
        const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;

        // Find user
        const user = await User.findById(decoded.id);
        if (!user || !user.isActive) {
            throw new AppError('Invalid refresh token', 401);
        }

        // Generate new tokens
        const tokens = generateTokens(
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

// Get current user profile
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.id).select('-password');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.json({ user });
});

// Update user profile
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
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
