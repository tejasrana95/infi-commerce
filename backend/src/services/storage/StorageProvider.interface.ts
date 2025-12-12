export interface FileInfo {
    id: string;
    originalName: string;
    filename: string;
    path: string;
    folder: string;
    url: string;
    mimeType?: string;
    size?: number;
    type: 'file' | 'folder';
    category?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface IStorageProvider {
    // File operations
    upload(file: Buffer, path: string, mimeType: string, originalName: string): Promise<string>;
    delete(path: string): Promise<void>;
    rename(oldPath: string, newPath: string): Promise<void>;
    move(sourcePath: string, destPath: string): Promise<void>;
    getUrl(path: string): Promise<string>;
    exists(path: string): Promise<boolean>;

    // Folder operations
    createFolder(path: string): Promise<void>;
    deleteFolder(path: string, recursive?: boolean): Promise<void>;
    renameFolder(oldPath: string, newPath: string): Promise<void>;

    // Listing
    list(directory: string): Promise<FileInfo[]>;
}
