import { Router } from 'express';
import {
    createCurrency,
    getCurrencies,
    getCurrencyByCode,
    updateCurrency,
    deleteCurrency,
    convertCurrency,
    updateExchangeRate,
    getBaseCurrency,
    createCurrencyValidation,
} from '../controllers/currency.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes
router.get('/', getCurrencies);
router.get('/base', getBaseCurrency);
router.get('/:code', getCurrencyByCode);
router.post('/convert', convertCurrency);

// Protected routes (admin only)
router.post(
    '/',
    authenticate,
    authorize('admin', 'super_admin'),
    validate(createCurrencyValidation),
    createCurrency
);

router.put(
    '/:code',
    authenticate,
    authorize('admin', 'super_admin'),
    updateCurrency
);

router.delete(
    '/:code',
    authenticate,
    authorize('admin', 'super_admin'),
    deleteCurrency
);

router.put(
    '/:code/rate',
    authenticate,
    authorize('admin', 'super_admin'),
    updateExchangeRate
);

export default router;
