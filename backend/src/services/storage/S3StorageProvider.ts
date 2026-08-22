import { S3Client, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { IStorageProvider, FileInfo } from './StorageProvider.interface';

export class S3StorageProvider implements IStorageProvider {
    private s3Client: S3Client;
    private bucket: string;
    private region: string;
    private endpoint?: string;
    private publicUrl?: string;
    private forcePathStyle: boolean;

    constructor() {
        this.region = process.env.AWS_REGION || 'us-east-1';
        this.bucket = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME || '';
        this.endpoint = process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT_URL;
        this.forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';

        const rawPublicUrl = process.env.S3_PUBLIC_URL || process.env.AWS_CLOUDFRONT_URL;
        this.publicUrl = rawPublicUrl ? rawPublicUrl.replace(/\/+$/, '') : undefined;

        this.s3Client = new S3Client({
            region: this.region,
            endpoint: this.endpoint || undefined,
            forcePathStyle: this.forcePathStyle,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
        });
    }

    private sanitizePath(path: string): string {
        // Remove leading slashes and sanitize
        return path.replace(/^\/+/, '').replace(/\.\./g, '');
    }

    async upload(file: Buffer, relativePath: string, mimeType: string, originalName: string): Promise<string> {
        const key = this.sanitizePath(relativePath);

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file,
            ContentType: mimeType,
            Metadata: {
                originalName: originalName,
            },
        });

        await this.s3Client.send(command);
        return key;
    }

    async delete(relativePath: string): Promise<void> {
        const key = this.sanitizePath(relativePath);

        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        await this.s3Client.send(command);
    }

    async rename(oldPath: string, newPath: string): Promise<void> {
        // S3 doesn't have rename, so copy then delete
        await this.copy(oldPath, newPath);
        await this.delete(oldPath);
    }

    private async copy(sourcePath: string, destPath: string): Promise<void> {
        const sourceKey = this.sanitizePath(sourcePath);
        const destKey = this.sanitizePath(destPath);

        const command = new CopyObjectCommand({
            Bucket: this.bucket,
            CopySource: encodeURI(`${this.bucket}/${sourceKey}`),
            Key: destKey,
        });

        await this.s3Client.send(command);
    }

    async move(sourcePath: string, destPath: string): Promise<void> {
        return this.rename(sourcePath, destPath);
    }

    async getUrl(relativePath: string): Promise<string> {
        const key = this.sanitizePath(relativePath);

        if (this.publicUrl) {
            return `${this.publicUrl}/${key}`;
        }

        if (this.endpoint) {
            const cleanEndpoint = this.endpoint.replace(/\/+$/, '');
            if (this.forcePathStyle) {
                return `${cleanEndpoint}/${this.bucket}/${key}`;
            }
            return `${cleanEndpoint}/${key}`;
        }

        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    }

    async exists(relativePath: string): Promise<boolean> {
        try {
            const key = this.sanitizePath(relativePath);
            const command = new HeadObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            await this.s3Client.send(command);
            return true;
        } catch {
            return false;
        }
    }

    async createFolder(relativePath: string): Promise<void> {
        // S3 doesn't have real folders, but we can create a marker object
        const key = this.sanitizePath(relativePath);
        const folderKey = key.endsWith('/') ? key : `${key}/`;

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: folderKey,
            Body: '',
        });

        await this.s3Client.send(command);
    }

    async deleteFolder(relativePath: string, recursive: boolean = false): Promise<void> {
        const prefix = this.sanitizePath(relativePath);
        const folderPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

        if (!recursive) {
            // Check if folder has contents
            const contents = await this.list(relativePath);
            if (contents.length > 0) {
                throw new Error('Folder is not empty. Use recursive option to delete.');
            }
        }

        // List all objects with this prefix
        const listCommand = new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: folderPrefix,
        });

        const { Contents } = await this.s3Client.send(listCommand);

        if (Contents && Contents.length > 0) {
            // Delete all objects
            for (const object of Contents) {
                if (object.Key) {
                    await this.delete(object.Key);
                }
            }
        }

        // Delete the folder marker itself
        await this.delete(folderPrefix);
    }

    async renameFolder(oldPath: string, newPath: string): Promise<void> {
        const oldPrefix = this.sanitizePath(oldPath);
        const newPrefix = this.sanitizePath(newPath);
        const oldFolderPrefix = oldPrefix.endsWith('/') ? oldPrefix : `${oldPrefix}/`;
        const newFolderPrefix = newPrefix.endsWith('/') ? newPrefix : `${newPrefix}/`;

        // List all objects with old prefix
        const listCommand = new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: oldFolderPrefix,
        });

        const { Contents } = await this.s3Client.send(listCommand);

        if (Contents && Contents.length > 0) {
            // Copy all objects to new location
            for (const object of Contents) {
                if (object.Key) {
                    const newKey = object.Key.replace(oldFolderPrefix, newFolderPrefix);
                    await this.copy(object.Key, newKey);
                }
            }

            // Delete old objects
            for (const object of Contents) {
                if (object.Key) {
                    await this.delete(object.Key);
                }
            }
        }
    }

    async list(directory: string): Promise<FileInfo[]> {
        const prefix = this.sanitizePath(directory);
        const folderPrefix = prefix ? (prefix.endsWith('/') ? prefix : `${prefix}/`) : '';

        const command = new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: folderPrefix,
            Delimiter: '/', // Only list immediate children
        });

        const response = await this.s3Client.send(command);
        const files: FileInfo[] = [];

        // Add folders (CommonPrefixes)
        if (response.CommonPrefixes) {
            for (const prefix of response.CommonPrefixes) {
                if (prefix.Prefix) {
                    const folderName = prefix.Prefix.replace(folderPrefix, '').replace('/', '');
                    files.push({
                        id: prefix.Prefix,
                        originalName: folderName,
                        filename: folderName,
                        path: prefix.Prefix,
                        folder: directory,
                        url: await this.getUrl(prefix.Prefix),
                        type: 'folder',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
            }
        }

        // Add files (Contents)
        if (response.Contents) {
            for (const object of response.Contents) {
                if (object.Key && object.Key !== folderPrefix) {
                    const filename = object.Key.replace(folderPrefix, '');
                    files.push({
                        id: object.Key,
                        originalName: filename,
                        filename: filename,
                        path: object.Key,
                        folder: directory,
                        url: await this.getUrl(object.Key),
                        type: 'file',
                        size: object.Size,
                        createdAt: object.LastModified || new Date(),
                        updatedAt: object.LastModified || new Date(),
                    });
                }
            }
        }

        return files;
    }
}
