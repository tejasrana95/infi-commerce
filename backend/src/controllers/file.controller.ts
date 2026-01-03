import { Response } from 'express';
import { body, param, query } from 'express-validator';
import sharp from 'sharp';
import File from '../models/File';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import { storageService } from '../services/storage';
import { generateUniqueFilename } from '../middleware/upload';
import { sanitizePath, validateFolderName, getFileCategory, validateFileSize } from '../middleware/fileValidation';
import path from 'path';

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload file(s)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               folder:
 *                 type: string
 *                 default: /
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 */
export const uploadFiles = asyncHandler(async (req: AuthRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
        throw new AppError('No files provided', 400);
    }

    // Validate file sizes (after multer has buffered them)
    for (const file of files) {
        if (!validateFileSize(file)) {
            throw new AppError(`File ${file.originalname} exceeds the allowed size limit`, 400);
        }
    }

    const folder = sanitizePath(req.body.folder || '/');
    const uploadedFiles = [];
    const provider = storageService.getStorageProvider();

    // Process files (convert images to WebP)
    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check if file is an image and not already webp or svg
        if (file.mimetype.startsWith('image/') &&
            !file.mimetype.includes('webp') &&
            !file.mimetype.includes('svg')) {

            try {
                // Convert to WebP
                const compressedBuffer = await sharp(file.buffer)
                    .webp({ quality: 80 }) // Good balance of quality and size
                    .toBuffer();

                // Update file properties
                files[i].buffer = compressedBuffer;
                files[i].mimetype = 'image/webp';
                files[i].size = compressedBuffer.length;

                // Update original name to end with .webp
                const nameWithoutExt = path.basename(file.originalname, path.extname(file.originalname));
                files[i].originalname = `${nameWithoutExt}.webp`;

            } catch (error) {
                console.error(`Error converting image ${file.originalname} to WebP:`, error);
                // Continue with original file if conversion fails
            }
        }
    }

    for (const file of files) {
        // Generate unique filename
        const uniqueFilename = generateUniqueFilename(file.originalname);
        const relativePath = path.join(folder, uniqueFilename);

        // Upload to storage
        await provider.upload(file.buffer, relativePath, file.mimetype, file.originalname);

        // Get public URL
        const url = await provider.getUrl(relativePath);

        // Save to database
        const fileDoc = await File.create({
            originalName: file.originalname,
            filename: uniqueFilename,
            path: relativePath,
            folder,
            url,
            mimeType: file.mimetype,
            size: file.size,
            type: 'file',
            category: getFileCategory(file.mimetype),
            uploadedBy: req.user!.id,
            store: req.body.store,
        });

        uploadedFiles.push(fileDoc);
    }

    res.status(201).json({
        message: 'Files uploaded successfully',
        files: uploadedFiles,
    });
});

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: List files and folders
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *           default: /
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [file, folder]
 *     responses:
 *       200:
 *         description: Files retrieved successfully
 */
export const listFiles = asyncHandler(async (req: AuthRequest, res: Response) => {
    const folder = sanitizePath((req.query.folder as string) || '/');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const type = req.query.type as string;

    const skip = (page - 1) * limit;

    // Build query
    const query: any = { folder };

    if (type) {
        query.type = type;
    }

    if (search) {
        query.$or = [
            { originalName: { $regex: search, $options: 'i' } },
            { filename: { $regex: search, $options: 'i' } },
        ];
    }

    // Get files from database
    const [files, total] = await Promise.all([
        File.find(query)
            .sort({ type: -1, originalName: 1 }) // Folders first, then alphabetically
            .skip(skip)
            .limit(limit)
            .populate('uploadedBy', 'name email'),
        File.countDocuments(query),
    ]);

    res.json({
        files,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    });
});

/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     summary: Get file by ID
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File retrieved successfully
 */
export const getFileById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const file = await File.findById(req.params.id).populate('uploadedBy', 'name email');

    if (!file) {
        throw new AppError('File not found', 404);
    }

    res.json({ file });
});

