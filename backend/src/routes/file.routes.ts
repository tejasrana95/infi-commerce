import { Router, RequestHandler } from 'express';
import {
    uploadFiles,
    listFiles,
    getFileById,
    renameFile,
    deleteFile,
    moveFile,
    createFolder,
    renameFolder,
    deleteFolder,
    getFolderContents,
    syncFilesystem,
    uploadValidation,
    renameValidation,
    deleteValidation,
    moveValidation,
    createFolderValidation,
    renameFolderValidation,
    deleteFolderValidation,
    getFolderContentsValidation,
} from '../controllers/file.controller';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { checkDemoMode } from '../middleware/checkDemoMode';

const router = Router();

// Sync endpoint
router.post('/sync', authenticate, syncFilesystem);

// File operations
router.post(
    '/upload',
    authenticate,
    checkDemoMode,
    upload.array('files', 10) as unknown as RequestHandler,
    uploadValidation,
    uploadFiles
);

router.get('/', listFiles);

router.get('/:id', getFileById);

router.put(
    '/:id/rename',
    authenticate,
    checkDemoMode,
    renameValidation,
    renameFile
);

router.delete(
    '/:id',
    authenticate,
    checkDemoMode,
    deleteValidation,
    deleteFile
);

router.post(
    '/:id/move',
    authenticate,
    moveValidation,
    moveFile
);

// Folder operations
router.post(
    '/folders',
    authenticate,
    checkDemoMode,
    createFolderValidation,
    createFolder
);

router.put(
    '/folders/:id/rename',
    authenticate,
    checkDemoMode,
    renameFolderValidation,
    renameFolder
);

router.delete(
    '/folders/:id',
    authenticate,
    checkDemoMode,
    deleteFolderValidation,
    deleteFolder
);

router.get(
    '/folders/:id/contents',
    getFolderContentsValidation,
    getFolderContents
);

export default router;
