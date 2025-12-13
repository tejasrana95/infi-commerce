import { Router } from 'express';
import {
    getAllAdmins,
    getAdminById,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    createAdminValidation,
    updateAdminValidation,
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admins
 *   description: Admin user management (Super Admin only)
 */

/**
 * @swagger
 * /api/admins:
 *   get:
 *     summary: Get all admin users
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, store_admin, super_admin]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *     responses:
 *       200:
 *         description: List of admin users
 */
router.get('/', authenticate, authorize('admin', 'super_admin'), getAllAdmins);

/**
 * @swagger
 * /api/admins/{id}:
 *   get:
 *     summary: Get admin by ID
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Admin details
 *       404:
 *         description: Admin not found
 */
router.get('/:id', authenticate, authorize('admin', 'super_admin'), getAdminById);

/**
 * @swagger
 * /api/admins:
 *   post:
 *     summary: Create a new admin user
 *     tags: [Admins]
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
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, store_admin]
 *               storeId:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin created
 *       400:
 *         description: Email already registered
 */
router.post(
    '/',
    authenticate,
    authorize('super_admin'),
    validate(createAdminValidation),
    createAdmin
);

/**
 * @swagger
 * /api/admins/{id}:
 *   put:
 *     summary: Update admin user
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Admin updated
 *       404:
 *         description: Admin not found
 */
router.put(
    '/:id',
    authenticate,
    authorize('super_admin'),
    validate(updateAdminValidation),
    updateAdmin
);

/**
 * @swagger
 * /api/admins/{id}:
 *   delete:
 *     summary: Delete admin user
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Admin deleted
 *       404:
 *         description: Admin not found
 */
router.delete('/:id', authenticate, authorize('super_admin'), deleteAdmin);

export default router;
