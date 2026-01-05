import multer from 'multer';
import { AppError } from './validation';

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/vnd.microsoft.icon'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_ARCHIVE_TYPES = ['application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed'];

const ALL_ALLOWED_TYPES = [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_DOCUMENT_TYPES,
    ...ALLOWED_ARCHIVE_TYPES,
];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_ARCHIVE_SIZE = 50 * 1024 * 1024; // 50MB

export const validateFileType = (file: Express.Multer.File): boolean => {
    return ALL_ALLOWED_TYPES.includes(file.mimetype);
};

export const validateFileSize = (file: Express.Multer.File): boolean => {
    const { mimetype, size } = file;
    if (ALLOWED_IMAGE_TYPES.includes(mimetype)) {
        return size <= MAX_IMAGE_SIZE;
    }

    if (ALLOWED_DOCUMENT_TYPES.includes(mimetype)) {
        return size <= MAX_DOCUMENT_SIZE;
    }

    if (ALLOWED_ARCHIVE_TYPES.includes(mimetype)) {
        return size <= MAX_ARCHIVE_SIZE;
    }

    return false;
};

export const sanitizeFilename = (filename: string): string => {
    // Remove special characters and spaces
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();
};

export const sanitizePath = (path: string): string => {
    // Prevent directory traversal and normalize path
    const sanitized = path
        .replace(/\.\./g, '')
        .replace(/\/+/g, '/')
        .trim();

    // Ensure path starts with / or return / for empty/root
    if (!sanitized || sanitized === '/') {
        return '/';
    }

    return sanitized.startsWith('/') ? sanitized : `/${sanitized}`;
};

export const validateFolderName = (name: string): boolean => {
    // Only allow alphanumeric, hyphens, underscores
    return /^[a-zA-Z0-9-_]+$/.test(name);
};

export const fileValidationMiddleware = (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    // Only validate file type here (size is not available yet in fileFilter)
    if (!validateFileType(file)) {
        return cb(new AppError(`File type ${file.mimetype} is not allowed`, 400) as any);
    }

    cb(null, true);
};

export const getFileCategory = (mimetype: string): string => {
    if (ALLOWED_IMAGE_TYPES.includes(mimetype)) return 'image';
    if (ALLOWED_DOCUMENT_TYPES.includes(mimetype)) return 'document';
    if (ALLOWED_ARCHIVE_TYPES.includes(mimetype)) return 'archive';
    return 'other';
};
