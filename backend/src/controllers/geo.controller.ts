import { Response } from 'express';
import { body, param } from 'express-validator';
import Geo from '../models/Geo';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

// Validation rules
export const createGeoValidation = [
    body('countryCode').trim().notEmpty().isLength({ min: 2, max: 2 }).withMessage('Country code must be 2 characters'),
    body('countryName').trim().notEmpty().withMessage('Country name is required'),
];

/**
 * @swagger
 * /api/geo/countries:
 *   post:
 *     summary: Add a new country
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
 *               - countryCode
 *               - countryName
 *             properties:
 *               countryCode:
 *                 type: string
 *                 example: US
 *               countryName:
 *                 type: string
 *                 example: United States
 *               isShippingAvailable:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Country added successfully
 */
export const createCountry = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { countryCode, countryName, isShippingAvailable } = req.body;

    // Check if country already exists
    const existingCountry = await Geo.findOne({ countryCode: countryCode.toUpperCase() });
    if (existingCountry) {
        throw new AppError('Country already exists', 400);
    }

    // Create country
    const country = await Geo.create({
        countryCode: countryCode.toUpperCase(),
        countryName,
        isShippingAvailable: isShippingAvailable !== undefined ? isShippingAvailable : true,
    });

    res.status(201).json({
        message: 'Country added successfully',
        country,
    });
});

/**
 * @swagger
 * /api/geo/countries:
 *   get:
 *     summary: Get all countries
 *     tags: [Geo]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isShippingAvailable
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Countries retrieved successfully
 */
export const getCountries = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filter: any = {};

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    if (req.query.isShippingAvailable !== undefined) {
        filter.isShippingAvailable = req.query.isShippingAvailable === 'true';
    }

    const countries = await Geo.find(filter).sort({ countryName: 1 });

    res.json({ countries });
});

/**
 * @swagger
 * /api/geo/countries/{code}:
 *   get:
 *     summary: Get country by code
 *     tags: [Geo]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Country retrieved successfully
 *       404:
 *         description: Country not found
 */
export const getCountryByCode = asyncHandler(async (req: AuthRequest, res: Response) => {
    const country = await Geo.findOne({ countryCode: req.params.code.toUpperCase() });

    if (!country) {
        throw new AppError('Country not found', 404);
    }

    res.json({ country });
});

/**
 * @swagger
 * /api/geo/countries/{code}:
 *   put:
 *     summary: Update country
 *     tags: [Geo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
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
 *         description: Country updated successfully
 */
export const updateCountry = asyncHandler(async (req: AuthRequest, res: Response) => {
    const updates = req.body;

    const country = await Geo.findOne({ countryCode: req.params.code.toUpperCase() });
    if (!country) {
        throw new AppError('Country not found', 404);
    }

    // Update country
    Object.assign(country, updates);
    await country.save();

    res.json({
        message: 'Country updated successfully',
        country,
    });
});

/**
 * @swagger
 * /api/geo/countries/{code}:
 *   delete:
 *     summary: Delete country
 *     tags: [Geo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Country deleted successfully
 */
export const deleteCountry = asyncHandler(async (req: AuthRequest, res: Response) => {
    const country = await Geo.findOneAndDelete({ countryCode: req.params.code.toUpperCase() });

    if (!country) {
        throw new AppError('Country not found', 404);
    }

    res.json({
        message: 'Country deleted successfully',
    });
});

/**
 * @swagger
 * /api/geo/countries/{code}/states:
 *   post:
 *     summary: Add states to country
 *     tags: [Geo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
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
 *               - states
 *             properties:
 *               states:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                     name:
 *                       type: string
 *     responses:
 *       200:
 *         description: States added successfully
 */
export const addStates = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { states } = req.body;

    const country = await Geo.findOne({ countryCode: req.params.code.toUpperCase() });
    if (!country) {
        throw new AppError('Country not found', 404);
    }

    if (!Array.isArray(states)) {
        throw new AppError('States must be an array', 400);
    }

    // Add states
    if (!country.states) {
        country.states = [];
    }

    states.forEach((state: any) => {
        const existing = country.states?.find((s) => s.code === state.code.toUpperCase());
        if (!existing) {
            country.states?.push({
                code: state.code.toUpperCase(),
                name: state.name,
                cities: state.cities || [],
            });
        }
    });

    await country.save();

    res.json({
        message: 'States added successfully',
        country,
    });
});

/**
 * @swagger
 * /api/geo/countries/{code}/states:
 *   get:
 *     summary: Get states for a country
 *     tags: [Geo]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: States retrieved successfully
 */
export const getStates = asyncHandler(async (req: AuthRequest, res: Response) => {
    const country = await Geo.findOne({ countryCode: req.params.code.toUpperCase() });

    if (!country) {
        throw new AppError('Country not found', 404);
    }

    res.json({
        countryCode: country.countryCode,
        countryName: country.countryName,
        states: country.states || [],
    });
});

/**
 * @swagger
 * /api/geo/countries/{code}/states/{stateCode}/cities:
 *   post:
 *     summary: Add cities to state
 *     tags: [Geo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: stateCode
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
 *               - cities
 *             properties:
 *               cities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cities added successfully
 */
export const addCities = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { cities } = req.body;

    const country = await Geo.findOne({ countryCode: req.params.code.toUpperCase() });
    if (!country) {
        throw new AppError('Country not found', 404);
    }

    const state = country.states?.find((s) => s.code === req.params.stateCode.toUpperCase());
    if (!state) {
        throw new AppError('State not found', 404);
    }

    if (!Array.isArray(cities)) {
        throw new AppError('Cities must be an array', 400);
    }

    // Add cities
    if (!state.cities) {
        state.cities = [];
    }

    cities.forEach((city: string) => {
        if (!state.cities?.includes(city)) {
            state.cities?.push(city);
        }
    });

    await country.save();

    res.json({
        message: 'Cities added successfully',
        state,
    });
});

/**
 * @swagger
 * /api/geo/countries/{code}/states/{stateCode}/cities:
 *   get:
 *     summary: Get cities for a state
 *     tags: [Geo]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: stateCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cities retrieved successfully
 */
export const getCities = asyncHandler(async (req: AuthRequest, res: Response) => {
    const country = await Geo.findOne({ countryCode: req.params.code.toUpperCase() });
    if (!country) {
        throw new AppError('Country not found', 404);
    }

    const state = country.states?.find((s) => s.code === req.params.stateCode.toUpperCase());
    if (!state) {
        throw new AppError('State not found', 404);
    }

    res.json({
        countryCode: country.countryCode,
        stateCode: state.code,
        stateName: state.name,
        cities: state.cities || [],
    });
});
