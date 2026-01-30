import { syncService } from './sync.service';
import { useSyncStore } from '../store/syncStore';

class SyncSchedulerService {
    private syncIntervalId: NodeJS.Timeout | null = null;
    private readonly SYNC_INTERVAL_MS = 180 * 60 * 1000; // 180 minutes

    /**
     * Start the sync scheduler
     */
    start() {
        if (this.syncIntervalId) return;

        // Initial check
        this.runSyncCheck();

        // Set interval
        this.syncIntervalId = setInterval(() => {
            this.runSyncCheck();
        }, this.SYNC_INTERVAL_MS);

        // Add event listeners for network status and visibility
        window.addEventListener('online', this.handleOnline);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    /**
     * Stop the sync scheduler
     */
    stop() {
        if (this.syncIntervalId) {
            clearInterval(this.syncIntervalId);
            this.syncIntervalId = null;
        }

        window.removeEventListener('online', this.handleOnline);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    /**
     * Handle coming online
     */
    private handleOnline = () => {
        this.runSyncCheck();
    };

    /**
     * Handle app returning to foreground
     */
    private handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            this.runSyncCheck();
        }
    };

    /**
     * Run the sync check and trigger sync if needed
     */
    private async runSyncCheck() {
        // optimize: check if already syncing to avoid checking status unnecessarily
        if (useSyncStore.getState().isSyncing) return;

        try {
            const needsSync = await syncService.checkSyncNeeded();
            if (needsSync.products || needsSync.categories) {
                await syncService.syncAll();
            }
        } catch (error) {
            console.error('Scheduled sync check failed:', error);
        }
    }
}

export const syncScheduler = new SyncSchedulerService();
