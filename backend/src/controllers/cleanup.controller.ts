import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/validation';
import ChatHistory from '../models/ChatHistory';
import UserInterest from '../models/UserInterest';

/**
 * Cron cleanup endpoint
 * POST /api/cleanup
 * 
 * Clears:
 * - Chat history older than 10 days
 * - User interests older than 30 days
 * 
 * Should be called by a scheduled cron job (e.g., daily at midnight)
 */
export const runCleanup = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const now = new Date();

    // Calculate cutoff dates
    const chatHistoryCutoff = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const userInterestCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Delete old chat histories
    const chatResult = await ChatHistory.deleteMany({
        updatedAt: { $lt: chatHistoryCutoff }
    });

    // Delete old user interests
    const interestResult = await UserInterest.deleteMany({
        updatedAt: { $lt: userInterestCutoff }
    });

    console.log(`[Cleanup] Deleted ${chatResult.deletedCount} chat histories and ${interestResult.deletedCount} user interests`);

    res.json({
        success: true,
        message: 'Cleanup completed successfully',
        deleted: {
            chatHistories: chatResult.deletedCount,
            userInterests: interestResult.deletedCount
        },
        cutoffs: {
            chatHistory: chatHistoryCutoff.toISOString(),
            userInterest: userInterestCutoff.toISOString()
        }
    });
});
