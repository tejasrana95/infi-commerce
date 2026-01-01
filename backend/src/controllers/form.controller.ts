import { Response } from 'express';
import { body, param } from 'express-validator';
import mongoose from 'mongoose';
import Form from '../models/Form';
import FormSubmission from '../models/FormSubmission';
import File from '../models/File';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import { storageService } from '../services/storage';
import { generateUniqueFilename } from '../middleware/upload';
import { getFileCategory } from '../middleware/fileValidation';
import path from 'path';

// Validation rules
export const createFormValidation = [
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
    body('name').trim().notEmpty().withMessage('Form name is required'),
    body('slug').trim().notEmpty().withMessage('Form slug is required'),
    body('emailSettings.to').isArray({ min: 1 }).withMessage('At least one recipient email is required'),
    body('emailSettings.subject').trim().notEmpty().withMessage('Email subject is required'),
    body('emailSettings.body').trim().notEmpty().withMessage('Email body is required'),
];

export const updateFormValidation = [
    param('id').isMongoId().withMessage('Invalid form ID'),
    body('name').optional().trim().notEmpty(),
    body('slug').optional().trim().notEmpty(),
];

/**
 * @swagger
 * /api/forms:
 *   post:
 *     summary: Create a new form
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *               - name
 *               - slug
 *               - emailSettings
 *             properties:
 *               storeId:
 *                 type: string
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               sections:
 *                 type: array
 *               emailSettings:
 *                 type: object
 *     responses:
 *       201:
 *         description: Form created successfully
 */
export const createForm = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, name, slug, description, sections, emailSettings, confirmationEmail, status } = req.body;

    // Check for duplicate slug
    const existingForm = await Form.findOne({ storeId, slug });
    if (existingForm) {
        throw new AppError('A form with this slug already exists', 400);
    }

    const form = new Form({
        storeId,
        name,
        slug,
        description,
        sections: sections || [],
        emailSettings,
        confirmationEmail,
        status: status || 'draft',
        submissionsCount: 0,
    });

    await form.save();

    res.status(201).json({
        message: 'Form created successfully',
        form,
    });
});

/**
 * @swagger
 * /api/forms:
 *   get:
 *     summary: Get all forms
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Forms retrieved successfully
 */
export const getForms = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, status, search, page = 1, limit = 20 } = req.query;

    const filter: any = {};

    if (storeId) {
        filter.storeId = storeId;
    }

    if (status) {
        filter.status = status;
    }

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { slug: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [forms, total] = await Promise.all([
        Form.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .select('-sections'), // Exclude sections from list view for performance
        Form.countDocuments(filter),
    ]);

    res.json({
        forms,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
    });
});

/**
 * @swagger
 * /api/forms/{id}:
 *   get:
 *     summary: Get form by ID
 *     tags: [Forms]
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
 *         description: Form retrieved successfully
 *       404:
 *         description: Form not found
 */
export const getFormById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const form = await Form.findById(req.params.id);

    if (!form) {
        throw new AppError('Form not found', 404);
    }

    res.json({ form });
});

/**
 * @swagger
 * /api/forms/{id}:
 *   put:
 *     summary: Update form
 *     tags: [Forms]
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
 *         description: Form updated successfully
 *       404:
 *         description: Form not found
 */
export const updateForm = asyncHandler(async (req: AuthRequest, res: Response) => {
    const form = await Form.findById(req.params.id);

    if (!form) {
        throw new AppError('Form not found', 404);
    }

    const updates = { ...req.body };

    // Prevent storeId change
    delete updates.storeId;

    // If slug is being updated, check for duplicates
    if (updates.slug && updates.slug !== form.slug) {
        const existingForm = await Form.findOne({
            storeId: form.storeId,
            slug: updates.slug,
            _id: { $ne: form._id },
        });
        if (existingForm) {
            throw new AppError('A form with this slug already exists', 400);
        }
    }

    Object.assign(form, updates);
    await form.save();

    res.json({
        message: 'Form updated successfully',
        form,
    });
});

