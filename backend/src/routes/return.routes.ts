import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    checkEligibility,
    calculateRefund,
    createReturnRequest,
    adminCreateReturn,
    getReturnRequest,
    getUserReturnRequests,
    getAllReturnRequests,
    approveReturnRequest,
    rejectReturnRequest,
    schedulePickup,
    markReceived,
    processRefund,
    shipExchange,
    completeReturn,
    cancelReturn,
} from '../controllers/return.controller';

const router = express.Router();

/**
 * @route   POST /api/returns/check-eligibility
 * @desc    Check return eligibility for an order
 * @access  Private (Customer/Admin)
 */
router.post('/check-eligibility', authenticate, checkEligibility);

/**
 * @route   POST /api/returns/calculate
 * @desc    Calculate refund amount for items (preview before creating return)
 * @access  Private (Customer/Admin)
 */
router.post('/calculate', authenticate, calculateRefund);

/**
 * @route   POST /api/returns/create
 * @desc    Create a return/exchange request (Customer)
 * @access  Private (Customer)
 */
router.post('/create', authenticate, createReturnRequest);

/**
 * @route   POST /api/returns/admin/create
 * @desc    Admin creates a return/exchange request
 * @access  Private (Admin)
 */
router.post(
    '/admin/create',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    adminCreateReturn
);

/**
 * @route   GET /api/returns/user/me
 * @desc    Get customer's return requests
 * @access  Private (Customer)
 */
router.get('/user/me', authenticate, getUserReturnRequests);

/**
 * @route   GET /api/returns
 * @desc    Get all return requests (Admin)
 * @access  Private (Admin)
 */
router.get(
    '/',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    getAllReturnRequests
);

/**
 * @route   GET /api/returns/:id
 * @desc    Get return request details
 * @access  Private (Customer/Admin)
 */
router.get('/:id', authenticate, getReturnRequest);

/**
 * @route   PATCH /api/returns/:id/approve
 * @desc    Approve return request
 * @access  Private (Admin)
 */
router.patch(
    '/:id/approve',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    approveReturnRequest
);

/**
 * @route   PATCH /api/returns/:id/reject
 * @desc    Reject return request
 * @access  Private (Admin)
 */
router.patch(
    '/:id/reject',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    rejectReturnRequest
);

/**
 * @route   PATCH /api/returns/:id/schedule-pickup
 * @desc    Schedule pickup for return items
 * @access  Private (Admin)
 */
router.patch(
    '/:id/schedule-pickup',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    schedulePickup
);

/**
 * @route   PATCH /api/returns/:id/mark-received
 * @desc    Mark items as received
 * @access  Private (Admin)
 */
router.patch(
    '/:id/mark-received',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    markReceived
);

/**
 * @route   PATCH /api/returns/:id/process-refund
 * @desc    Process refund for return
 * @access  Private (Admin)
 */
router.patch(
    '/:id/process-refund',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    processRefund
);

/**
 * @route   PATCH /api/returns/:id/ship-exchange
 * @desc    Ship exchange order
 * @access  Private (Admin)
 */
router.patch(
    '/:id/ship-exchange',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    shipExchange
);

/**
 * @route   PATCH /api/returns/:id/complete
 * @desc    Complete return/exchange request
 * @access  Private (Admin)
 */
router.patch(
    '/:id/complete',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    completeReturn
);

/**
 * @route   PATCH /api/returns/:id/cancel
 * @desc    Cancel return request
 * @access  Private (Customer/Admin)
 */
router.patch('/:id/cancel', authenticate, cancelReturn);

export default router;
