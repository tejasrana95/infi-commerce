import { Router } from 'express';
import {
    createCountry,
    getCountries,
    getCountryByCode,
    updateCountry,
    deleteCountry,
    addStates,
    getStates,
    addCities,
    getCities,
    createGeoValidation,
} from '../controllers/geo.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes
router.get('/countries', getCountries);
router.get('/countries/:code', getCountryByCode);
router.get('/countries/:code/states', getStates);
router.get('/countries/:code/states/:stateCode/cities', getCities);

// Protected routes (admin only)
router.post(
    '/countries',
    authenticate,
    authorize('admin', 'super_admin'),
    validate(createGeoValidation),
    createCountry
);

router.put(
    '/countries/:code',
    authenticate,
    authorize('admin', 'super_admin'),
    updateCountry
);

router.delete(
    '/countries/:code',
    authenticate,
    authorize('admin', 'super_admin'),
    deleteCountry
);

router.post(
    '/countries/:code/states',
    authenticate,
    authorize('admin', 'super_admin'),
    addStates
);

router.post(
    '/countries/:code/states/:stateCode/cities',
    authenticate,
    authorize('admin', 'super_admin'),
    addCities
);

export default router;
