import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

const execAsync = promisify(exec);

class MongoDbBackupService {
    private backupDir: string;

    constructor() {
        // Default backup directory
        this.backupDir = path.join(process.cwd(), 'backups');
    }

    /**
     * Check if mongodump and mongorestore tools are available
     */
    async checkToolsAvailability(): Promise<{ mongodump: boolean; mongorestore: boolean }> {
        try {
            await execAsync('mongodump --version');
            const mongodump = true;

            try {
                await execAsync('mongorestore --version');
                return { mongodump, mongorestore: true };
            } catch {
                return { mongodump, mongorestore: false };
            }
        } catch {
            return { mongodump: false, mongorestore: false };
        }
    }

    /**
     * Ensure backup directory exists
     */
    private async ensureBackupDir(): Promise<void> {
        try {
            await fs.access(this.backupDir);
        } catch {
            await fs.mkdir(this.backupDir, { recursive: true });
        }
    }

    /**
     * Create MongoDB dump
     * Returns the path to the generated dump file
     */
    async createDump(): Promise<string> {
        // Check if tools are available
        const tools = await this.checkToolsAvailability();
        if (!tools.mongodump) {
            throw new Error('mongodump tool is not installed or not available in PATH');
        }

        await this.ensureBackupDir();

        // Generate unique filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        const archivePath = path.join(this.backupDir, `mongodb_dump_${timestamp}.archive.gz`);

        try {
            // Parse MongoDB URI to get connection details
            const mongoUri = config.database.mongoUri;

            // Use mongodump with archive format
            const command = `mongodump --uri="${mongoUri}" --archive="${archivePath}" --gzip`;

            const { stderr } = await execAsync(command);

            if (stderr && !stderr.includes('done dumping')) {
                console.error('mongodump stderr:', stderr);
            }

            // Verify the file was created
            await fs.access(archivePath);

            return archivePath;
        } catch (error: any) {
            throw new Error(`Failed to create MongoDB dump: ${error.message}`);
        }
    }

    /**
     * Restore MongoDB from dump file
     */
    async restoreDump(filePath: string): Promise<void> {
        // Check if tools are available
        const tools = await this.checkToolsAvailability();
        if (!tools.mongorestore) {
            throw new Error('mongorestore tool is not installed or not available in PATH');
        }

        // Verify file exists
        try {
            await fs.access(filePath);
        } catch {
            throw new Error('Dump file not found');
        }

        try {
            // Parse MongoDB URI
            const mongoUri = config.database.mongoUri;

            // Use mongorestore with archive format
            // --drop flag will drop existing collections before restoring
            // --nsInclude="*" avoids deprecation warnings/errors when using --archive
            const command = `mongorestore --uri="${mongoUri}" --archive="${filePath}" --gzip --drop --nsInclude="*"`;

            const { stderr } = await execAsync(command, {
                maxBuffer: 1024 * 1024 * 100 // 100MB buffer for large restores
            });

            // mongorestore writes progress to stderr. We should only throw if the exit code is non-zero
            // (handled by execAsync) or if we detect explicit failure messages in the output.
            if (stderr) {
                if (stderr.includes('failures') && !stderr.includes('0 failures')) {
                    console.error('mongorestore failures detected:', stderr);
                    throw new Error(`mongorestore encountered failures during restore. Check logs for details.`);
                }
                // Log other stderr output as warnings/info

            }
        } catch (error: any) {
            throw new Error(`Failed to restore MongoDB dump: ${error.message}`);
        }
    }

    /**
     * Upload and save dump file temporarily
     */
    async saveTempDumpFile(buffer: Buffer): Promise<string> {
        await this.ensureBackupDir();

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const tempPath = path.join(this.backupDir, `temp_restore_${timestamp}.archive.gz`);

        await fs.writeFile(tempPath, buffer);

        return tempPath;
    }

    /**
     * Clean up old backup files (keep only last N backups)
     */
    async cleanupOldBackups(keepCount: number = 10): Promise<void> {
        try {
            const files = await fs.readdir(this.backupDir);

            // Filter for dump files
            const dumpFiles = files
                .filter(f => f.startsWith('mongodb_dump_') && f.endsWith('.archive.gz'))
                .map(f => ({
                    name: f,
                    path: path.join(this.backupDir, f)
                }));

            // Sort by name (timestamp) descending
            dumpFiles.sort((a, b) => b.name.localeCompare(a.name));

            // Delete old files beyond keepCount
            const filesToDelete = dumpFiles.slice(keepCount);

            for (const file of filesToDelete) {
                await fs.unlink(file.path);
            }
        } catch (error) {
            console.error('Error cleaning up old backups:', error);
            // Don't throw - cleanup errors shouldn't break the main flow
        }
    }

    /**
     * Get list of available backup files
     */
    async listBackups(): Promise<Array<{ filename: string; size: number; created: Date }>> {
        try {
            await this.ensureBackupDir();
            const files = await fs.readdir(this.backupDir);

            const dumpFiles = files.filter(f =>
                f.startsWith('mongodb_dump_') && f.endsWith('.archive.gz')
            );

            const backups = await Promise.all(
                dumpFiles.map(async (filename) => {
                    const filePath = path.join(this.backupDir, filename);
                    const stats = await fs.stat(filePath);

                    return {
                        filename,
                        size: stats.size,
                        created: stats.birthtime
                    };
                })
            );

            // Sort by created date descending
            return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
        } catch (error) {
            return [];
        }
    }
}

export default new MongoDbBackupService();
