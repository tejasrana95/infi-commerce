import { transactionalNotificationService } from './transactional-notification.service';

export interface OrderNotificationData {
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    total: number;
    currency: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    shippingAddress: {
        address1: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        phone?: string;
        firstName?: string;
        lastName?: string;
    };
}

/**
 * Queue order confirmation notifications
 */
export async function queueOrderConfirmation(
    data: OrderNotificationData & { storeId?: string }
) {
    try {
        const storeId = data.storeId;
        if (!storeId) return;

        // Use the unified transactional service
        // We need to fetch the store name to satisfy the service interface
        const Store = (await import('../models/Store')).default;
        const store = await Store.findById(storeId).select('name').lean();
        const activeStoreName = store?.name || 'Store';

        // Map data to order object for the service
        const order = {
            _id: data.orderId,
            orderNumber: data.orderNumber,
            total: data.total,
            currency: data.currency,
            guestEmail: data.customerEmail,
            shippingAddress: {
                ...data.shippingAddress,
                firstName: data.shippingAddress.firstName || data.customerName.split(' ')[0],
                lastName: data.shippingAddress.lastName || data.customerName.split(' ').slice(1).join(' '),
                phone: data.customerPhone || (data.shippingAddress as any).phone
            }
        };

        await transactionalNotificationService.sendOrderStatusUpdate(
            storeId,
            activeStoreName,
            order,
            'created'
        );


    } catch (error) {
        console.error('Error queuing order confirmation:', error);
    }
}

/**
 * Queue order status update notifications
 */
export async function queueOrderStatusUpdate(
    data: OrderNotificationData & { status: string; storeId?: string },
    _channels: any
) {
    try {
        const storeId = data.storeId;
        if (!storeId) return;

        const Store = (await import('../models/Store')).default;
        const store = await Store.findById(storeId).select('name').lean();
        const storeName = store?.name || 'Store';

        const order = {
            _id: data.orderId,
            orderNumber: data.orderNumber,
            total: data.total,
            currency: data.currency,
            guestEmail: data.customerEmail,
            shippingAddress: data.shippingAddress
        };

        await transactionalNotificationService.sendOrderStatusUpdate(
            storeId,
            storeName,
            order,
            data.status
        );
    } catch (error) {
        console.error('Error queuing status update:', error);
    }
}

/**
 * Queue shipping notification
 */
export async function queueShippingNotification(
    data: OrderNotificationData & { trackingNumber: string; carrier: string; storeId?: string },
    _channels: any
) {
    try {
        const storeId = data.storeId;
        if (!storeId) return;

        const Store = (await import('../models/Store')).default;
        const store = await Store.findById(storeId).select('name').lean();
        const storeName = store?.name || 'Store';

        const order = {
            _id: data.orderId,
            orderNumber: data.orderNumber,
            total: data.total,
            currency: data.currency,
            guestEmail: data.customerEmail,
            shippingAddress: data.shippingAddress,
            trackingNumber: data.trackingNumber,
            courierName: data.carrier
        };

        await transactionalNotificationService.sendOrderStatusUpdate(
            storeId,
            storeName,
            order,
            'shipped'
        );
    } catch (error) {
        console.error('Error queuing shipping notification:', error);
    }
}
