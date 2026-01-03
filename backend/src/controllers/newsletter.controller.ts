import { Response } from 'express';
import { body } from 'express-validator';
import NewsletterSubscriber from '../models/NewsletterSubscriber';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

export const subscribe = asyncHandler(async (req: any, res: Response) => {
    const { email } = req.body;
    const storeId = req.headers['x-store-id'] || req.body.storeId;

    if (!storeId) {
        throw new AppError('Store ID is required', 400);
    }

    if (!email) {
        throw new AppError('Email is required', 400);
    }

    // Check if already exists for this store
    const existing = await NewsletterSubscriber.findOne({ email, storeId });
    if (existing) {
        if (existing.status === 'subscribed') {
            return res.status(200).json({ message: 'Already subscribed' });
        } else {
            // Re-subscribe
            existing.status = 'subscribed';
            await existing.save();
            return res.status(200).json({ message: 'Subscription updated successfully' });
        }
    }

    const subscriber = new NewsletterSubscriber({
        email,
        storeId,
        status: 'subscribed',
    });

    await subscriber.save();

    return res.status(201).json({
        message: 'Subscribed successfully',
        subscriber,
    });
});

export const getSubscribers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, search, page = 1, limit = 50 } = req.query;

    const filter: any = {};
    if (storeId) {
        filter.storeId = storeId;
    }

    if (search) {
        filter.email = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [subscribers, total] = await Promise.all([
        NewsletterSubscriber.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('storeId', 'name'),
        NewsletterSubscriber.countDocuments(filter),
    ]);

    res.json({
        subscribers,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
    });
});

export const deleteSubscriber = asyncHandler(async (req: AuthRequest, res: Response) => {
    const subscriber = await NewsletterSubscriber.findById(req.params.id);
    if (!subscriber) {
        throw new AppError('Subscriber not found', 404);
    }

    await subscriber.deleteOne();

    res.json({ message: 'Subscriber deleted successfully' });
});

export const deleteAllSubscribers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId } = req.body;

    if (!storeId) {
        throw new AppError('Store ID is required to delete all subscribers', 400);
    }

    await NewsletterSubscriber.deleteMany({ storeId });

    res.json({ message: 'All subscribers for this store deleted successfully' });
});

export const exportSubscribers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, search } = req.query;

    const filter: any = {};
    if (storeId) {
        filter.storeId = storeId;
    }

    if (search) {
        filter.email = { $regex: search, $options: 'i' };
    }

    const subscribers = await NewsletterSubscriber.find(filter)
        .sort({ createdAt: -1 })
        .populate('storeId', 'name');

    // Generate CSV
    const headers = ['Email', 'Store', 'Status', 'Subscribed At'];
    const rows = subscribers.map(sub => [
        sub.email,
        (sub.storeId as any)?.name || 'N/A',
        sub.status,
        sub.createdAt.toISOString(),
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=subscribers.csv');
    res.status(200).send(csvContent);
});

export const subscribeValidation = [
    body('email').isEmail().withMessage('Please provide a valid email address'),
];
