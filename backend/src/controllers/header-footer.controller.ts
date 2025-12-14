import { Response } from 'express';

import HeaderLayout from '../models/HeaderLayout';
import FooterLayout from '../models/FooterLayout';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

// --- Header Controllers ---

/**
 * @swagger
 * /api/headers:
 *   post:
 *     summary: Create header layout
 *     tags: [Global Elements]
 *     security:
 *       - bearerAuth: []
 */
export const createHeader = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, name, sections, mobileSettings, customCSS, isDefault, isActive } = req.body;

    const header = await HeaderLayout.create({
        storeId,
        name,
        sections,
        mobileSettings,
        customCSS,
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
        message: 'Header layout created successfully',
        header,
    });
});

/**
 * @swagger
 * /api/headers:
 *   get:
 *     summary: Get all header layouts
 *     tags: [Global Elements]
 */
export const getHeaders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId } = req.query;
    if (!storeId) throw new AppError('Store ID is required', 400);

    const headers = await HeaderLayout.find({ storeId }).sort({ isDefault: -1, updatedAt: -1 });
    res.json({ headers });
});

/**
 * @swagger
 * /api/headers/{id}:
 *   get:
 *     summary: Get header layout by ID
 *     tags: [Global Elements]
 */
export const getHeaderById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const header = await HeaderLayout.findById(req.params.id);
    if (!header) throw new AppError('Header layout not found', 404);
    res.json({ header });
});

/**
 * @swagger
 * /api/headers/{id}:
 *   put:
 *     summary: Update header layout
 *     tags: [Global Elements]
 */
export const updateHeader = asyncHandler(async (req: AuthRequest, res: Response) => {
    const header = await HeaderLayout.findById(req.params.id);
    if (!header) throw new AppError('Header layout not found', 404);

    delete req.body.storeId;
    Object.assign(header, req.body);
    await header.save();

    res.json({
        message: 'Header layout updated successfully',
        header,
    });
});

/**
 * @swagger
 * /api/headers/{id}:
 *   delete:
 *     summary: Delete header layout
 *     tags: [Global Elements]
 */
export const deleteHeader = asyncHandler(async (req: AuthRequest, res: Response) => {
    const header = await HeaderLayout.findById(req.params.id);
    if (!header) throw new AppError('Header layout not found', 404);

    if (header.isDefault) {
        throw new AppError('Cannot delete the default header layout', 400);
    }

    await header.deleteOne();
    res.json({ message: 'Header layout deleted successfully' });
});


// --- Footer Controllers ---

/**
 * @swagger
 * /api/footers:
 *   post:
 *     summary: Create footer layout
 *     tags: [Global Elements]
 *     security:
 *       - bearerAuth: []
 */
export const createFooter = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, name, sections, backToTop, customCSS, isDefault, isActive } = req.body;

    const footer = await FooterLayout.create({
        storeId,
        name,
        sections,
        backToTop,
        customCSS,
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
        message: 'Footer layout created successfully',
        footer,
    });
});

/**
 * @swagger
 * /api/footers:
 *   get:
 *     summary: Get all footer layouts
 *     tags: [Global Elements]
 */
export const getFooters = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId } = req.query;
    if (!storeId) throw new AppError('Store ID is required', 400);

    const footers = await FooterLayout.find({ storeId }).sort({ isDefault: -1, updatedAt: -1 });
    res.json({ footers });
});

/**
 * @swagger
 * /api/footers/{id}:
 *   get:
 *     summary: Get footer layout by ID
 *     tags: [Global Elements]
 */
export const getFooterById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const footer = await FooterLayout.findById(req.params.id);
    if (!footer) throw new AppError('Footer layout not found', 404);
    res.json({ footer });
});

/**
 * @swagger
 * /api/footers/{id}:
 *   put:
 *     summary: Update footer layout
 *     tags: [Global Elements]
 */
export const updateFooter = asyncHandler(async (req: AuthRequest, res: Response) => {
    const footer = await FooterLayout.findById(req.params.id);
    if (!footer) throw new AppError('Footer layout not found', 404);

    delete req.body.storeId;
    Object.assign(footer, req.body);
    await footer.save();

    res.json({
        message: 'Footer layout updated successfully',
        footer,
    });
});

/**
 * @swagger
 * /api/footers/{id}:
 *   delete:
 *     summary: Delete footer layout
 *     tags: [Global Elements]
 */
export const deleteFooter = asyncHandler(async (req: AuthRequest, res: Response) => {
    const footer = await FooterLayout.findById(req.params.id);
    if (!footer) throw new AppError('Footer layout not found', 404);

    if (footer.isDefault) {
        throw new AppError('Cannot delete the default footer layout', 400);
    }

    await footer.deleteOne();
    res.json({ message: 'Footer layout deleted successfully' });
});
