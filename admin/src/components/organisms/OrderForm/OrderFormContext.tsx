'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Address, PaymentMethod, PaymentStatus, OrderStatus } from '@/types/order';
import { ProductOption } from '@/components/molecules/ProductAutoComplete';
import { CustomerOption } from '@/components/molecules/CustomerAutoComplete';

export interface OrderItem {
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    image?: string;
    weight?: number;
}

interface StoreOption {
    _id: string;
    name: string;
}

const emptyAddress: Address = {
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    phone: '',
};

interface OrderFormState {
    // Store & Customer
    storeId: string;
    stores: StoreOption[];
    customer: CustomerOption | null;
    guestEmail: string;

    // Items
    items: OrderItem[];

    // Addresses
    shippingAddress: Address;
    billingAddress: Address;
    sameAsShipping: boolean;

    // Payment & Status
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    status: OrderStatus;

    // Totals
    shippingCost: number;
    tax: number;
    discount: number;
    currency: string;

    // Notes
    customerNote: string;
    adminNote: string;

    // Mode
    isEditing: boolean;
    orderId?: string;
}

interface OrderFormContextType extends OrderFormState {
    setStoreId: (id: string) => void;
    setStores: (stores: StoreOption[]) => void;
    setCustomer: (customer: CustomerOption | null) => void;
    setGuestEmail: (email: string) => void;

    addItem: (product: ProductOption, quantity?: number, variantId?: string) => void;
    setItems: (items: OrderItem[]) => void;
    updateItemQuantity: (index: number, quantity: number) => void;
    removeItem: (index: number) => void;

    setShippingAddress: (address: Address) => void;
    setBillingAddress: (address: Address) => void;
    setSameAsShipping: (same: boolean) => void;

    setPaymentMethod: (method: PaymentMethod) => void;
    setPaymentStatus: (status: PaymentStatus) => void;
    setStatus: (status: OrderStatus) => void;

    setShippingCost: (cost: number) => void;
    setTax: (tax: number) => void;
    setDiscount: (discount: number) => void;
    setCurrency: (currency: string) => void;

    setCustomerNote: (note: string) => void;
    setAdminNote: (note: string) => void;

    subtotal: number;
    total: number;

    getOrderData: () => any;
    resetForm: () => void;
}

const OrderFormContext = createContext<OrderFormContextType | null>(null);

export function useOrderForm() {
    const context = useContext(OrderFormContext);
    if (!context) {
        throw new Error('useOrderForm must be used within OrderFormProvider');
    }
    return context;
}

interface OrderFormProviderProps {
    children: ReactNode;
    initialData?: Partial<OrderFormState>;
    isEditing?: boolean;
    orderId?: string;
}

