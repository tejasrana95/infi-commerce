import { Router } from 'express';
import {
    registerCustomer,
    loginCustomer,
    refreshCustomerToken,
    getCustomerProfile,
    updateCustomerProfile,
    customerRegisterValidation,
    customerLoginValidation,
} from '../controllers/customer-auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validate(customerRegisterValidation), registerCustomer);
router.post('/login', validate(customerLoginValidation), loginCustomer);
router.post('/refresh', refreshCustomerToken);

// Protected routes (require customer authentication)
router.get('/me', authenticate, getCustomerProfile);
router.put('/me', authenticate, updateCustomerProfile);

export default router;
