import eventEmitter from '../index';
import { handleOrderEvent } from './order.handler';
import { handleCustomerEvent } from './customer.handler';

/**
 * Register all application event listeners.
 * This should be called once during application startup.
 */
export const registerEventHandlers = () => {
    // Register Order Event Handlers
    eventEmitter.onEvent('order', handleOrderEvent);

    // Register Customer Event Handlers
    eventEmitter.onEvent('customer', handleCustomerEvent);

    console.log('✅ Event handlers registered successfully');
};