export function OrderFormProvider({ children, initialData, isEditing = false, orderId }: OrderFormProviderProps) {
    const [storeId, setStoreId] = useState(initialData?.storeId || '');
    const [stores, setStores] = useState<StoreOption[]>(initialData?.stores || []);
    const [customer, setCustomer] = useState<CustomerOption | null>(initialData?.customer || null);
    const [guestEmail, setGuestEmail] = useState(initialData?.guestEmail || '');

    const [items, setItems] = useState<OrderItem[]>(initialData?.items || []);

    const [shippingAddress, setShippingAddress] = useState<Address>(initialData?.shippingAddress || emptyAddress);
    const [billingAddress, setBillingAddress] = useState<Address>(initialData?.billingAddress || emptyAddress);
    const [sameAsShipping, setSameAsShipping] = useState(initialData?.sameAsShipping ?? true);

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialData?.paymentMethod || 'cod');
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initialData?.paymentStatus || 'pending');
    const [status, setStatus] = useState<OrderStatus>(initialData?.status || 'pending');

    const [shippingCost, setShippingCost] = useState(initialData?.shippingCost || 0);
    const [tax, setTax] = useState(initialData?.tax || 0);
    const [discount, setDiscount] = useState(initialData?.discount || 0);
    const [currency, setCurrency] = useState(initialData?.currency || 'USD');

    const [customerNote, setCustomerNote] = useState(initialData?.customerNote || '');
    const [adminNote, setAdminNote] = useState(initialData?.adminNote || '');

    // Check if key looks like MongoDB ObjectId
    const isObjectId = (key: string) => /^[a-f0-9]{24}$/i.test(key);

    const addItem = useCallback((product: ProductOption, quantity = 1, variantId?: string) => {
        const variant = variantId ? product.variants?.find(v => v._id === variantId) : null;
        const price = variant?.salePrice || variant?.price || product.salePrice || product.price;
        const sku = variant?.sku || product.sku;

        const existingIndex = items.findIndex(
            i => i.productId === product._id && i.variantId === variantId
        );

        if (existingIndex >= 0) {
            const newItems = [...items];
            newItems[existingIndex].quantity += quantity;
            setItems(newItems);
        } else {
            // Build variant label with attribute name:value, filtering ObjectIds
            let variantLabel = '';
            if (variant?.attributes) {
                const readableAttrs = Object.entries(variant.attributes)
                    .filter(([key]) => !isObjectId(key))
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
                if (readableAttrs) {
                    variantLabel = ` (${readableAttrs})`;
                }
            }
            setItems([...items, {
                productId: product._id,
                variantId,
                name: product.name + variantLabel,
                sku,
                price,
                quantity,
                image: product.images?.[0],
                weight: variant?.weight || product.weight || 0,
            }]);
        }
    }, [items]);

    const updateItemQuantity = useCallback((index: number, quantity: number) => {
        if (quantity < 1) return;
        const newItems = [...items];
        newItems[index].quantity = quantity;
        setItems(newItems);
    }, [items]);

    const removeItem = useCallback((index: number) => {
        setItems(items.filter((_, i) => i !== index));
    }, [items]);

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + shippingCost + tax - discount;

    const getOrderData = useCallback(() => ({
        storeId,
        customerId: customer?._id, // Include customer ID if selected
        items: items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
        })),
        guestEmail: customer?._id ? undefined : guestEmail, // Only for guest orders
        shippingAddress,
        billingAddress: sameAsShipping ? shippingAddress : billingAddress,
        paymentMethod,
        paymentStatus,
        status,
        shippingCost,
        tax,
        discount,
        currency,
        customerNote,
        adminNote,
    }), [storeId, items, customer, guestEmail, shippingAddress, billingAddress, sameAsShipping,
        paymentMethod, paymentStatus, status, shippingCost, tax, discount, currency, customerNote, adminNote]);

    const resetForm = useCallback(() => {
        setStoreId('');
        setCustomer(null);
        setGuestEmail('');
        setItems([]);
        setShippingAddress(emptyAddress);
        setBillingAddress(emptyAddress);
        setSameAsShipping(true);
        setPaymentMethod('cod');
        setPaymentStatus('pending');
        setStatus('pending');
        setShippingCost(0);
        setTax(0);
        setDiscount(0);
        setCurrency('USD');
        setCustomerNote('');
        setAdminNote('');
    }, []);

    const value: OrderFormContextType = {
        storeId, setStoreId,
        stores, setStores,
        customer, setCustomer,
        guestEmail, setGuestEmail,
        items, addItem, setItems, updateItemQuantity, removeItem,
        shippingAddress, setShippingAddress,
        billingAddress, setBillingAddress,
        sameAsShipping, setSameAsShipping,
        paymentMethod, setPaymentMethod,
        paymentStatus, setPaymentStatus,
        status, setStatus,
        shippingCost, setShippingCost,
        tax, setTax,
        discount, setDiscount,
        currency, setCurrency,
        customerNote, setCustomerNote,
        adminNote, setAdminNote,
        subtotal, total,
        getOrderData, resetForm,
        isEditing, orderId,
    };

    return (
        <OrderFormContext.Provider value={value}>
            {children}
        </OrderFormContext.Provider>
    );
}
