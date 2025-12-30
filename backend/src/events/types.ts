import { IOrder } from '../models/Order';
import { ICustomer } from '../models/Customer';

/**
 * Order events encompass all actions related to an order lifecycle.
 */
export type OrderEventType =
    | 'orderCreate'
    | 'orderUpdate'
    | 'orderCancel'
    | 'orderReturn'
    | 'orderRefund'
    | 'orderShipped'
    | 'orderDelivered'
    | 'orderFailed'
    | 'orderPaid'
    | 'orderRefundRequest';

export interface OrderEvent {
    type: OrderEventType;
    detail: IOrder;
    orderId: string;
    customerId?: string;
    storeId: string;
}

/**
 * Customer events encompass all actions related to a customer lifecycle.
 */
export type CustomerEventType =
    | 'customerCreate'
    | 'customerUpdate'
    | 'customerDelete'
    | 'customerLogin'
    | 'customerPasswordReset'
    | 'customerPasswordResetRequest';

export interface CustomerEvent {
    type: CustomerEventType;
    detail: ICustomer;
    storeId: string;
}

/**
 * Define the structure of the events map for the EventEmitter
 */
export interface AppEvents {
    'order': OrderEvent;
    'customer': CustomerEvent;
}
