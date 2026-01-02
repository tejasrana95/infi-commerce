import fs from 'fs/promises';
import path from 'path';
import { IStorageProvider, FileInfo } from './StorageProvider.interface';
import { config } from '../../config';

export class LocalStorageProvider implements IStorageProvider {
    private baseDir: string;
    private baseUrl: string;

    constructor() {
        // Upload directory outside project root for security
        this.baseDir = process.env.UPLOAD_DIR || path.join(process.cwd(), '..', 'uploads');
        this.baseUrl = config.apiUrl; // Use API URL from config
    }

    private getFullPath(relativePath: string): string {
        // Sanitize path to prevent directory traversal
        const sanitized = relativePath
            .replace(/\.\./g, '')  // Remove ..
            .replace(/^\/+/, '')    // Remove leading slashes
            .replace(/\/+/g, '/');  // Normalize multiple slashes

        // If sanitized is empty (was just '/'), return baseDir
        if (!sanitized || sanitized === '/') {
            return this.baseDir;
        }

        return path.join(this.baseDir, sanitized);
    }



    async upload(file: Buffer, relativePath: string): Promise<string> {
        const fullPath = this.getFullPath(relativePath);
        const dir = path.dirname(fullPath);

        // Ensure directory exists
        await fs.mkdir(dir, { recursive: true });

        // Write file
        await fs.writeFile(fullPath, file);

        return relativePath;
    }

    async delete(relativePath: string): Promise<void> {
        const fullPath = this.getFullPath(relativePath);
        await fs.unlink(fullPath);
    }

    async rename(oldPath: string, newPath: string): Promise<void> {
        const oldFullPath = this.getFullPath(oldPath);
        const newFullPath = this.getFullPath(newPath);

        // Ensure new directory exists
        const newDir = path.dirname(newFullPath);
        await fs.mkdir(newDir, { recursive: true });

        await fs.rename(oldFullPath, newFullPath);
    }

    async move(sourcePath: string, destPath: string): Promise<void> {
        return this.rename(sourcePath, destPath);
    }

    async getUrl(relativePath: string): Promise<string> {
        const hasSlash = relativePath.startsWith('/');
        // Return CDN URL
        return `${this.baseUrl}/uploads${hasSlash ? relativePath : `/${relativePath}`}`;
    }

    async exists(relativePath: string): Promise<boolean> {
        try {
            const fullPath = this.getFullPath(relativePath);
            await fs.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    async createFolder(relativePath: string): Promise<void> {
        const fullPath = this.getFullPath(relativePath);
        await fs.mkdir(fullPath, { recursive: true });
    }

    async deleteFolder(relativePath: string, recursive: boolean = false): Promise<void> {
        const fullPath = this.getFullPath(relativePath);

        if (recursive) {
            await fs.rm(fullPath, { recursive: true, force: true });
        } else {
            // Check if folder is empty
            const contents = await fs.readdir(fullPath);
            if (contents.length > 0) {
                throw new Error('Folder is not empty. Use recursive option to delete.');
            }
            await fs.rmdir(fullPath);
        }
    }

    async renameFolder(oldPath: string, newPath: string): Promise<void> {
        return this.rename(oldPath, newPath);
    }

    async list(directory: string): Promise<FileInfo[]> {
        const fullPath = this.getFullPath(directory);
        const files: FileInfo[] = [];

        try {
            // Ensure directory exists
            await fs.mkdir(fullPath, { recursive: true });

            const entries = await fs.readdir(fullPath, { withFileTypes: true });

            for (const entry of entries) {
                // Normalize the path - ensure it starts with /
                const normalizedDir = directory.startsWith('/') ? directory : `/${directory}`;
                const entryRelativePath = normalizedDir === '/'
                    ? `/${entry.name}`
                    : `${normalizedDir}/${entry.name}`;

                const fullEntryPath = path.join(fullPath, entry.name);

                if (entry.isDirectory()) {
                    files.push({
                        id: entryRelativePath,
                        originalName: entry.name,
                        filename: entry.name,
                        path: entryRelativePath,
                        folder: normalizedDir,
                        url: await this.getUrl(entryRelativePath),
                        type: 'folder',
                        createdAt: (await fs.stat(fullEntryPath)).birthtime,
                        updatedAt: (await fs.stat(fullEntryPath)).mtime,
                    });
                } else {
                    const stats = await fs.stat(fullEntryPath);
                    // Simple mimeType detection based on extension
                    const ext = path.extname(entry.name).toLowerCase();
                    let mimeType = 'application/octet-stream';
                    if (['.jpg', '.jpeg'].includes(ext)) mimeType = 'image/jpeg';
                    else if (ext === '.png') mimeType = 'image/png';
                    else if (ext === '.gif') mimeType = 'image/gif';
                    else if (ext === '.webp') mimeType = 'image/webp';
                    else if (ext === '.svg') mimeType = 'image/svg+xml';
                    else if (ext === '.pdf') mimeType = 'application/pdf';

                    files.push({
                        id: entryRelativePath,
                        originalName: entry.name,
                        filename: entry.name,
                        path: entryRelativePath,
                        folder: normalizedDir,
                        url: await this.getUrl(entryRelativePath),
                        type: 'file',
                        size: stats.size,
                        mimeType,
                        createdAt: stats.birthtime,
                        updatedAt: stats.mtime,
                    });
                }
            }
        } catch (error) {
            // Directory doesn't exist or other error
            console.error(`Error listing directory ${directory}:`, error);
            return [];
        }

        return files;
    }
}
