export interface AdminNotification {
    _id: string;
    type: 'order' | 'customer' | 'return' | 'system';
    title: string;
    message: string;
    data?: any;
    isRead: boolean;
    createdAt: string;
}
