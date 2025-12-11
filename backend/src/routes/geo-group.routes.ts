import { Router } from 'express';
import {
    createGeoGroup,
    getGeoGroups,
    getGeoGroupById,
    updateGeoGroup,
    deleteGeoGroup,
    addCountries,
    removeCountry,
    createGeoGroupValidation,
} from '../controllers/geo-group.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All routes are admin-only for geo groups
router.post(
    '/',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    validate(createGeoGroupValidation),
    createGeoGroup
);

router.get(
    '/',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    getGeoGroups
);

router.get(
    '/:id',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    getGeoGroupById
);

router.put(
    '/:id',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    updateGeoGroup
);

router.delete(
    '/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    deleteGeoGroup
);

router.post(
    '/:id/countries',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    addCountries
);

router.delete(
    '/:id/countries/:code',
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    removeCountry
);

export default router;