/**
 * @swagger
 * /api/forms/{id}:
 *   delete:
 *     summary: Delete form
 *     tags: [Forms]
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
 *         description: Form deleted successfully
 *       404:
 *         description: Form not found
 */
export const deleteForm = asyncHandler(async (req: AuthRequest, res: Response) => {
    const form = await Form.findById(req.params.id);

    if (!form) {
        throw new AppError('Form not found', 404);
    }

    // Also delete all submissions for this form
    await FormSubmission.deleteMany({ formId: form._id });

    await form.deleteOne();

    res.json({
        message: 'Form deleted successfully',
    });
});

/**
 * @swagger
 * /api/forms/{id}/duplicate:
 *   post:
 *     summary: Duplicate form
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Form duplicated successfully
 */
export const duplicateForm = asyncHandler(async (req: AuthRequest, res: Response) => {
    const form = await Form.findById(req.params.id);

    if (!form) {
        throw new AppError('Form not found', 404);
    }

    // Generate unique slug
    let newSlug = `${form.slug}-copy`;
    let counter = 1;
    while (await Form.findOne({ storeId: form.storeId, slug: newSlug })) {
        newSlug = `${form.slug}-copy-${counter}`;
        counter++;
    }

    const newForm = new Form({
        storeId: form.storeId,
        name: `${form.name} (Copy)`,
        slug: newSlug,
        description: form.description,
        sections: form.sections,
        emailSettings: form.emailSettings,
        confirmationEmail: form.confirmationEmail,
        status: 'draft',
        submissionsCount: 0,
    });

    await newForm.save();

    res.status(201).json({
        message: 'Form duplicated successfully',
        form: newForm,
    });
});

/**
 * @swagger
 * /api/forms/{id}/submissions:
 *   get:
 *     summary: Get form submissions
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Submissions retrieved successfully
 */
export const getFormSubmissions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { page = 1, limit = 50, startDate, endDate } = req.query;

    const form = await Form.findById(id);
    if (!form) {
        throw new AppError('Form not found', 404);
    }

    const filter: any = { formId: id };

    // Date range filter
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
            filter.createdAt.$gte = new Date(startDate as string);
        }
        if (endDate) {
            filter.createdAt.$lte = new Date(endDate as string);
        }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [submissions, total] = await Promise.all([
        FormSubmission.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        FormSubmission.countDocuments(filter),
    ]);

    res.json({
        submissions,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
    });
});

/**
 * @swagger
 * /api/forms/{id}/submissions/{submissionId}:
 *   delete:
 *     summary: Delete form submission
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Submission deleted successfully
 */
export const deleteFormSubmission = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { submissionId } = req.params;

    const submission = await FormSubmission.findById(submissionId);
    if (!submission) {
        throw new AppError('Submission not found', 404);
    }

    // Update form submission count
    await Form.findByIdAndUpdate(
        submission.formId,
        { $inc: { submissionsCount: -1 } }
    );

    await submission.deleteOne();

    res.json({
        message: 'Submission deleted successfully',
    });
});

/**
 * @swagger
 * /api/public/forms/id/{id}:
 *   get:
 *     summary: Get published form by ID (public)
 *     tags: [Forms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Form retrieved successfully
 *       404:
 *         description: Form not found
 */
export const getPublicFormById = asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const storeId = req.query.storeId || req.headers['x-store-id'];

    if (!storeId) {
        throw new AppError('Store ID is required', 400);
    }

    const form = await Form.findOne({
        _id: id,
        storeId,
        status: 'published',
    });

    if (!form) {
        throw new AppError('Form not found', 404);
    }

    res.json({ form });
});

/**
 * @swagger
 * /api/public/forms/{slug}:
 *   get:
 *     summary: Get published form by slug (public)
 *     tags: [Forms]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Form retrieved successfully
 *       404:
 *         description: Form not found
 */
