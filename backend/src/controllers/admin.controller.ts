import { Response } from 'express';
import { body, param } from 'express-validator';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

/**
 * Validation rules
 */
export const createAdminValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('role').isIn(['admin', 'store_admin', 'super_admin', 'pos_user']).withMessage('Valid role is required'),
    body('storeId').optional().isMongoId().withMessage('Valid store ID is required'),
    body('storeIds').optional().isArray().withMessage('storeIds must be an array'),
    body('storeIds.*').optional().isMongoId().withMessage('Invalid store ID in storeIds array'),
    body('phone').optional().trim(),
    body('posPermissions.canApplyDiscount').optional().isBoolean(),
];

export const updateAdminValidation = [
    param('id').isMongoId().withMessage('Valid admin ID is required'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').optional().trim().notEmpty().withMessage('First name is required'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name is required'),
    body('role').optional().isIn(['admin', 'store_admin', 'super_admin', 'pos_user']).withMessage('Valid role is required'),
    body('storeId').optional().isMongoId().withMessage('Valid store ID is required'),
    body('storeIds').optional().isArray().withMessage('storeIds must be an array'),
    body('storeIds.*').optional().isMongoId().withMessage('Invalid store ID in storeIds array'),
    body('phone').optional().trim(),
    body('isActive').optional().isBoolean(),
    body('posPermissions.canApplyDiscount').optional().isBoolean(),
];

/**
 * @route   GET /api/admins
 * @desc    Get all admin users
 * @access  Private (Super Admin)
 */
export const getAllAdmins = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, search, role, status } = req.query;

    const filter: any = {};

    if (search) {
        filter.$or = [
            { email: { $regex: search, $options: 'i' } },
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
        ];
    }

    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const skip = (Number(page) - 1) * Number(limit);

    const [admins, total] = await Promise.all([
        User.find(filter)
            .select('-password')
            .populate('storeIds', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        User.countDocuments(filter),
    ]);

    res.json({
        success: true,
        data: admins,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

/**
 * @route   GET /api/admins/:id
 * @desc    Get admin by ID
 * @access  Private (Super Admin)
 */
export const getAdminById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const admin = await User.findById(id).select('-password').populate('storeIds', 'name');

    if (!admin) {
        throw new AppError('Admin user not found', 404);
    }

    res.json({
        success: true,
        data: admin,
    });
});

/**
 * @route   POST /api/admins
 * @desc    Create a new admin user
 * @access  Private (Super Admin)
 */
export const createAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password, firstName, lastName, phone, role, storeId, storeIds, isActive = true } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        throw new AppError('Email already registered', 400);
    }

    // Validate storeId is required for store_admin
    if (role === 'store_admin' && !storeId && (!storeIds || storeIds.length === 0)) {
        throw new AppError('Store ID is required for store admin role', 400);
    }

    // Prepare storeIds array
    let finalStoreIds = storeIds || [];
    if (storeId && !finalStoreIds.includes(storeId)) {
        finalStoreIds.push(storeId);
    }

    const admin = await User.create({
        email: email.toLowerCase(),
        password,
        firstName,
        lastName,
        phone,
        role,
        storeIds: finalStoreIds,
        isActive,
        posPermissions: req.body.posPermissions,
    });

    // Remove password from response
    const adminResponse = admin.toObject();
    delete (adminResponse as any).password;

    res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        data: adminResponse,
    });
});

/**
 * @route   PUT /api/admins/:id
 * @desc    Update admin user
 * @access  Private (Super Admin)
 */
export const updateAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { email, password, firstName, lastName, phone, role, storeId, storeIds, isActive, permissions } = req.body;

    const admin = await User.findById(id);

    if (!admin) {
        throw new AppError('Admin user not found', 404);
    }

    // Prevent editing super_admin unless you are super_admin
    if (admin.role === 'super_admin' && req.user?.role !== 'super_admin') {
        throw new AppError('Cannot modify super admin account', 403);
    }

    // Check if email is being changed and if it's already in use
    if (email && email.toLowerCase() !== admin.email) {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw new AppError('Email already in use', 400);
        }
        admin.email = email.toLowerCase();
    }

    // Update fields
    if (password) admin.password = password; // Will be hashed by pre-save hook
    if (firstName !== undefined) admin.firstName = firstName;
    if (lastName !== undefined) admin.lastName = lastName;
    if (phone !== undefined) admin.phone = phone;
    if (role !== undefined) admin.role = role;

    if (storeIds !== undefined) {
        admin.storeIds = storeIds;
    } else if (storeId !== undefined) {
        admin.storeIds = [storeId];
    }

    if (isActive !== undefined) admin.isActive = isActive;
    if (permissions !== undefined) admin.permissions = permissions;
    if (req.body.posPermissions !== undefined) admin.posPermissions = req.body.posPermissions;

    await admin.save();

    // Remove password from response
    const adminResponse = admin.toObject();
    delete (adminResponse as any).password;

    res.json({
        success: true,
        message: 'Admin user updated successfully',
        data: adminResponse,
    });
});

/**
 * @route   DELETE /api/admins/:id
 * @desc    Delete admin user
 * @access  Private (Super Admin)
 */
export const deleteAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const admin = await User.findById(id);

    if (!admin) {
        throw new AppError('Admin user not found', 404);
    }

    // Prevent deleting super_admin
    if (admin.role === 'super_admin') {
        throw new AppError('Cannot delete super admin account', 403);
    }

    // Prevent self-deletion
    if (admin._id.toString() === req.user?.id) {
        throw new AppError('Cannot delete your own account', 400);
    }

    await User.findByIdAndDelete(id);

    res.json({
        success: true,
        message: 'Admin user deleted successfully',
    });
});
