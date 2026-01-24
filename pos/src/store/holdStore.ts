import { create } from 'zustand';
import { CartItem, Customer } from '../types';
import api from '../services/api';

interface HeldOrder {
    id: string;
    customerIdentifier: string;
    customerId?: Customer | string;
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
    notes?: string;
    heldAt: Date;
    assignedToUserId?: string;
    assignedToUser?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

interface HoldState {
    heldOrders: HeldOrder[];
    loading: boolean;
    holdOrder: (customerIdentifier: string, items: CartItem[], subtotal: number, tax: number, total: number, notes?: string, customer?: Customer | null) => Promise<void>;
    fetchHeldOrders: (assignedToMe?: boolean) => Promise<void>;
    resumeOrder: (id: string) => Promise<HeldOrder | null>;
    deleteHeldOrder: (id: string) => Promise<void>;
    transferOrder: (id: string, targetUserId: string) => Promise<void>;
    getHeldOrdersCount: () => number;
}

export const useHoldStore = create<HoldState>((set, get) => ({
    heldOrders: [],
    loading: false,

    holdOrder: async (customerIdentifier, items, subtotal, tax, total, notes, customer) => {
        try {
            set({ loading: true });
            const heldOrder = await api.createHeldOrder({
                customerIdentifier,
                customerId: customer?.id,
                items: items.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    name: item.name,
                    sku: item.sku,
                    price: item.price,
                    basePrice: item.basePrice,
                    quantity: item.quantity,
                    taxRate: item.taxRate,
                    taxAmount: item.taxAmount,
                    image: item.image,
                })),
                subtotal,
                tax,
                total,
                notes,
            });

            // Add to local state
            set((state) => ({
                heldOrders: [
                    {
                        id: heldOrder._id,
                        customerIdentifier: heldOrder.customerIdentifier,
                        customerId: heldOrder.customerId,
                        items: heldOrder.items.map((item: any) => ({
                            ...item,
                            cartId: `${item.productId}-${item.variantId || 'simple'}`,
                        })),
                        subtotal: heldOrder.subtotal,
                        tax: heldOrder.tax,
                        total: heldOrder.total,
                        notes: heldOrder.notes,
                        heldAt: new Date(heldOrder.heldAt),
                        assignedToUserId: heldOrder.assignedToUserId,
                        assignedToUser: heldOrder.assignedToUserId,
                    },
                    ...state.heldOrders,
                ],
                loading: false,
            }));
        } catch (error) {
            console.error('Failed to hold order:', error);
            set({ loading: false });
            throw error;
        }
    },

    fetchHeldOrders: async (assignedToMe = false) => {
        try {
            set({ loading: true });
            const orders = await api.getHeldOrders(assignedToMe);
            
            set({
                heldOrders: orders.map((order: any) => ({
                    id: order._id,
                    customerIdentifier: order.customerIdentifier,
                    customerId: order.customerId,
                    items: order.items.map((item: any) => ({
                        ...item,
                        cartId: `${item.productId}-${item.variantId || 'simple'}`,
                    })),
                    subtotal: order.subtotal,
                    tax: order.tax,
                    total: order.total,
                    notes: order.notes,
                    heldAt: new Date(order.heldAt),
                    assignedToUserId: order.assignedToUserId?._id || order.assignedToUserId,
                    assignedToUser: order.assignedToUserId,
                })),
                loading: false,
            });
        } catch (error) {
            console.error('Failed to fetch held orders:', error);
            set({ loading: false });
        }
    },

    resumeOrder: async (id) => {
        const { heldOrders } = get();
        const order = heldOrders.find((o) => o.id === id);

        if (order) {
            try {
                // Mark as resumed on backend
                await api.resumeHeldOrder(id);
                
                // Remove from local state
                set((state) => ({
                    heldOrders: state.heldOrders.filter((o) => o.id !== id),
                }));
                
                return order;
            } catch (error) {
                console.error('Failed to resume order:', error);
                throw error;
            }
        }

        return null;
    },

    deleteHeldOrder: async (id) => {
        try {
            await api.deleteHeldOrder(id);
            set((state) => ({
                heldOrders: state.heldOrders.filter((o) => o.id !== id),
            }));
        } catch (error) {
            console.error('Failed to delete held order:', error);
            throw error;
        }
    },

    transferOrder: async (id, targetUserId) => {
        try {
            const updatedOrder = await api.transferHeldOrder(id, targetUserId);
            
            // Update local state
            set((state) => ({
                heldOrders: state.heldOrders.map((o) =>
                    o.id === id
                        ? {
                            ...o,
                            assignedToUserId: updatedOrder.assignedToUserId._id,
                            assignedToUser: updatedOrder.assignedToUserId,
                        }
                        : o
                ),
            }));
        } catch (error) {
            console.error('Failed to transfer order:', error);
            throw error;
        }
    },

    getHeldOrdersCount: () => {
        const { heldOrders } = get();
        return heldOrders.length;
    },
}));
