import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
    originalName: string;
    filename: string;
    path: string;
    folder: string;
    url: string;
    mimeType: string;
    size: number;
    type: 'file' | 'folder';
    category?: 'image' | 'document' | 'product' | 'other';
    uploadedBy: mongoose.Types.ObjectId;
    store?: mongoose.Types.ObjectId;
    metadata?: {
        width?: number;
        height?: number;
        alt?: string;
        [key: string]: any;
    };
    createdAt: Date;
    updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
    {
        originalName: {
            type: String,
            required: true,
            trim: true,
        },
        filename: {
            type: String,
            required: true,
            trim: true,
        },
        path: {
            type: String,
            required: true,
            trim: true,
        },
        folder: {
            type: String,
            required: true,
            default: '/',
            trim: true,
        },
        url: {
            type: String,
            required: true,
        },
        mimeType: {
            type: String,
            required: function (this: IFile) {
                return this.type === 'file';
            },
        },
        size: {
            type: Number,
            required: function (this: IFile) {
                return this.type === 'file';
            },
            min: 0,
        },
        type: {
            type: String,
            enum: ['file', 'folder'],
            required: true,
            default: 'file',
        },
        category: {
            type: String,
            enum: ['image', 'document', 'product', 'other'],
        },
        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        store: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for performance
FileSchema.index({ folder: 1, type: 1 });
FileSchema.index({ uploadedBy: 1 });
FileSchema.index({ store: 1 });
FileSchema.index({ category: 1 });
FileSchema.index({ path: 1 }, { unique: true });

const File = mongoose.model<IFile>('File', FileSchema);

export default File;