/**
 * @swagger
 * /api/files/{id}/rename:
 *   put:
 *     summary: Rename file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newName:
 *                 type: string
 *     responses:
 *       200:
 *         description: File renamed successfully
 */
export const renameFile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { newName } = req.body;
    const file = await File.findById(req.params.id);

    if (!file) {
        throw new AppError('File not found', 404);
    }

    if (file.type === 'folder') {
        throw new AppError('Use folder rename endpoint for folders', 400);
    }

    const provider = storageService.getStorageProvider();
    const ext = path.extname(file.filename);
    const newFilename = generateUniqueFilename(newName + ext);
    const newPath = path.join(file.folder, newFilename);

    // Rename in storage
    await provider.rename(file.path, newPath);

    // Update database
    file.originalName = newName + ext;
    file.filename = newFilename;
    file.path = newPath;
    file.url = await provider.getUrl(newPath);
    await file.save();

    res.json({
        message: 'File renamed successfully',
        file,
    });
});

/**
 * @swagger
 * /api/files/{id}:
 *   delete:
 *     summary: Delete file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 */
export const deleteFile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const file = await File.findById(req.params.id);

    if (!file) {
        throw new AppError('File not found', 404);
    }

    if (file.type === 'folder') {
        throw new AppError('Use folder delete endpoint for folders', 400);
    }

    const provider = storageService.getStorageProvider();

    // Delete from storage
    await provider.delete(file.path);

    // Delete from database
    await file.deleteOne();

    res.json({ message: 'File deleted successfully' });
});

/**
 * @swagger
 * /api/files/{id}/move:
 *   post:
 *     summary: Move file to different folder
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetFolder:
 *                 type: string
 *     responses:
 *       200:
 *         description: File moved successfully
 */
export const moveFile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { targetFolder } = req.body;
    const file = await File.findById(req.params.id);

    if (!file) {
        throw new AppError('File not found', 404);
    }

    if (file.type === 'folder') {
        throw new AppError('Cannot move folders yet', 400);
    }

    const sanitizedTargetFolder = sanitizePath(targetFolder);
    const provider = storageService.getStorageProvider();
    const newPath = path.join(sanitizedTargetFolder, file.filename);

    // Move in storage
    await provider.move(file.path, newPath);

    // Update database
    file.folder = sanitizedTargetFolder;
    file.path = newPath;
    file.url = await provider.getUrl(newPath);
    await file.save();

    res.json({
        message: 'File moved successfully',
        file,
    });
});

// ==================== FOLDER OPERATIONS ====================

/**
 * @swagger
 * /api/files/folders:
 *   post:
 *     summary: Create new folder
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               path:
 *                 type: string
 *                 default: /
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Folder created successfully
 */
export const createFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { path: parentPath, name } = req.body;

    if (!name || !validateFolderName(name)) {
        throw new AppError('Invalid folder name. Use only alphanumeric, hyphens, and underscores', 400);
    }

    const sanitizedParentPath = sanitizePath(parentPath || '/');
    const folderPath = path.join(sanitizedParentPath, name);

    // Check if folder already exists
    const existing = await File.findOne({ path: folderPath, type: 'folder' });
    if (existing) {
        throw new AppError('Folder already exists', 400);
    }

    const provider = storageService.getStorageProvider();

    // Create folder in storage
    await provider.createFolder(folderPath);

    // Create folder in database
    const folder = await File.create({
        originalName: name,
        filename: name,
        path: folderPath,
        folder: sanitizedParentPath,
        url: await provider.getUrl(folderPath),
        type: 'folder',
        uploadedBy: req.user!.id,
        store: req.body.store,
    });

    res.status(201).json({
        message: 'Folder created successfully',
        folder,
    });
});

/**
 * @swagger
 * /api/files/folders/{id}/rename:
 *   put:
 *     summary: Rename folder
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Folder renamed successfully
 */
