import { EventEmitter } from 'events';
import { OrderEvent, CustomerEvent, AppEvents } from './types';

/**
 * Central Event Emitter for the application.
 * This allows decoupling core business logic from side effects like 
 * 3rd party integrations (Salesforce, Shiprocket), notifications, and logging.
 */
class AppEventEmitter extends EventEmitter {
    /**
     * Emit an order related event
     */
    emitOrder(event: OrderEvent): boolean {
        return this.emit('order', event);
    }

    /**
     * Emit a customer related event
     */
    emitCustomer(event: CustomerEvent): boolean {
        return this.emit('customer', event);
    }

    /**
     * Typed version of 'on' for application events
     */
    onEvent<K extends keyof AppEvents>(event: K, listener: (args: AppEvents[K]) => void): this {
        return this.on(event, listener);
    }
}

const eventEmitter = new AppEventEmitter();

// Increase max listeners if necessary (default is 10)
eventEmitter.setMaxListeners(20);

export default eventEmitter;

/**
 * Convenience helper to emit an order event
 */
export const emitOrderEvent = (
    type: OrderEvent['type'],
    detail: OrderEvent['detail'],
    storeId: string,
    orderId: string,
    customerId?: string
) => {
    eventEmitter.emitOrder({
        type,
        detail,
        storeId: storeId.toString(),
        orderId: orderId.toString(),
        customerId: customerId ? customerId.toString() : undefined
    });
};

/**
 * Convenience helper to emit a customer event
 */
export const emitCustomerEvent = (type: CustomerEvent['type'], detail: CustomerEvent['detail'], storeId: string) => {
    eventEmitter.emitCustomer({ type, detail, storeId: storeId.toString() });
};
