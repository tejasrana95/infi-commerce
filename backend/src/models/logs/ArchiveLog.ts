import { Schema, Document } from 'mongoose';
import { getLogDbConnection } from '../../config/logDatabase';

export interface IArchiveLog extends Document {
    archiveName: string;
    rangeType: 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_6_months' | 'last_year' | 'all_time' | 'custom';
    startDate: Date;
    endDate: Date;
    format: 'csv' | 'json' | 'zip';
    collections: string[];
    recordCount: number;
    fileSizeBytes: number;
    checksumSha256: string;
    downloadCount: number;
    storagePath: string;
    purgedAfterArchive: boolean;
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
    createdAt: Date;
}

const ArchiveLogSchema = new Schema<IArchiveLog>(
    {
        archiveName: { type: String, required: true, unique: true },
        rangeType: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        format: { type: String, enum: ['csv', 'json', 'zip'], required: true },
        collections: [{ type: String }],
        recordCount: { type: Number, required: true },
        fileSizeBytes: { type: Number, required: true },
        checksumSha256: { type: String, required: true },
        downloadCount: { type: Number, default: 0 },
        storagePath: { type: String, required: true },
        purgedAfterArchive: { type: Boolean, default: false },
        createdBy: {
            id: { type: String, required: true },
            name: { type: String, required: true },
            email: { type: String, required: true },
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

ArchiveLogSchema.index({ createdAt: -1 });

export const getArchiveLogModel = () => {
    const conn = getLogDbConnection();
    return conn.models.ArchiveLog || conn.model<IArchiveLog>('ArchiveLog', ArchiveLogSchema);
};

export default getArchiveLogModel;
