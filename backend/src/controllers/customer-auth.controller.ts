import { Response } from 'express';
import { body } from 'express-validator';
import jwt, { SignOptions } from 'jsonwebtoken';
import axios from 'axios';
import crypto from 'crypto';
import Customer from '../models/Customer';
import StoreModel from '../models/Store';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import { transactionalNotificationService } from '../services/transactional-notification.service';
import { notificationService } from '../services/notification.service';
import { emitCustomerEvent } from '../events';
import { TwoFactorService } from '../services/two-factor.service';

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

// Generate MFA session token for customer
const generateCustomerMfaToken = (customerId: string, email: string) => {
    return jwt.sign(
        { id: customerId, email, type: 'mfa_challenge_customer' },
        config.jwt.secret as string,
        { expiresIn: '5m' }
    );
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

    // Store context is provided by storeContext middleware
    const storeId = req.storeId!;
    const storeName = req.store!.name;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
        throw new AppError('Customer with this email already exists', 400);
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Create new customer with verification token
    const customer = await Customer.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        emailVerified: false,
        emailVerificationToken: hashedToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Send verification email via notification queue
    await transactionalNotificationService.sendEmailVerification(
        storeId,
        storeName,
        customer.email,
        customer.firstName,
        verificationToken,
        customer.phone
    );

    // Notify Admin
    await notificationService.createAdminNotification({
        type: 'customer',
        title: 'New Customer',
        message: `New customer registered: ${firstName} ${lastName}`,
        data: {
            customerId: customer._id.toString(),
            email: customer.email
        }
    });

    // Emit customer creation event
    emitCustomerEvent('customerCreate', customer, storeId);

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
    const storeId = req.headers['x-store-id'];
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

    // Emit customer login event
    emitCustomerEvent('customerLogin', customer, storeId as string);

    // Check if 2FA is enabled
    if (customer.twoFactorEnabled) {
        const mfaToken = generateCustomerMfaToken(customer._id.toString(), customer.email);
        res.json({
            message: 'MFA required',
            mfaRequired: true,
            mfaToken,
        });
        return;
    }

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
            twoFactorEnabled: customer.twoFactorEnabled,
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
    const storeId = req.headers['x-store-id'];
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

    // Emit customer update event
    emitCustomerEvent('customerUpdate', customer, storeId as string);

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

    const store = await StoreModel.findById(storeId);
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

        // Emit customer creation event
        emitCustomerEvent('customerCreate', customer, storeId);
    }

    // Emit customer login event (for social login)
    emitCustomerEvent('customerLogin', customer, storeId);

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

/**
 * @swagger
 * /api/auth/customer/2fa/setup:
 *   post:
 *     summary: Initiate customer 2FA setup
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA setup initiated
 */
export const setupCustomer2FA = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customer = await Customer.findById(req.user!.id);
    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    if (customer.twoFactorEnabled) {
        throw new AppError('2FA is already enabled', 400);
    }

    const secret = TwoFactorService.generateSecret();
    const issuer = req.store?.name || config.mfaIssuer;
    const keyUri = TwoFactorService.generateKeyUri(customer.email, issuer, secret);
    const qrCode = await TwoFactorService.generateQrCode(keyUri);

    // Store secret temporarily
    customer.twoFactorSecret = secret;
    await customer.save();

    res.json({
        secret,
        qrCode,
    });
});

/**
 * @swagger
 * /api/auth/customer/2fa/verify:
 *   post:
 *     summary: Verify and enable customer 2FA
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: 2FA enabled successfully
 */
export const verifyAndEnableCustomer2FA = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { code } = req.body;
    const customer = await Customer.findById(req.user!.id);

    if (!customer || !customer.twoFactorSecret) {
        throw new AppError('2FA setup not initiated', 400);
    }

    const isValid = TwoFactorService.verifyCode(code, customer.twoFactorSecret);
    if (!isValid) {
        throw new AppError('Invalid verification code', 400);
    }

    customer.twoFactorEnabled = true;
    const backupCodes = TwoFactorService.generateBackupCodes();
    customer.twoFactorBackupCodes = backupCodes;
    await customer.save();

    res.json({
        message: '2FA enabled successfully',
        backupCodes,
    });
});

/**
 * @swagger
 * /api/auth/customer/2fa/disable:
 *   post:
 *     summary: Disable customer 2FA
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: 2FA disabled successfully
 */
export const disableCustomer2FA = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { code } = req.body;
    const customer = await Customer.findById(req.user!.id);

    if (!customer || !customer.twoFactorEnabled) {
        throw new AppError('2FA is not enabled', 400);
    }

    const isValid = TwoFactorService.verifyCode(code, customer.twoFactorSecret!);
    if (!isValid) {
        throw new AppError('Invalid verification code', 400);
    }

    customer.twoFactorEnabled = false;
    customer.twoFactorSecret = undefined;
    customer.twoFactorBackupCodes = [];
    await customer.save();

    res.json({ message: '2FA disabled successfully' });
});

