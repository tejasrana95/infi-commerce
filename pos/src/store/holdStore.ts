import { create } from 'zustand';
import { CartItem } from '../types';

interface HeldOrder {
    id: string;
    customerIdentifier: string;
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
    notes?: string;
    heldAt: Date;
}

interface HoldState {
    heldOrders: HeldOrder[];
    holdOrder: (customerIdentifier: string, items: CartItem[], subtotal: number, tax: number, total: number, notes?: string) => void;
    resumeOrder: (id: string) => HeldOrder | null;
    deleteHeldOrder: (id: string) => void;
    getHeldOrdersCount: () => number;
}

export const useHoldStore = create<HoldState>((set, get) => ({
    heldOrders: [],

    holdOrder: (customerIdentifier, items, subtotal, tax, total, notes) => {
        set((state) => ({
            heldOrders: [
                ...state.heldOrders,
                {
                    id: `hold-${Date.now()}`,
                    customerIdentifier,
                    items: JSON.parse(JSON.stringify(items)), // Deep copy
                    subtotal,
                    tax,
                    total,
                    notes,
                    heldAt: new Date(),
                },
            ],
        }));
    },

    resumeOrder: (id) => {
        const { heldOrders } = get();
        const order = heldOrders.find((o) => o.id === id);

        if (order) {
            // Remove from held orders when resumed
            set((state) => ({
                heldOrders: state.heldOrders.filter((o) => o.id !== id),
            }));
            return order;
        }

        return null;
    },

    deleteHeldOrder: (id) => {
        set((state) => ({
            heldOrders: state.heldOrders.filter((o) => o.id !== id),
        }));
    },

    getHeldOrdersCount: () => {
        const { heldOrders } = get();
        return heldOrders.length;
    },
}));
