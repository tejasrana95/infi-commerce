import { Response } from 'express';
import Geo from '../models/Geo';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

/**
 * @swagger
 * /api/geo:
 *   post:
 *     summary: Create a new geo location (country, state, or city)
 *     tags: [Geo]
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
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [country, state, city]
 *               code:
 *                 type: string
 *               parentId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               isShippingAvailable:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Geo location created successfully
 */
export const createGeo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, type, code, parentId, isActive, isShippingAvailable } = req.body;

    // Validate parent for states and cities
    if (type === 'state' && !parentId) {
        throw new AppError('Parent country is required for states', 400);
    }
    if (type === 'city' && !parentId) {
        throw new AppError('Parent state is required for cities', 400);
    }

    // Verify parent exists
    if (parentId) {
        const parent = await Geo.findById(parentId);
        if (!parent) {
            throw new AppError('Parent location not found', 404);
        }

        // Validate parent type
        if (type === 'state' && parent.type !== 'country') {
            throw new AppError('State parent must be a country', 400);
        }
        if (type === 'city' && parent.type !== 'state') {
            throw new AppError('City parent must be a state', 400);
        }
    }

    const geo = await Geo.create({
        name,
        type,
        code: code?.toUpperCase(),
        parentId: parentId || null,
        isActive: isActive ?? true,
        isShippingAvailable: type === 'country' ? (isShippingAvailable ?? true) : undefined,
    });

    res.status(201).json({
        message: 'Geo location created successfully',
        data: geo,
    });
});

/**
 * @swagger
 * /api/geo:
 *   get:
 *     summary: Get all geo locations
 *     tags: [Geo]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [country, state, city]
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Geo locations retrieved successfully
 */
export const getGeos = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (req.query.type) {
        filter.type = req.query.type;
    }

    if (req.query.parentId) {
        filter.parentId = req.query.parentId;
    } else if (req.query.parentId === 'null') {
        filter.parentId = null;
    }

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    if (req.query.search) {
        const searchRegex = { $regex: req.query.search, $options: 'i' };
        filter.$or = [
            { name: searchRegex },
            { code: searchRegex }
        ];
    }

    const [geos, total] = await Promise.all([
        Geo.find(filter)
            .populate('parentId', 'name type code')
            .sort({ type: 1, name: 1 })
            .skip(skip)
            .limit(limit),
        Geo.countDocuments(filter)
    ]);

    res.json({
        success: true,
        data: geos,
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
 * /api/geo/{id}:
 *   get:
 *     summary: Get geo location by ID
 *     tags: [Geo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Geo location retrieved successfully
 */
export const getGeoById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const geo = await Geo.findById(req.params.id).populate('parentId', 'name type code');

    if (!geo) {
        throw new AppError('Geo location not found', 404);
    }

    res.json({ data: geo });
});

/**
 * @swagger
 * /api/geo/countries/{countryId}/states:
 *   get:
 *     summary: Get all states for a specific country
 *     tags: [Geo]
 *     parameters:
 *       - in: path
 *         name: countryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: States retrieved successfully
 */
export const getStatesByCountry = asyncHandler(async (req: AuthRequest, res: Response) => {
    const states = await Geo.find({
        type: 'state',
        parentId: req.params.countryId
    }).sort({ name: 1 });

    res.json({ data: states });
});

/**
 * @swagger
 * /api/geo/states/{stateId}/cities:
 *   get:
 *     summary: Get all cities for a specific state
 *     tags: [Geo]
 *     parameters:
 *       - in: path
 *         name: stateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cities retrieved successfully
 */
export const getCitiesByState = asyncHandler(async (req: AuthRequest, res: Response) => {
    const cities = await Geo.find({
        type: 'city',
        parentId: req.params.stateId
    }).sort({ name: 1 });

    res.json({ data: cities });
});

/**
 * @swagger
 * /api/geo/{id}:
 *   put:
 *     summary: Update geo location
 *     tags: [Geo]
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
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               isShippingAvailable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Geo location updated successfully
 */
export const updateGeo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, code, isActive, isShippingAvailable } = req.body;

    const geo = await Geo.findById(req.params.id);
    if (!geo) {
        throw new AppError('Geo location not found', 404);
    }

    if (name !== undefined) geo.name = name;
    if (code !== undefined) geo.code = code.toUpperCase();
    if (isActive !== undefined) geo.isActive = isActive;
    if (isShippingAvailable !== undefined && geo.type === 'country') {
        geo.isShippingAvailable = isShippingAvailable;
    }

    await geo.save();

    res.json({
        message: 'Geo location updated successfully',
        data: geo,
    });
});

