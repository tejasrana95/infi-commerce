

import { Router } from 'express';
import {
    getOrderAccounting,
    updateOrderAccounting,
    regenerateOrderAccounting,
    syncOrderReturns,
    fetchGatewayData,
    getReportSummary,
    getReportOrders,
    exportReport,
} from '../controllers/accounting.controller';
import { authenticate } from '../middleware/auth';


const router = Router();

// All routes require admin authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Accounting
 *   description: Order accounting and P&L reports
 */

/**
 * @swagger
 * /api/accounting/reports/summary:
 *   get:
 *     summary: Get P&L report summary
 *     tags: [Accounting]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: preset
 *         schema:
 *           type: string
 *           enum: [today, yesterday, last_7_days, this_month, last_30_days, last_90_days, ytd, all_time, custom]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: P&L summary retrieved successfully
 *       400:
 *         description: Missing storeId
 *       500:
 *         description: Server error
 */
router.get('/reports/summary', getReportSummary);

/**
 * @swagger
 * /api/accounting/reports/orders:
 *   get:
 *     summary: Get orders with accounting data
 *     tags: [Accounting]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: preset
 *         schema:
 *           type: string
 *           enum: [today, yesterday, last_7_days, this_month, last_30_days, last_90_days, ytd, all_time, custom]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       400:
 *         description: Missing storeId
 *       500:
 *         description: Server error
 */
router.get('/reports/orders', getReportOrders);

/**
 * @swagger
 * /api/accounting/reports/export:
 *   get:
 *     summary: Export accounting data as CSV
 *     tags: [Accounting]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: preset
 *         schema:
 *           type: string
 *           enum: [today, yesterday, last_7_days, this_month, last_30_days, last_90_days, ytd, all_time, custom]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Missing storeId
 *       500:
 *         description: Server error
 */
router.get('/reports/export', exportReport);

/**
 * @swagger
 * /api/accounting/{orderId}:
 *   get:
 *     summary: Get accounting data for a specific order
 *     tags: [Accounting]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Accounting data retrieved successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get('/:orderId', getOrderAccounting);

/**
 * @swagger
 * /api/accounting/{orderId}:
 *   put:
 *     summary: Update accounting data for an order
 *     tags: [Accounting]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expenses:
 *                 type: number
 *               cogs:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Accounting data updated successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.put('/:orderId', updateOrderAccounting);

/**
 * @swagger
 * /api/accounting/{orderId}/regenerate:
 *   post:
 *     summary: Regenerate accounting data for an order
 *     tags: [Accounting]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Accounting data regenerated successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/:orderId/regenerate', regenerateOrderAccounting);

/**
 * @swagger
 * /api/accounting/{orderId}/sync-returns:
 *   post:
 *     summary: Sync returns from order to accounting record
 *     tags: [Accounting]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns synced successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/:orderId/sync-returns', syncOrderReturns);

/**
 * @swagger
 * /api/accounting/{orderId}/fetch-gateway-data:
 *   post:
 *     summary: Fetch payment gateway data for an order
 *     tags: [Accounting]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Gateway data fetched applied successfully
 *       400:
 *         description: No payment ID found or unable to fetch data
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.post('/:orderId/fetch-gateway-data', fetchGatewayData);

export default router;
