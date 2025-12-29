import { Router } from 'express';
import {
    getNotifications,
    getNotification,
    getQueueStats,
    processQueue,
    retryNotification,
    cancelNotification,
    getTemplates,
    getTemplate,
    getDefaultTemplate,
    getTemplateTypesList,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateStatus,
    getNotificationsValidation,
    processQueueValidation,
    createTemplateValidation,
    updateTemplateValidation,
    getAdminNotifications,
    markAsRead,
    markAllAsRead,
    createAdminNotification,
    createAdminNotificationValidation,
} from '../controllers/notification.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// Admin Notification Routes
// ============================================

// Get admin notifications
router.get('/admin', authorize('admin', 'store_admin', 'super_admin'), getAdminNotifications);

// Create admin notification (manual)
router.post('/admin', authorize('admin', 'store_admin', 'super_admin'), validate(createAdminNotificationValidation), createAdminNotification);

// Mark as read
router.put('/admin/:id/read', authorize('admin', 'store_admin', 'super_admin'), markAsRead);

// Mark all as read
router.put('/admin/read-all', authorize('admin', 'store_admin', 'super_admin'), markAllAsRead);

// ============================================
// Notification Queue Routes
// ============================================

// Get queue with filters
router.get('/', validate(getNotificationsValidation), getNotifications);

// Get queue statistics
router.get('/stats', getQueueStats);

// Get single notification
router.get('/:id', getNotification);

// Process queue (manual trigger)
router.post('/process', authorize('admin', 'super_admin'), validate(processQueueValidation), processQueue);

// Retry failed notification
router.post('/:id/retry', authorize('admin', 'super_admin'), retryNotification);

// Cancel pending notification
router.delete('/:id', authorize('admin', 'super_admin'), cancelNotification);

// ============================================
// Template Routes
// ============================================

// Get available template types (static list)
router.get('/templates/types', getTemplateTypesList);

// Get default template content (static, for "Load Default" feature)
router.get('/templates/default', getDefaultTemplate);

// Get all templates
router.get('/templates/list', getTemplates);

// Get single template
router.get('/templates/:id', getTemplate);

// Create new template
router.post(
    '/templates',
    authorize('admin', 'super_admin'),
    validate(createTemplateValidation),
    createTemplate
);

// Update template
router.put(
    '/templates/:id',
    authorize('admin', 'super_admin'),
    validate(updateTemplateValidation),
    updateTemplate
);

// Toggle template active status
router.patch(
    '/templates/:id/toggle',
    authorize('admin', 'super_admin'),
    toggleTemplateStatus
);

// Delete template
router.delete(
    '/templates/:id',
    authorize('admin', 'super_admin'),
    deleteTemplate
);

export default router;
