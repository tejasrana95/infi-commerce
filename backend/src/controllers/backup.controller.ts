import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import backupService from '../services/backup.service';
import restoreService from '../services/restore.service';
import mongoDbBackupService from '../services/mongodb-backup.service';
import fs from 'fs/promises';

/**
 * Export products to Excel
 */
export const exportProducts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { storeId, categoryId } = req.body;

        const buffer = await backupService.exportProducts({ storeId, categoryId });
        const filename = backupService.getExportFilename('products');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Export orders to Excel
 */
export const exportOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { storeId } = req.body;

        const buffer = await backupService.exportOrders({ storeId });
        const filename = backupService.getExportFilename('orders');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Export customers to Excel
 */
export const exportCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { storeId } = req.body;

        const buffer = await backupService.exportCustomers({ storeId });
        const filename = backupService.getExportFilename('customers');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Export categories to Excel
 */
export const exportCategories = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { storeId } = req.body;

        const buffer = await backupService.exportCategories({ storeId });
        const filename = backupService.getExportFilename('categories');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Export brands to Excel
 */
export const exportBrands = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { storeId } = req.body;

        const buffer = await backupService.exportBrands({ storeId });
        const filename = backupService.getExportFilename('brands');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Export coupons to Excel
 */
export const exportCoupons = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { storeId } = req.body;

        const buffer = await backupService.exportCoupons({ storeId });
        const filename = backupService.getExportFilename('coupons');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Export reviews to Excel
 */
export const exportReviews = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { storeId } = req.body;

        const buffer = await backupService.exportReviews({ storeId });
        const filename = backupService.getExportFilename('reviews');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Import products from Excel
 */
export const importProducts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const { storeId, categoryId } = req.body;
        const result = await restoreService.importProducts(req.file.buffer, { storeId, categoryId });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Import orders from Excel
 */
export const importOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const { storeId } = req.body;
        const result = await restoreService.importOrders(req.file.buffer, { storeId });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Import customers from Excel
 */
export const importCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const { storeId } = req.body;
        const result = await restoreService.importCustomers(req.file.buffer, { storeId });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Import categories from Excel
 */
export const importCategories = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const { storeId } = req.body;
        const result = await restoreService.importCategories(req.file.buffer, { storeId });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Import brands from Excel
 */
export const importBrands = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const { storeId } = req.body;
        const result = await restoreService.importBrands(req.file.buffer, { storeId });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Import coupons from Excel
 */
export const importCoupons = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const { storeId } = req.body;
        const result = await restoreService.importCoupons(req.file.buffer, { storeId });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Import reviews from Excel
 */
export const importReviews = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const { storeId } = req.body;
        const result = await restoreService.importReviews(req.file.buffer, { storeId });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Validate import file (dry run)
 */
export const validateImport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const { entity } = req.params;
        const result = await restoreService.validateImport(req.file.buffer, entity);

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Download MongoDB dump
 */
export const downloadDatabaseDump = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Check if tools are available
        const tools = await mongoDbBackupService.checkToolsAvailability();
        if (!tools.mongodump) {
            res.status(503).json({
                error: 'MongoDB dump tools not available',
                message: 'mongodump is not installed on this server. Please install MongoDB Database Tools.'
            });
            return;
        }

        // Create dump
        const dumpPath = await mongoDbBackupService.createDump();

        // Read file
        const buffer = await fs.readFile(dumpPath);

        // Send file
        const filename = `mongodb_dump_${new Date().toISOString().split('T')[0]}.archive.gz`;
        res.setHeader('Content-Type', 'application/gzip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);

        // Clean up old backups (keep last 10)
        await mongoDbBackupService.cleanupOldBackups(10);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Restore MongoDB from dump
 */
export const restoreDatabaseDump = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        // Check if tools are available
        const tools = await mongoDbBackupService.checkToolsAvailability();
        if (!tools.mongorestore) {
            res.status(503).json({
                error: 'MongoDB restore tools not available',
                message: 'mongorestore is not installed on this server. Please install MongoDB Database Tools.'
            });
            return;
        }

        // Save uploaded file temporarily
        const tempPath = await mongoDbBackupService.saveTempDumpFile(req.file.buffer);

        try {
            // Restore database
            await mongoDbBackupService.restoreDump(tempPath);

            res.json({
                success: true,
                message: 'Database restored successfully'
            });

            // Clean up temp file
            await fs.unlink(tempPath);
        } catch (error) {
            // Clean up temp file even if restore failed
            await fs.unlink(tempPath).catch(() => { });
            throw error;
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Check MongoDB tools availability
 */
export const checkMongoDbTools = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tools = await mongoDbBackupService.checkToolsAvailability();
        res.json(tools);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * List available backups
 */
export const listBackups = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const backups = await mongoDbBackupService.listBackups();
        res.json(backups);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