export const renameFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { newName } = req.body;
    const folder = await File.findById(req.params.id);

    if (!folder || folder.type !== 'folder') {
        throw new AppError('Folder not found', 404);
    }

    if (!validateFolderName(newName)) {
        throw new AppError('Invalid folder name', 400);
    }

    const provider = storageService.getStorageProvider();
    const newPath = path.join(folder.folder, newName);

    // Rename folder in storage
    await provider.renameFolder(folder.path, newPath);

    // Update all files in this folder
    await File.updateMany(
        { folder: folder.path },
        { $set: { folder: newPath } }
    );

    // Update folder itself
    folder.originalName = newName;
    folder.filename = newName;
    folder.path = newPath;
    folder.url = await provider.getUrl(newPath);
    await folder.save();

    res.json({
        message: 'Folder renamed successfully',
        folder,
    });
});

/**
 * @swagger
 * /api/files/folders/{id}:
 *   delete:
 *     summary: Delete folder
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: recursive
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Folder deleted successfully
 */
export const deleteFolder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const folder = await File.findById(req.params.id);

    if (!folder || folder.type !== 'folder') {
        throw new AppError('Folder not found', 404);
    }

    const recursive = req.query.recursive === 'true';
    const provider = storageService.getStorageProvider();

    // Check if folder has contents
    const contents = await File.find({ folder: folder.path });

    if (contents.length > 0 && !recursive) {
        throw new AppError('Folder is not empty. Use recursive=true to delete all contents', 400);
    }

    // Delete folder from storage
    await provider.deleteFolder(folder.path, recursive);

    if (recursive) {
        // Delete all files in folder from database
        await File.deleteMany({ folder: folder.path });
    }

    // Delete folder from database
    await folder.deleteOne();

    res.json({ message: 'Folder deleted successfully' });
});

/**
 * @swagger
 * /api/files/folders/{id}/contents:
 *   get:
 *     summary: Get folder contents
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Folder contents retrieved successfully
 */
export const getFolderContents = asyncHandler(async (req: AuthRequest, res: Response) => {
    const folder = await File.findById(req.params.id);

    if (!folder || folder.type !== 'folder') {
        throw new AppError('Folder not found', 404);
    }

    const contents = await File.find({ folder: folder.path })
        .sort({ type: -1, originalName: 1 })
        .populate('uploadedBy', 'name email');

    res.json({
        folder,
        contents,
    });
});

// Validation rules
export const uploadValidation = [
    body('folder').optional().trim(),
    body('store').optional().isMongoId(),
];

export const renameValidation = [
    param('id').isMongoId(),
    body('newName').trim().notEmpty(),
];

export const deleteValidation = [
    param('id').isMongoId(),
];

export const moveValidation = [
    param('id').isMongoId(),
    body('targetFolder').trim().notEmpty(),
];

export const createFolderValidation = [
    body('path').optional().trim(),
    body('name').trim().notEmpty(),
    body('store').optional().isMongoId(),
];

export const renameFolderValidation = [
    param('id').isMongoId(),
    body('newName').trim().notEmpty(),
];

export const deleteFolderValidation = [
    param('id').isMongoId(),
    query('recursive').optional().isBoolean(),
];

export const getFolderContentsValidation = [
    param('id').isMongoId(),
];

/**
 * @swagger
 * /api/files/sync:
 *   post:
 *     summary: Sync filesystem with database
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     description: Scans the upload directory and syncs with database - adds missing files and removes deleted ones
 *     responses:
 *       200:
 *         description: Sync completed successfully
 */