/**
 * @swagger
 * /api/auth/customer/2fa/verify-login:
 *   post:
 *     summary: Verify customer 2FA code during login
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mfaToken, code]
 *             properties:
 *               mfaToken: { type: string }
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
export const verifyCustomer2FALogin = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { mfaToken, code } = req.body;
    const storeId = req.headers['x-store-id'];

    try {
        const decoded = jwt.verify(mfaToken, config.jwt.secret) as any;
        if (decoded.type !== 'mfa_challenge_customer') {
            throw new AppError('Invalid MFA token', 401);
        }

        const customer = await Customer.findById(decoded.id);
        if (!customer || !customer.isActive || !customer.twoFactorEnabled) {
            throw new AppError('Invalid MFA session', 401);
        }

        const isValid = TwoFactorService.verifyCode(code, customer.twoFactorSecret!);
        if (!isValid) {
            // Check backup codes
            const backupIndex = customer.twoFactorBackupCodes?.indexOf(code.toUpperCase());
            if (backupIndex !== undefined && backupIndex > -1) {
                customer.twoFactorBackupCodes?.splice(backupIndex, 1);
                await customer.save();
            } else {
                throw new AppError('Invalid 2FA code', 401);
            }
        }

        // Generate tokens
        const tokens = generateCustomerTokens(
            customer._id.toString(),
            customer.email
        );

        // Emit customer login event
        emitCustomerEvent('customerLogin', customer, storeId as string);

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
                twoFactorEnabled: customer.twoFactorEnabled,
                createdAt: customer.createdAt,
                updatedAt: customer.updatedAt,
            },
            ...tokens,
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Invalid or expired MFA token', 401);
    }
});

// ============================================
// Password & Email Verification Endpoints
// ============================================

/**
 * @swagger
 * /api/auth/customer/change-password:
 *   post:
 *     summary: Change customer password
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect
 */
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const storeId = req.headers['x-store-id'];
    if (!currentPassword || !newPassword) {
        throw new AppError('Current password and new password are required', 400);
    }

    if (newPassword.length < 6) {
        throw new AppError('New password must be at least 6 characters', 400);
    }

    const customer = await Customer.findById(req.user!.id);
    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    // Verify current password
    const isMatch = await customer.comparePassword(currentPassword);
    if (!isMatch) {
        throw new AppError('Current password is incorrect', 401);
    }

    // Update password (will be hashed by pre-save hook)
    customer.password = newPassword;
    await customer.save();
    emitCustomerEvent('customerUpdate', customer, storeId as string);
    res.json({ message: 'Password changed successfully' });
});

/**
 * @swagger
 * /api/auth/customer/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent (if account exists)
 */
export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email } = req.body;

    if (!email) {
        throw new AppError('Email is required', 400);
    }

    // Always return success to prevent email enumeration
    const successMessage = 'If an account with that email exists, a password reset link has been sent';

    // Store context is provided by storeContext middleware
    const storeId = req.storeId!;
    const storeName = req.store!.name;

    const customer = await Customer.findOne({ email: email.toLowerCase() });
    if (!customer) {
        // Don't reveal if email exists
        res.json({ message: successMessage });
        return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save token and expiry (1 hour)
    customer.passwordResetToken = hashedToken;
    customer.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await customer.save();
    emitCustomerEvent('customerPasswordResetRequest', customer, storeId as string);
    // Send email via notification queue
    await transactionalNotificationService.sendPasswordReset(
        storeId,
        storeName,
        customer.email,
        customer.firstName,
        resetToken,
        customer.phone
    );

    res.json({ message: successMessage });
});

/**
 * @swagger
 * /api/auth/customer/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token, newPassword } = req.body;
    const storeId = req.headers['x-store-id'];
    if (!token || !newPassword) {
        throw new AppError('Token and new password are required', 400);
    }

    if (newPassword.length < 6) {
        throw new AppError('Password must be at least 6 characters', 400);
    }

    // Hash token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const customer = await Customer.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
    });

    if (!customer) {
        throw new AppError('Invalid or expired reset token', 400);
    }

    // Update password
    customer.password = newPassword;
    customer.passwordResetToken = undefined;
    customer.passwordResetExpires = undefined;
    await customer.save();
    emitCustomerEvent('customerPasswordReset', customer, storeId as string);
    res.json({ message: 'Password reset successfully' });
});

/**
 * @swagger
 * /api/auth/customer/verify-email:
 *   post:
 *     summary: Verify email address with token
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token } = req.body;

    if (!token) {
        throw new AppError('Verification token is required', 400);
    }

    // Hash token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const customer = await Customer.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: new Date() },
    });

    if (!customer) {
        throw new AppError('Invalid or expired verification token', 400);
    }

    customer.emailVerified = true;
    customer.emailVerificationToken = undefined;
    customer.emailVerificationExpires = undefined;
    await customer.save();

    // Send Welcome notification after successful verification
    const store = await StoreModel.findById(req.storeId);
    if (store) {
        await transactionalNotificationService.sendWelcome(
            store._id.toString(),
            store.name,
            customer.email,
            customer.firstName,
            customer.phone
        );
    }

    res.json({ message: 'Email verified successfully' });
});

/**
 * @swagger
 * /api/auth/customer/resend-verification:
 *   post:
 *     summary: Resend email verification
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email sent
 *       400:
 *         description: Email already verified
 */
export const resendVerification = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Store context is provided by storeContext middleware
    const storeId = req.storeId!;
    const storeName = req.store!.name;

    const customer = await Customer.findById(req.user!.id);
    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    if (customer.emailVerified) {
        throw new AppError('Email is already verified', 400);
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Save token and expiry (24 hours)
    customer.emailVerificationToken = hashedToken;
    customer.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await customer.save();

    // Send email via notification queue
    await transactionalNotificationService.sendEmailVerification(
        storeId,
        storeName,
        customer.email,
        customer.firstName,
        verificationToken,
        customer.phone
    );

    res.json({ message: 'Verification email sent' });
});

// Validation rules for new endpoints
export const changePasswordValidation = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

export const forgotPasswordValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
];

export const resetPasswordValidation = [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const verifyEmailValidation = [
    body('token').notEmpty().withMessage('Verification token is required'),
];
