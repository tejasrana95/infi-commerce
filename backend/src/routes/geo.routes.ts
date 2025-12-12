import { Router } from 'express';
import {
    createGeo,
    getGeos,
    getGeoById,
    updateGeo,
    deleteGeo,
    getCountriesHierarchical,
    getStatesByCountry,
    getCitiesByState,
} from '../controllers/geo.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getGeos);
router.get('/countries', getCountriesHierarchical); // For backward compatibility with frontend
router.get('/:id', getGeoById);
router.get('/countries/:countryId/states', getStatesByCountry); // Get states for a country
router.get('/states/:stateId/cities', getCitiesByState); // Get cities for a state

// Protected routes (admin only)
router.post(
    '/',
    authenticate,
    authorize('admin', 'super_admin'),
    createGeo
);

router.put(
    '/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    updateGeo
);

router.delete(
    '/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    deleteGeo
);

export default router;