/**
 * @swagger
 * /api/geo/{id}:
 *   delete:
 *     summary: Delete geo location
 *     tags: [Geo]
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
 *         description: Geo location deleted successfully
 */
export const deleteGeo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const geo = await Geo.findById(req.params.id);
    if (!geo) {
        throw new AppError('Geo location not found', 404);
    }

    // Check if there are children
    const childrenCount = await Geo.countDocuments({ parentId: req.params.id });
    if (childrenCount > 0) {
        throw new AppError(`Cannot delete ${geo.type} with ${childrenCount} child locations. Delete children first.`, 400);
    }

    await geo.deleteOne();

    res.json({ message: 'Geo location deleted successfully' });
});

/**
 * @swagger
 * /api/geo/countries:
 *   get:
 *     summary: Get all countries with their states and cities (hierarchical)
 *     tags: [Geo]
 *     responses:
 *       200:
 *         description: Countries retrieved successfully
 */
export const getCountriesHierarchical = asyncHandler(async (_req: AuthRequest, res: Response) => {
    // Get all countries
    const countries = await Geo.find({ type: 'country' }).sort({ name: 1 });

    // Get all states and cities
    const states = await Geo.find({ type: 'state' }).sort({ name: 1 });
    const cities = await Geo.find({ type: 'city' }).sort({ name: 1 });

    // Build hierarchy
    const result = countries.map(country => {
        const countryStates = states
            .filter(state => state.parentId?.toString() === country._id.toString())
            .map(state => ({
                _id: state._id,
                code: state.code,
                name: state.name,
                isActive: state.isActive,
                cities: cities
                    .filter(city => city.parentId?.toString() === state._id.toString())
                    .map(city => ({
                        _id: city._id,
                        name: city.name,
                        isActive: city.isActive,
                    })),
            }));

        return {
            _id: country._id,
            countryCode: country.code,
            countryName: country.name,
            isActive: country.isActive,
            isShippingAvailable: country.isShippingAvailable,
            states: countryStates,
        };
    });

    res.json({ countries: result });
});

/**
 * @swagger
 * /api/geo/detect:
 *   get:
 *     summary: Detect user's geo location (uses Cloudflare headers if available, fallback to ipapi.co)
 *     tags: [Geo]
 *     responses:
 *       200:
 *         description: Geo location detected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 country_code:
 *                   type: string
 *                 region_code:
 *                   type: string
 *                 city:
 *                   type: string
 */
export const detectGeoLocation = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Check Cloudflare headers first (instant response)
    const cfCountry = req.headers['cf-ipcountry'] as string | undefined;
    const cfRegion = req.headers['cf-region-code'] as string | undefined;
    const cfCity = req.headers['cf-city'] as string | undefined;

    // If Cloudflare headers are present, use them
    if (cfCountry && cfCountry !== 'XX') {
        // Format region_code to match ipapi.co format (COUNTRY-REGION)
        const regionCode = cfRegion ? `${cfCountry}-${cfRegion}` : undefined;

        return res.json({
            country_code: cfCountry,
            region_code: regionCode,
            city: cfCity,
            source: 'cloudflare'
        });
    }

    // Fallback to ipapi.co if Cloudflare headers are not available
    try {
        const response = await fetch('https://ipapi.co/json/', {
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            throw new Error('Geo detection API failed');
        }

        const data = await response.json();

        // Format to match our standard response
        const regionCode = data.region_code ? `${data.country_code}-${data.region_code}` : undefined;

        return res.json({
            country_code: data.country_code,
            region_code: regionCode,
            city: data.city,
            source: 'ipapi'
        });
    } catch (error) {
        // On failure, return empty data (don't block price display)
        return res.json({
            country_code: undefined,
            region_code: undefined,
            city: undefined,
            source: 'fallback'
        });
    }
});
