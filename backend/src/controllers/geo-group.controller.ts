import { Response } from 'express';
import { body } from 'express-validator';
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
    body('includeAllCountries').optional().isBoolean().withMessage('includeAllCountries must be boolean'),
    body('excludedCountries').optional().isArray().withMessage('excludedCountries must be an array'),
];

const validateCountryCodesExist = async (codes: string[]) => {
    if (!codes.length) return;
    const existingCountries = await Geo.find({
        code: { $in: codes },
        type: 'country',
    }).select('_id');

    if (existingCountries.length !== codes.length) {
        throw new AppError('One or more countries not found', 400);
    }
};

const normalizeCountryCodes = (values?: string[]): string[] => {
    const codes = (values || [])
        .map((code) => String(code || '').trim().toUpperCase())
        .filter(Boolean);
    return Array.from(new Set(codes));
};

const resolveCountriesForGroup = async (params: {
    includeAllCountries: boolean;
    countries: string[];
    excludedCountries: string[];
}): Promise<string[]> => {
    const { includeAllCountries, countries, excludedCountries } = params;
    if (!includeAllCountries) {
        return countries;
    }

    const allCountries = await Geo.find({ type: 'country' }).select('code').lean();
    const excludedSet = new Set(excludedCountries);
    return allCountries
        .map((country) => (country.code || '').toUpperCase())
        .filter((code) => code && !excludedSet.has(code));
};

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
    const { name, description, storeId, countries, includeAllCountries, excludedCountries } = req.body;

    // Verify store exists
    const store = await Store.findById(storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    const normalizedCountries = normalizeCountryCodes(countries);
    const normalizedExcludedCountries = normalizeCountryCodes(excludedCountries);
    const includeAll = !!includeAllCountries;

    await validateCountryCodesExist(normalizedCountries);
    await validateCountryCodesExist(normalizedExcludedCountries);

    const resolvedCountries = await resolveCountriesForGroup({
        includeAllCountries: includeAll,
        countries: normalizedCountries,
        excludedCountries: normalizedExcludedCountries,
    });

    // Create geo group
    const geoGroup = await GeoGroup.create({
        name,
        description,
        storeId,
        countries: resolvedCountries,
        includeAllCountries: includeAll,
        excludedCountries: normalizedExcludedCountries,
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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    }

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    if (req.query.search) {
        const searchRegex = { $regex: req.query.search, $options: 'i' };
        filter.$or = [
            { name: searchRegex },
            { description: searchRegex },
            { countries: { $elemMatch: { $regex: req.query.search, $options: 'i' } } }
        ];
    }

    const [geoGroups, total] = await Promise.all([
        GeoGroup.find(filter)
            .populate('storeId', 'name slug')
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit),
        GeoGroup.countDocuments(filter)
    ]);

    res.json({
        success: true,
        geoGroups,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    });
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

    const includeAllCountries = updates.includeAllCountries !== undefined
        ? !!updates.includeAllCountries
        : !!geoGroup.includeAllCountries;

    const normalizedCountries = updates.countries !== undefined
        ? normalizeCountryCodes(updates.countries)
        : normalizeCountryCodes(geoGroup.countries);

    const normalizedExcludedCountries = updates.excludedCountries !== undefined
        ? normalizeCountryCodes(updates.excludedCountries)
        : normalizeCountryCodes(geoGroup.excludedCountries || []);

    await validateCountryCodesExist(normalizedCountries);
    await validateCountryCodesExist(normalizedExcludedCountries);

    const resolvedCountries = await resolveCountriesForGroup({
        includeAllCountries,
        countries: normalizedCountries,
        excludedCountries: normalizedExcludedCountries,
    });

    updates.includeAllCountries = includeAllCountries;
    updates.excludedCountries = normalizedExcludedCountries;
    updates.countries = resolvedCountries;

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
