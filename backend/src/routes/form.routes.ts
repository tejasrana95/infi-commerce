import { Router } from 'express';
import { auth, checkRole } from '../middleware/auth';
import {
    createForm,
    getForms,
    getFormById,
    updateForm,
    deleteForm,
    duplicateForm,
    getFormSubmissions,
    deleteFormSubmission,
    getPublicFormBySlug,
    getPublicFormById,
    submitForm,
    createFormValidation,
    updateFormValidation,
} from '../controllers/form.controller';
import { validate } from '../middleware/validation';
import { publicSubmissionLimiter } from '../middleware/rateLimit';
import { honeypot } from '../middleware/honeypot';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for file uploads in memory (forwarding to StorageService)
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (_req, file, cb) => {
        // Allow common file types
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|csv|xls|xlsx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed types: jpeg, jpg, png, gif, pdf, doc, docx, txt, csv, xls, xlsx'));
        }
    },
});

// Admin routes - require authentication and admin/super_admin role
router.post(
    '/',
    auth,
    checkRole('admin', 'super_admin'),
    validate(createFormValidation),
    createForm
);

router.get(
    '/',
    auth,
    checkRole('admin', 'super_admin'),
    getForms
);

router.get(
    '/:id',
    auth,
    checkRole('admin', 'super_admin'),
    getFormById
);

router.put(
    '/:id',
    auth,
    checkRole('admin', 'super_admin'),
    validate(updateFormValidation),
    updateForm
);

router.delete(
    '/:id',
    auth,
    checkRole('admin', 'super_admin'),
    deleteForm
);

router.post(
    '/:id/duplicate',
    auth,
    checkRole('admin', 'super_admin'),
    duplicateForm
);

router.get(
    '/:id/submissions',
    auth,
    checkRole('admin', 'super_admin'),
    getFormSubmissions
);

router.delete(
    '/:id/submissions/:submissionId',
    auth,
    checkRole('admin', 'super_admin'),
    deleteFormSubmission
);

// Public routes - no authentication required
router.get(
    '/public/id/:id',
    getPublicFormById
);

router.get(
    '/public/:slug',
    getPublicFormBySlug
);

router.post(
    '/public/submit/id/:id',
    publicSubmissionLimiter,
    honeypot('_form_trap'),
    upload.any(),
    submitForm
);

router.post(
    '/public/submit/:slug',
    publicSubmissionLimiter,
    honeypot('_form_trap'),
    upload.any(),
    submitForm
);

export default router;
