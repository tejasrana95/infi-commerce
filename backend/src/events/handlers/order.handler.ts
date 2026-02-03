import { OrderEvent } from '../types';

/**
 * Handle Order Events
 * This is where 3rd party developers can plug in their integrations.
 * Example: Salesforce, Shiprocket, custom logging, etc.
 */
export const handleOrderEvent = async (event: OrderEvent) => {
    const { type } = event;



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
        // Add other cases as needed
        default:
            // Generic handling or ignore
            break;
    }
};

/**
 * Logic to run when an order is created
 */
async function onOrderCreate(_event: OrderEvent) {
    // TODO: Connect to Salesforce
    // Example: await salesforceService.createOrder(event.detail);

    // TODO: Send to ERP system
}

/**
 * Logic to run when an order is updated
 */
async function onOrderUpdate(_event: OrderEvent) {
    // Handle updates
}

/**
 * Logic to run when an order is shipped
 */
async function onOrderShipped(_event: OrderEvent) {
    // TODO: Connect to Shiprocket
    // Example: await shiprocketService.createShipment(event.detail);
}

/**
 * Logic to run when an order is paid
 */
async function onOrderPaid(_event: OrderEvent) {
    // Handle payment success side effects
}
