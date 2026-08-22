// Checkout Context - Shared state for all checkout modules

'use client';

import { createContext, useContext } from 'react';
import { CartItem } from '@/types/cart';
import type { Address, PaymentMethod, TaxBreakdown } from '@/services/checkout.service';

// Order summary type
export interface OrderSummary {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
}

// Applied coupon type
export interface AppliedCoupon {
    code: string;
    discountType: 'flat' | 'percentage';
    discountValue: number;
    discountAmount: number;
}

// Export CartItem for other modules
export type { CartItem };

// Config type (from admin module config)
export interface CheckoutContentConfig {
    mode: 'stepper' | 'one-page';
    progress: {
        style: 'numbered' | 'icons';
        showLabels: boolean;
        steps: string[];
    };
    address: {
        displayStyle: 'cards' | 'dropdown';
        showBillingToggle: boolean;
        showSaveAddress: boolean;
        maxSavedAddresses: number;
    };
    shipping: {
        showEstimatedDates: boolean;
        groupByCarrier: boolean;
        showShippingBreakdown: boolean;
    };
    payment: {
        showIcons: boolean;
        layout: 'grid' | 'list';
        showExtraCharges: boolean;
    };
    review: {
        showItemImages: boolean;
        showEditButtons: boolean;
        showCustomerNote: boolean;
    };
    summary: {
        sticky: boolean;
        showCoupon: boolean;
        collapsibleMobile: boolean;
        showCartItems: boolean;
        maxVisibleItems: number;
    };
    onePage: {
        expandedByDefault: 'address' | 'all' | 'none';
        showSectionNumbers: boolean;
        allowMultipleExpanded: boolean;
    };
}

// Checkout context type
export interface CheckoutContextType {
    // Config
    config: CheckoutContentConfig;

    // State
    currentStep: number;
    checkoutMode: 'stepper' | 'one-page';
    loading: boolean;
    submitting: boolean;
    cartItems: CartItem[];
    customer: any | null;
    isLoggedIn: boolean;
    guestEmail: string;
    savedAddresses: Address[];
    shippingAddress: Address | null;
    billingAddress: Address | null;
    selectedAddressId: string | null;
    sameAsShipping: boolean;
    shippingCost: number;
    shippingDetails: any | null; // Added shipping details
    storeConfig: any; // Add storeConfig for shipping/modules
    paymentMethods: PaymentMethod[];
    selectedPayment: PaymentMethod | null;
    paymentsLoading: boolean;
    taxBreakdown: TaxBreakdown[];
    couponCode: string;
    appliedCoupon: AppliedCoupon | null;
    couponLoading: boolean;
    orderSummary: OrderSummary;
    customerNote: string;
    saveAddress: boolean;
    restrictedItems?: string[]; // List of product names that cannot be shipped

    // Actions
    handleNextStep: () => void;
    handlePreviousStep: () => void;
    goToStep: (step: number) => void;
    canProceedToStep: (step: number) => boolean;

    // Address Actions
    handleAddressSelect: (addressId: string) => void;
    handleAddressSubmit: (address: Omit<Address, '_id'>) => Promise<void>;
    handleBillingAddressSelect: (addressId: string) => void;
    handleBillingAddressSubmit: (address: Omit<Address, '_id'>) => Promise<void>;
    setSameAsShipping: (value: boolean) => void;
    setGuestEmail: (email: string) => void;
    setSaveAddress: (value: boolean) => void;

    // Payment Actions
    handlePaymentSelect: (method: PaymentMethod) => void;

    // Coupon Actions
    handleApplyCoupon: () => Promise<void>;
    handleRemoveCoupon: () => Promise<void>;
    setCouponCode: (code: string) => void;

    // Order Actions
    handlePlaceOrder: () => Promise<void>;
    setCustomerNote: (note: string) => void;
}

// Create context
export const CheckoutContext = createContext<CheckoutContextType | null>(null);

// Export context hook for sub-components
export const useCheckout = () => {
    const context = useContext(CheckoutContext);
    if (!context) {
        throw new Error('useCheckout must be used within CheckoutContent');
    }
    return context;
};
