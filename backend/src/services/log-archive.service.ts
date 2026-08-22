import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import getActivityLogModel from '../models/logs/ActivityLog';
import getAuditLogModel from '../models/logs/AuditLog';
import getApiLogModel from '../models/logs/ApiLog';
import getSearchLogModel from '../models/logs/SearchLog';
import getSecurityLogModel from '../models/logs/SecurityLog';
import getSystemLogModel from '../models/logs/SystemLog';
import getArchiveLogModel from '../models/logs/ArchiveLog';

export interface ArchiveOptions {
    rangeType: 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_6_months' | 'last_year' | 'all_time' | 'custom';
    startDate?: Date;
    endDate?: Date;
    format: 'csv' | 'json';
    collections?: string[]; // e.g. ['activity_logs', 'audit_logs', 'api_logs', 'security_logs', 'search_logs', 'system_logs']
    purgeAfterArchive?: boolean;
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
}

class LogArchiveService {
    private storageDir: string;

    constructor() {
        this.storageDir = path.join(process.cwd(), 'storage', 'archives');
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
    }

    private calculateDateRange(rangeType: string, customStart?: Date, customEnd?: Date): { start: Date; end: Date } {
        const end = customEnd ? new Date(customEnd) : new Date();
        let start = new Date();

        switch (rangeType) {
            case 'yesterday':
                start.setDate(end.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'last_7_days':
                start.setDate(end.getDate() - 7);
                break;
            case 'last_30_days':
                start.setDate(end.getDate() - 30);
                break;
            case 'last_90_days':
                start.setDate(end.getDate() - 90);
                break;
            case 'last_6_months':
                start.setMonth(end.getMonth() - 6);
                break;
            case 'last_year':
                start.setFullYear(end.getFullYear() - 1);
                break;
            case 'all_time':
                start = new Date(0);
                break;
            case 'custom':
                if (!customStart) throw new Error('Start date is required for custom range');
                start = new Date(customStart);
                break;
            default:
                start.setDate(end.getDate() - 7);
        }

        return { start, end };
    }

    public async generateArchive(options: ArchiveOptions) {
        const { start, end } = this.calculateDateRange(options.rangeType, options.startDate, options.endDate);
        const targetCollections = options.collections && options.collections.length > 0
            ? options.collections
            : ['activity_logs', 'audit_logs', 'api_logs', 'security_logs', 'search_logs', 'system_logs'];

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveName = `log_archive_${options.rangeType}_${timestamp}.${options.format}`;
        const filePath = path.join(this.storageDir, archiveName);

        const filter = { createdAt: { $gte: start, $lte: end } };
        let totalRecords = 0;
        const archiveData: Record<string, any[]> = {};

        if (targetCollections.includes('activity_logs')) {
            const logs = await getActivityLogModel().find(filter).lean();
            archiveData.activity_logs = logs;
            totalRecords += logs.length;
        }

        if (targetCollections.includes('audit_logs')) {
            const logs = await getAuditLogModel().find(filter).lean();
            archiveData.audit_logs = logs;
            totalRecords += logs.length;
        }

        if (targetCollections.includes('api_logs')) {
            const logs = await getApiLogModel().find(filter).lean();
            archiveData.api_logs = logs;
            totalRecords += logs.length;
        }

        if (targetCollections.includes('search_logs')) {
            const logs = await getSearchLogModel().find(filter).lean();
            archiveData.search_logs = logs;
            totalRecords += logs.length;
        }

        if (targetCollections.includes('security_logs')) {
            const logs = await getSecurityLogModel().find(filter).lean();
            archiveData.security_logs = logs;
            totalRecords += logs.length;
        }

        if (targetCollections.includes('system_logs')) {
            const logs = await getSystemLogModel().find(filter).lean();
            archiveData.system_logs = logs;
            totalRecords += logs.length;
        }

        let fileContent = '';
        if (options.format === 'json') {
            fileContent = JSON.stringify(archiveData, null, 2);
        } else {
            // Simplified CSV conversion for primary collection
            const lines: string[] = [];
            for (const col of Object.keys(archiveData)) {
                lines.push(`=== COLLECTION: ${col} ===`);
                if (archiveData[col].length > 0) {
                    const headers = Object.keys(archiveData[col][0]);
                    lines.push(headers.join(','));
                    for (const row of archiveData[col]) {
                        const values = headers.map(h => JSON.stringify(row[h] !== undefined ? row[h] : ''));
                        lines.push(values.join(','));
                    }
                }
                lines.push('');
            }
            fileContent = lines.join('\n');
        }

        fs.writeFileSync(filePath, fileContent, 'utf-8');

        const stats = fs.statSync(filePath);
        const checksumSha256 = crypto.createHash('sha256').update(fileContent).digest('hex');

        // Optional Purge
        if (options.purgeAfterArchive) {
            if (targetCollections.includes('activity_logs')) await getActivityLogModel().deleteMany(filter);
            if (targetCollections.includes('audit_logs')) await getAuditLogModel().deleteMany(filter);
            if (targetCollections.includes('api_logs')) await getApiLogModel().deleteMany(filter);
            if (targetCollections.includes('search_logs')) await getSearchLogModel().deleteMany(filter);
            if (targetCollections.includes('security_logs')) await getSecurityLogModel().deleteMany(filter);
            if (targetCollections.includes('system_logs')) await getSystemLogModel().deleteMany(filter);
        }

        const archiveDoc = await getArchiveLogModel().create({
            archiveName,
            rangeType: options.rangeType,
            startDate: start,
            endDate: end,
            format: options.format,
            collections: targetCollections,
            recordCount: totalRecords,
            fileSizeBytes: stats.size,
            checksumSha256,
            downloadCount: 0,
            storagePath: filePath,
            purgedAfterArchive: !!options.purgeAfterArchive,
            createdBy: options.createdBy,
        });

        return archiveDoc;
    }

    public async getArchiveHistory() {
        return getArchiveLogModel().find().sort({ createdAt: -1 }).lean();
    }

    public async getArchiveFilePath(archiveId: string) {
        const archive = await getArchiveLogModel().findById(archiveId);
        if (!archive) return null;

        archive.downloadCount += 1;
        await archive.save();

        return {
            filePath: archive.storagePath,
            fileName: archive.archiveName,
        };
    }

    public async purgeLogs(rangeType: string, startDate?: Date, endDate?: Date, collections?: string[]) {
        const { start, end } = this.calculateDateRange(rangeType, startDate, endDate);
        const targetCollections = collections && collections.length > 0
            ? collections
            : ['activity_logs', 'audit_logs', 'api_logs', 'security_logs', 'search_logs', 'system_logs'];

        const filter = { createdAt: { $gte: start, $lte: end } };
        let deletedRecords = 0;

        if (targetCollections.includes('activity_logs')) {
            const res = await getActivityLogModel().deleteMany(filter);
            deletedRecords += res.deletedCount || 0;
        }
        if (targetCollections.includes('audit_logs')) {
            const res = await getAuditLogModel().deleteMany(filter);
            deletedRecords += res.deletedCount || 0;
        }
        if (targetCollections.includes('api_logs')) {
            const res = await getApiLogModel().deleteMany(filter);
            deletedRecords += res.deletedCount || 0;
        }

        return { deletedRecords, start, end };
    }
}

export const logArchiveService = new LogArchiveService();
export default logArchiveService;