export const getPublicFormBySlug = asyncHandler(async (req: any, res: Response) => {
    const { slug } = req.params;
    const storeId = req.query.storeId || req.headers['x-store-id'];

    if (!storeId) {
        throw new AppError('Store ID is required', 400);
    }

    const form = await Form.findOne({
        slug,
        storeId,
        status: 'published',
    });

    if (!form) {
        throw new AppError('Form not found', 404);
    }

    res.json({ form });
});

/**
 * @swagger
 * /api/public/forms/submit/{slug}:
 *   post:
 *     summary: Submit form (public)
 *     tags: [Forms]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Form submitted successfully
 */
export const submitForm = asyncHandler(async (req: any, res: Response) => {
    const { slug, id } = req.params;
    const storeId = req.body.storeId || req.headers['x-store-id'];

    if (!storeId) {
        throw new AppError('Store ID is required', 400);
    }

    const query: any = { storeId, status: 'published' };
    if (id) {
        query._id = id;
    } else if (slug) {
        query.slug = slug;
    }

    const form = await Form.findOne(query);

    if (!form) {
        throw new AppError('Form not found', 404);
    }

    // Extract form data
    const formData: Record<string, any> = {};
    const files: Array<{
        fieldName: string;
        fileName: string;
        fileUrl: string;
        fileSize: number;
    }> = [];

    // Process regular fields
    Object.keys(req.body).forEach(key => {
        if (key !== 'storeId') {
            formData[key] = req.body[key];
        }
    });

    // Process uploaded files using StorageService
    const submissionId = new mongoose.Types.ObjectId();
    const storageFolder = `/forms/${submissionId}/`;
    const provider = storageService.getStorageProvider();

    if (req.files) {
        const uploadedFiles = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
        for (const file of uploadedFiles as any[]) {
            // Generate unique filename and path
            const uniqueFilename = generateUniqueFilename(file.originalname);
            const relativePath = path.join(storageFolder, uniqueFilename);

            // Upload to storage
            await provider.upload(file.buffer, relativePath, file.mimetype, file.originalname);

            // Get public URL
            const url = await provider.getUrl(relativePath);

            // Create File record for FileManager
            await File.create({
                originalName: file.originalname,
                filename: uniqueFilename,
                path: relativePath,
                folder: storageFolder,
                url,
                mimeType: file.mimetype,
                size: file.size,
                type: 'file',
                category: getFileCategory(file.mimetype),
                store: storeId,
                // uploadedBy is left undefined for public submissions
            });

            files.push({
                fieldName: file.fieldname,
                fileName: file.originalname,
                fileUrl: url,
                fileSize: file.size,
            });
            formData[file.fieldname] = url;
        }
    }

    // Create submission
    const submission = new FormSubmission({
        _id: submissionId,
        formId: form._id,
        storeId: form.storeId,
        data: formData,
        files: files.length > 0 ? files : undefined,
        metadata: {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            referer: req.get('Referrer'),
        },
        emailSent: false,
        confirmationEmailSent: false,
    });

    await submission.save();

    // Update form submission count
    await Form.findByIdAndUpdate(form._id, { $inc: { submissionsCount: 1 } });

    // Send emails via notification queue
    try {
        const notificationService = (await import('../services/notification.service')).default;

        // Map field names to labels and types for better formatting
        const fieldLabelMap: Record<string, string> = {};
        const fieldTypeMap: Record<string, string> = {};
        const subFieldsMap: Record<string, any[]> = {};

        form.sections.forEach((section: any) => {
            const fields = [...(section.fields || [])];
            if (section.columns) {
                section.columns.forEach((col: any) => fields.push(...(col.fields || [])));
            }
            fields.forEach((field: any) => {
                fieldLabelMap[field.name] = field.label;
                fieldTypeMap[field.name] = field.type;
                if (field.subFields) {
                    subFieldsMap[field.name] = field.subFields;
                }
            });
        });

        const formatValue = (key: string, value: any): string => {
            const type = fieldTypeMap[key];
            if (type === 'repeater' && typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) {
                        const subFields = subFieldsMap[key] || [];
                        const subLabelMap = subFields.reduce((acc, f) => ({ ...acc, [f.name]: f.label }), {} as any);

                        return '<br/>' + parsed.map((item, idx) => {
                            const details = Object.entries(item)
                                .map(([sk, sv]) => `&nbsp;&nbsp;&nbsp;<strong>${subLabelMap[sk] || sk}:</strong> ${sv}`)
                                .join('<br/>');
                            return `&nbsp;&nbsp;<strong>Item #${idx + 1}:</strong><br/>${details}`;
                        }).join('<br/>');
                    }
                } catch (e) {
                    return value;
                }
            }
            return value;
        };

        // Format form data for email display
        const formattedDataList = Object.entries(formData)
            .map(([key, value]) => `<strong>${fieldLabelMap[key] || key}:</strong> ${formatValue(key, value)}`)
            .join('<br/>');

        // Build email content with form data
        let emailBody = form.emailSettings.body;
        emailBody += '<br/><br/><h3>Form Submission Data:</h3>';
        emailBody += formattedDataList;

        if (files.length > 0) {
            emailBody += '<br/><br/><h3>Uploaded Files:</h3><ul>';
            files.forEach(file => {
                emailBody += `<li><a href="${file.fileUrl}">${fieldLabelMap[file.fieldName] || file.fieldName}</a>: ${file.fileName} (${(file.fileSize / 1024).toFixed(2)} KB)</li>`;
            });
            emailBody += '</ul>';
        }

        // Queue notification to admin(s)
        for (const recipientEmail of form.emailSettings.to) {
            await notificationService.queueNotification({
                storeId: storeId.toString(),
                channel: 'email',
                priority: 'normal',
                type: 'custom',
                recipient: recipientEmail,
                subject: form.emailSettings.subject,
                content: emailBody,
                metadata: {
                    formId: form._id.toString(),
                    formName: form.name,
                    submissionId: submission._id.toString(),
                },
            });
        }

        // Queue CC emails
        if (form.emailSettings.cc && form.emailSettings.cc.length > 0) {
            for (const ccEmail of form.emailSettings.cc) {
                await notificationService.queueNotification({
                    storeId: storeId.toString(),
                    channel: 'email',
                    priority: 'normal',
                    type: 'custom',
                    recipient: ccEmail,
                    subject: `[CC] ${form.emailSettings.subject}`,
                    content: emailBody,
                    metadata: {
                        formId: form._id.toString(),
                        formName: form.name,
                        submissionId: submission._id.toString(),
                    },
                });
            }
        }

        // Queue BCC emails
        if (form.emailSettings.bcc && form.emailSettings.bcc.length > 0) {
            for (const bccEmail of form.emailSettings.bcc) {
                await notificationService.queueNotification({
                    storeId: storeId.toString(),
                    channel: 'email',
                    priority: 'normal',
                    type: 'custom',
                    recipient: bccEmail,
                    subject: `[BCC] ${form.emailSettings.subject}`,
                    content: emailBody,
                    metadata: {
                        formId: form._id.toString(),
                        formName: form.name,
                        submissionId: submission._id.toString(),
                    },
                });
            }
        }

        // Send confirmation email to form submitter if enabled
        if (form.confirmationEmail?.enabled && formData.email) {
            const confirmationBody = form.confirmationEmail.body ||
                'Thank you for your submission. We have received your form and will get back to you soon.';

            await notificationService.queueNotification({
                storeId: storeId.toString(),
                channel: 'email',
                priority: 'normal',
                type: 'custom',
                recipient: formData.email,
                subject: form.confirmationEmail.subject || 'Form Submission Confirmation',
                content: confirmationBody,
                metadata: {
                    formId: form._id.toString(),
                    formName: form.name,
                    submissionId: submission._id.toString(),
                    isConfirmation: true,
                },
            });

            submission.confirmationEmailSent = true;
        }

        submission.emailSent = true;
        await submission.save();
    } catch (emailError) {
        console.error('Error queuing form submission emails:', emailError);
        // Don't fail the submission if email fails
    }

    res.status(201).json({
        message: 'Form submitted successfully',
        submissionId: submission._id,
    });
});
