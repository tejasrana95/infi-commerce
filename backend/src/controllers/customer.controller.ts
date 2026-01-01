import { Response } from 'express';
import { body, param } from 'express-validator';
import mongoose from 'mongoose';
import Customer from '../models/Customer';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import { emitCustomerEvent } from '../events';

/**
 * Validation rules
 */
export const createCustomerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('phone').optional().trim(),
];

export const updateCustomerValidation = [
    param('id').isMongoId().withMessage('Valid customer ID is required'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').optional().trim().notEmpty().withMessage('First name is required'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name is required'),
    body('phone').optional().trim(),
    body('isActive').optional().isBoolean(),
];

/**
 * @route   GET /api/customers
 * @desc    Get all customers (Admin only)
 * @access  Private (Admin)
 */
export const getAllCustomers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, search, status } = req.query;

    const filter: any = {};

    if (search) {
        filter.$or = [
            { email: { $regex: search, $options: 'i' } },
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
        ];
    }

    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    // RBAC Check: Store Admin only sees customers who ordered from their stores
    if (req.user?.role === 'store_admin') {
        const assignedStoreIds = req.user.storeIds?.map(id => new mongoose.Types.ObjectId(id)) || [];
        const Order = require('../models/Order').default;
        const customerIds = await Order.distinct('customerId', { storeId: { $in: assignedStoreIds } });
        filter._id = { $in: customerIds };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [customers, total] = await Promise.all([
        Customer.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Customer.countDocuments(filter),
    ]);

    res.json({
        success: true,
        data: customers,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

/**
 * @route   GET /api/customers/:id
 * @desc    Get customer by ID
 * @access  Private (Admin)
 */
export const getCustomerById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const customer = await Customer.findById(id).select('-password');

    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    res.json({
        success: true,
        data: customer,
    });
});

/**
 * @route   POST /api/customers
 * @desc    Create a new customer (Admin-initiated)
 * @access  Private (Admin)
 */
export const createCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password, firstName, lastName, phone, isActive = true, emailVerified = false, addresses = [] } = req.body;

    // Check if email already exists
    const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
    if (existingCustomer) {
        throw new AppError('Email already registered', 400);
    }

    const customer = await Customer.create({
        email: email.toLowerCase(),
        password,
        firstName,
        lastName,
        phone,
        isActive,
        emailVerified,
        addresses,
    });

    // Emit customer creation event
    emitCustomerEvent('customerCreate', customer, (req as any).storeId || 'common');

    // Remove password from response
    const customerResponse = customer.toObject();
    delete (customerResponse as any).password;

    res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customerResponse,
    });
});

/**
 * @route   PUT /api/customers/:id
 * @desc    Update customer
 * @access  Private (Admin)
 */
export const updateCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { email, password, firstName, lastName, phone, isActive, emailVerified, addresses } = req.body;

    const customer = await Customer.findById(id);

    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    // Check if email is being changed and if it's already in use
    if (email && email.toLowerCase() !== customer.email) {
        const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
        if (existingCustomer) {
            throw new AppError('Email already in use', 400);
        }
        customer.email = email.toLowerCase();
    }

    // Update fields
    if (password) customer.password = password; // Will be hashed by pre-save hook
    if (firstName !== undefined) customer.firstName = firstName;
    if (lastName !== undefined) customer.lastName = lastName;
    if (phone !== undefined) customer.phone = phone;
    if (isActive !== undefined) customer.isActive = isActive;
    if (emailVerified !== undefined) customer.emailVerified = emailVerified;
    if (addresses !== undefined) customer.addresses = addresses;

    await customer.save();

    // Emit customer update event
    emitCustomerEvent('customerUpdate', customer, (req as any).storeId || 'common');

    // Remove password from response
    const customerResponse = customer.toObject();
    delete (customerResponse as any).password;

    res.json({
        success: true,
        message: 'Customer updated successfully',
        data: customerResponse,
    });
});

/**
 * @route   DELETE /api/customers/:id
 * @desc    Delete customer
 * @access  Private (Admin)
 */
export const deleteCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
    // RBAC Check: Store Admin cannot delete anything
    if (req.user?.role === 'store_admin') {
        throw new AppError('Unauthorized: Store admins cannot delete customers', 403);
    }

    const { id } = req.params;

    const customer = await Customer.findByIdAndDelete(id);

    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    // Emit customer delete event
    emitCustomerEvent('customerDelete', customer, (req as any).storeId || 'common');

    res.json({
        success: true,
        message: 'Customer deleted successfully',
    });
});
