export interface FileItem {
    _id: string;
    originalName: string;
    filename: string;
    path: string;
    folder: string;
    url: string;
    mimeType?: string;
    size?: number;
    type: 'file' | 'folder';
    category?: 'image' | 'document' | 'product' | 'other';
    uploadedBy?: {
        _id: string;
        name: string;
        email: string;
    };
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}
