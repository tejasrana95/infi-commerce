import { Response } from 'express';
import { body, param } from 'express-validator';
import GeoGroup from '../models/GeoGroup';
import Store from '../models/Store';
import Geo from '../models/Geo';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

// Validation rules
export const createGeoGroupValidation = [
    body('name').trim().notEmpty().withMessage('Geo group name is required'),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
    body('countries').isArray().withMessage('Countries must be an array'),
];

/**
 * @swagger
 * /api/geo-groups:
 *   post:
 *     summary: Create a new geo group
 *     tags: [GeoGroups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - storeId
 *               - countries
 *             properties:
 *               name:
 *                 type: string
 *                 example: North America
 *               description:
 *                 type: string
 *               storeId:
 *                 type: string
 *               countries:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [US, CA, MX]
 *     responses:
 *       201:
 *         description: Geo group created successfully
 */
export const createGeoGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, description, storeId, countries } = req.body;

    // Verify store exists
    const store = await Store.findById(storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    // Verify all countries exist
    if (countries && countries.length > 0) {
        const upperCountries = countries.map((c: string) => c.toUpperCase());
        const existingCountries = await Geo.find({
            code: { $in: upperCountries },
            type: 'country'
        });

        if (existingCountries.length !== countries.length) {
            throw new AppError('One or more countries not found', 400);
        }
    }

    // Create geo group
    const geoGroup = await GeoGroup.create({
        name,
        description,
        storeId,
        countries: countries.map((c: string) => c.toUpperCase()),
    });

    res.status(201).json({
        message: 'Geo group created successfully',
        geoGroup,
    });
});

/**
 * @swagger
 * /api/geo-groups:
 *   get:
 *     summary: Get all geo groups
 *     tags: [GeoGroups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Geo groups retrieved successfully
 */
export const getGeoGroups = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filter: any = {};

    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    }

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    const geoGroups = await GeoGroup.find(filter)
        .populate('storeId', 'name slug')
        .sort({ name: 1 });

    res.json({ geoGroups });
});

/**
 * @swagger
 * /api/geo-groups/{id}:
 *   get:
 *     summary: Get geo group by ID
 *     tags: [GeoGroups]
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
 *         description: Geo group retrieved successfully
 *       404:
 *         description: Geo group not found
 */
export const getGeoGroupById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const geoGroup = await GeoGroup.findById(req.params.id).populate('storeId', 'name slug');

    if (!geoGroup) {
        throw new AppError('Geo group not found', 404);
    }

    // Get country details
    const countries = await Geo.find({
        code: { $in: geoGroup.countries },
        type: 'country'
    });

    res.json({
        geoGroup,
        countryDetails: countries,
    });
});

/**
 * @swagger
 * /api/geo-groups/{id}:
 *   put:
 *     summary: Update geo group
 *     tags: [GeoGroups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Geo group updated successfully
 */
export const updateGeoGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const geoGroup = await GeoGroup.findById(id);
    if (!geoGroup) {
        throw new AppError('Geo group not found', 404);
    }

    // Verify countries if being updated
    if (updates.countries && updates.countries.length > 0) {
        const upperCountries = updates.countries.map((c: string) => c.toUpperCase());
        const existingCountries = await Geo.find({
            code: { $in: upperCountries },
            type: 'country'
        });

        if (existingCountries.length !== updates.countries.length) {
            throw new AppError('One or more countries not found', 400);
        }

        updates.countries = upperCountries;
    }

    // Update geo group
    Object.assign(geoGroup, updates);
    await geoGroup.save();

    res.json({
        message: 'Geo group updated successfully',
        geoGroup,
    });
});

/**
 * @swagger
 * /api/geo-groups/{id}:
 *   delete:
 *     summary: Delete geo group
 *     tags: [GeoGroups]
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
 *         description: Geo group deleted successfully
 */
export const deleteGeoGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
    const geoGroup = await GeoGroup.findByIdAndDelete(req.params.id);

    if (!geoGroup) {
        throw new AppError('Geo group not found', 404);
    }

    res.json({
        message: 'Geo group deleted successfully',
    });
});

/**
 * @swagger
 * /api/geo-groups/{id}/countries:
 *   post:
 *     summary: Add countries to geo group
 *     tags: [GeoGroups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - countries
 *             properties:
 *               countries:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Countries added successfully
 */
export const addCountries = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { countries } = req.body;

    const geoGroup = await GeoGroup.findById(req.params.id);
    if (!geoGroup) {
        throw new AppError('Geo group not found', 404);
    }

    if (!Array.isArray(countries)) {
        throw new AppError('Countries must be an array', 400);
    }

    // Verify countries exist
    const upperCountries = countries.map((c: string) => c.toUpperCase());
    const existingCountries = await Geo.find({
        code: { $in: upperCountries },
        type: 'country'
    });

    if (existingCountries.length !== countries.length) {
        throw new AppError('One or more countries not found', 400);
    }

    // Add countries (avoid duplicates)
    upperCountries.forEach((country: string) => {
        if (!geoGroup.countries.includes(country)) {
            geoGroup.countries.push(country);
        }
    });

    await geoGroup.save();

    res.json({
        message: 'Countries added successfully',
        geoGroup,
    });
});

/**
 * @swagger
 * /api/geo-groups/{id}/countries/{code}:
 *   delete:
 *     summary: Remove country from geo group
 *     tags: [GeoGroups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Country removed successfully
 */
export const removeCountry = asyncHandler(async (req: AuthRequest, res: Response) => {
    const geoGroup = await GeoGroup.findById(req.params.id);
    if (!geoGroup) {
        throw new AppError('Geo group not found', 404);
    }

    const countryCode = req.params.code.toUpperCase();
    geoGroup.countries = geoGroup.countries.filter((c) => c !== countryCode);

    await geoGroup.save();

    res.json({
        message: 'Country removed successfully',
        geoGroup,
    });
});