export const syncFilesystem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const provider = storageService.getStorageProvider();
    const stats = {
        filesAdded: 0,
        filesRemoved: 0,
        foldersAdded: 0,
        foldersRemoved: 0,
        errors: [] as string[],
    };

    try {
        // Get all files from database
        const dbFiles = await File.find({ type: 'file' });
        const dbFolders = await File.find({ type: 'folder' });

        // Create maps for quick lookup
        const dbFileMap = new Map(dbFiles.map(f => [f.path, f]));
        const dbFolderMap = new Map(dbFolders.map(f => [f.path, f]));

        // Recursively scan filesystem
        const scannedFiles = new Set<string>();
        const scannedFolders = new Set<string>();

        const scanDirectory = async (dirPath: string) => {
            try {
                const items = await provider.list(dirPath);

                for (const item of items) {
                    if (item.type === 'folder') {
                        scannedFolders.add(item.path);

                        // Check if folder exists in DB
                        if (!dbFolderMap.has(item.path)) {
                            // Add missing folder to DB
                            try {
                                await File.create({
                                    originalName: item.filename,
                                    filename: item.filename,
                                    path: item.path,
                                    folder: item.folder,
                                    url: item.url,
                                    type: 'folder',
                                    uploadedBy: req.user!.id,
                                });
                                stats.foldersAdded++;
                            } catch (error: any) {
                                stats.errors.push(`Failed to add folder ${item.path}: ${error.message}`);
                            }
                        }

                        // Recursively scan subfolder
                        await scanDirectory(item.path);
                    } else {
                        scannedFiles.add(item.path);

                        // Check if file exists in DB
                        if (!dbFileMap.has(item.path)) {
                            // Add missing file to DB
                            try {
                                await File.create({
                                    originalName: item.originalName,
                                    filename: item.filename,
                                    path: item.path,
                                    folder: item.folder,
                                    url: item.url,
                                    mimeType: item.mimeType,
                                    size: item.size,
                                    type: 'file',
                                    category: item.mimeType ? getFileCategory(item.mimeType) : 'other',
                                    uploadedBy: req.user!.id,
                                });
                                stats.filesAdded++;
                            } catch (error: any) {
                                stats.errors.push(`Failed to add file ${item.path}: ${error.message}`);
                            }
                        }
                    }
                }
            } catch (error: any) {
                stats.errors.push(`Failed to scan directory ${dirPath}: ${error.message}`);
            }
        };

        // Start scanning from root
        await scanDirectory('/');

        // Update URLs for existing files if they have incorrect domain
        let urlsUpdated = 0;
        for (const dbFile of dbFiles) {
            if (scannedFiles.has(dbFile.path)) {
                // File exists, check if URL needs updating
                const correctUrl = await provider.getUrl(dbFile.path);
                if (dbFile.url !== correctUrl) {
                    try {
                        dbFile.url = correctUrl;
                        await dbFile.save();
                        urlsUpdated++;
                    } catch (error: any) {
                        stats.errors.push(`Failed to update URL for ${dbFile.path}: ${error.message}`);
                    }
                }
            }
        }

        // Update URLs for existing folders if they have incorrect domain
        for (const dbFolder of dbFolders) {
            if (scannedFolders.has(dbFolder.path)) {
                // Folder exists, check if URL needs updating
                const correctUrl = await provider.getUrl(dbFolder.path);
                if (dbFolder.url !== correctUrl) {
                    try {
                        dbFolder.url = correctUrl;
                        await dbFolder.save();
                        urlsUpdated++;
                    } catch (error: any) {
                        stats.errors.push(`Failed to update URL for ${dbFolder.path}: ${error.message}`);
                    }
                }
            }
        }

        // Add urlsUpdated to stats
        (stats as any).urlsUpdated = urlsUpdated;

        // Remove files from DB that no longer exist in filesystem
        for (const dbFile of dbFiles) {
            if (!scannedFiles.has(dbFile.path)) {
                try {
                    await dbFile.deleteOne();
                    stats.filesRemoved++;
                } catch (error: any) {
                    stats.errors.push(`Failed to remove file ${dbFile.path}: ${error.message}`);
                }
            }
        }

        // Remove folders from DB that no longer exist in filesystem
        for (const dbFolder of dbFolders) {
            if (!scannedFolders.has(dbFolder.path)) {
                try {
                    await dbFolder.deleteOne();
                    stats.foldersRemoved++;
                } catch (error: any) {
                    stats.errors.push(`Failed to remove folder ${dbFolder.path}: ${error.message}`);
                }
            }
        }

        res.json({
            message: 'Filesystem sync completed',
            stats,
        });
    } catch (error: any) {
        throw new AppError(`Sync failed: ${error.message}`, 500);
    }
});
