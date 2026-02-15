import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { fileValidationMiddleware, sanitizeFilename } from './fileValidation';

// Memory storage - we'll handle file saving via StorageService
const storage = multer.memoryStorage();

// Multer configuration
export const upload = multer({
    storage,
    fileFilter: fileValidationMiddleware as multer.Options['fileFilter'],
    limits: {
        fileSize: 200 * 1024 * 1024, // 50MB max
        files: 100, // Max 10 files at once
    },
});

// Generate unique filename
export const generateUniqueFilename = (originalName: string): string => {
    const sanitized = sanitizeFilename(originalName);
    const ext = path.extname(sanitized);
    const nameWithoutExt = path.basename(sanitized, ext);
    const uniqueId = crypto.randomUUID().split('-')[0]; // First part of UUID

    return `${nameWithoutExt}-${uniqueId}${ext}`;
};
