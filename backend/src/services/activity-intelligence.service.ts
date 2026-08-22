import logQueueService from './log-queue.service';

export interface ActivityContext {
    requestId?: string;
    traceId?: string;
    correlationId?: string;
    sessionId?: string;
    storeId?: string;
    currency?: string;
    language?: string;
    channel?: string;
    orderSource?: string;
    actor?: {
        type: 'super_admin' | 'admin' | 'store_admin' | 'pos_user' | 'customer' | 'guest' | 'api_key' | 'system';
        id?: string;
        name?: string;
        email?: string;
        apiKeyId?: string;
        apiKeyName?: string;
    };
    ipAddress?: string;
    userAgent?: string;
}

class ActivityIntelligenceService {
    /**
     * Record a business activity
     */
    public recordActivity(
        module: string,
        activityType: string,
        action: string,
        status: 'success' | 'failed' | 'warning',
        context: ActivityContext,
        details?: Record<string, any>
    ): void {
        logQueueService.enqueueActivity({
            requestId: context.requestId || `req_${Date.now()}`,
            traceId: context.traceId || `trc_${Date.now()}`,
            correlationId: context.correlationId,
            sessionId: context.sessionId,
            storeId: context.storeId,
            currency: context.currency || 'USD',
            language: context.language || 'en',
            channel: context.channel || 'STOREFRONT',
            orderSource: context.orderSource,
            actor: context.actor || { type: 'system' },
            module,
            activityType,
            action,
            status,
            details,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
        });
    }

    /**
     * Record an audit log for object/state mutations
     */
    public recordAudit(
        module: string,
        entity: string,
        entityId: string,
        action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'ROLE_CHANGE' | 'PERMISSION_CHANGE',
        context: ActivityContext,
        changes?: { before?: Record<string, any>; after?: Record<string, any> },
        reason?: string
    ): void {
        logQueueService.enqueueAudit({
            requestId: context.requestId || `req_${Date.now()}`,
            storeId: context.storeId,
            actor: context.actor || { type: 'system' },
            module,
            entity,
            entityId,
            action,
            changes,
            reason,
            ipAddress: context.ipAddress,
        });
    }

    /**
     * Record customer search event
     */
    public recordSearch(searchData: {
        storeId?: string;
        sessionId?: string;
        customerId?: string;
        userType?: 'customer' | 'guest' | 'admin' | 'pos_user';
        channel?: string;
        keyword: string;
        resultCount: number;
        filters?: Record<string, any>;
        sort?: string;
        currency?: string;
        language?: string;
        clickedProductId?: string;
        purchasedAfterSearch?: boolean;
        orderId?: string;
        ipAddress?: string;
    }): void {
        const normalizedKeyword = searchData.keyword.trim().toLowerCase();
        logQueueService.enqueueSearch({
            ...searchData,
            normalizedKeyword,
            userType: searchData.userType || 'guest',
            channel: searchData.channel || 'STOREFRONT',
            isNoResult: searchData.resultCount === 0,
        });
    }
}

export const activityIntelligence = new ActivityIntelligenceService();
export default activityIntelligence;
