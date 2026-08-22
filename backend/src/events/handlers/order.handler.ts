import { OrderEvent } from '../types';
import activityIntelligence from '../../services/activity-intelligence.service';

/**
 * Handle Order Events
 * Automatically logs order activities and triggers integrations.
 */
export const handleOrderEvent = async (event: OrderEvent) => {
    const { type, detail, storeId, orderId, customerId } = event;

    const orderSource = detail.isPOSOrder ? 'POS' : (detail as any).orderSource || 'Storefront';
    const channel = detail.isPOSOrder ? 'POS' : 'STOREFRONT';

    // Log Activity
    activityIntelligence.recordActivity(
        'Orders',
        type.toUpperCase(),
        `Order ${orderId} - ${type}`,
        'success',
        {
            storeId,
            channel,
            orderSource,
            actor: {
                type: customerId ? 'customer' : 'guest',
                id: customerId,
            },
        },
        {
            orderId,
            orderNumber: detail.orderNumber,
            total: detail.total,
            currency: detail.currency,
            status: detail.status,
            paymentStatus: detail.paymentStatus,
            itemsCount: detail.items?.length || 0,
        }
    );

    switch (type) {
        case 'orderCreate':
            await onOrderCreate(event);
            break;
        case 'orderUpdate':
            await onOrderUpdate(event);
            break;
        case 'orderShipped':
            await onOrderShipped(event);
            break;
        case 'orderPaid':
            await onOrderPaid(event);
            break;
        case 'orderReturn':
            await onOrderReturn(event);
            break;
        case 'orderRefund':
            await onOrderRefund(event);
            break;
        case 'orderRefundRequest':
            await onOrderRefundRequest(event);
            break;
        default:
            break;
    }
};

async function onOrderCreate(_event: OrderEvent) {}
async function onOrderUpdate(_event: OrderEvent) {}
async function onOrderShipped(_event: OrderEvent) {}
async function onOrderPaid(_event: OrderEvent) {}
async function onOrderRefundRequest(_event: OrderEvent) {}
async function onOrderReturn(_event: OrderEvent) {}
async function onOrderRefund(_event: OrderEvent) {}

