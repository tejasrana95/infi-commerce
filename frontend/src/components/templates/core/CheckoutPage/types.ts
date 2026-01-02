// CheckoutPage types - Shared interfaces for Container and Template

import { Section } from '@/types/layout';
import { Address, ShippingBreakdown } from '@/services/checkout.service';
import { CartItem } from '@/types/cart';

// Payment method type
export interface PaymentMethod {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    isActive: boolean;
    extraCharge?: number;
    extraChargeType?: 'fixed' | 'percentage';
}

// Tax breakdown type
export interface TaxBreakdown {
    name: string;
    rate: number;
    amount: number;
}



// Cart item re-exported for local use
export type { CartItem };

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
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    discountAmount: number;
}

// Checkout step type for stepper mode
export type CheckoutStep = 'address' | 'shipping' | 'payment' | 'review';

// Checkout context state
export interface CheckoutState {
    // Step management
    currentStep: number;
    checkoutMode: 'stepper' | 'one-page';

    // Loading states
    loading: boolean;
    submitting: boolean;

    // Cart
    cartItems: CartItem[];
    cartValid: boolean;

    // Customer
    customer: any | null;
    guestEmail: string;

    // Addresses
    savedAddresses: Address[];
    shippingAddress: Address | null;
    billingAddress: Address | null;
    selectedAddressId: string | null;
    sameAsShipping: boolean;

    // Shipping
    shippingCost: number;
    shippingBreakdown: ShippingBreakdown[];

    // Payment
    paymentMethods: PaymentMethod[];
    selectedPayment: PaymentMethod | null;

    // Tax
    taxBreakdown: TaxBreakdown[];

    // Coupon
    couponCode: string;
    appliedCoupon: AppliedCoupon | null;
    couponLoading: boolean;

    // Order Summary
    orderSummary: OrderSummary;

    // Additional
    customerNote: string;
    saveAddress: boolean;
}

// Checkout context handlers
export interface CheckoutHandlers {
    // Step navigation
    handleNextStep: () => void;
    handlePreviousStep: () => void;
    goToStep: (step: number) => void;
    canProceedToStep: (step: number) => boolean;

    // Address handlers
    handleAddressSelect: (addressId: string) => void;
    handleAddressSubmit: (address: Address) => Promise<void>;
    handleBillingAddressSelect: (addressId: string) => void;
    handleBillingAddressSubmit: (address: Address) => void;
    setSameAsShipping: (value: boolean) => void;

    // Payment handlers
    handlePaymentSelect: (method: PaymentMethod) => void;

    // Coupon handlers
    handleApplyCoupon: () => Promise<void>;
    handleRemoveCoupon: () => Promise<void>;
    setCouponCode: (code: string) => void;

    // Order handlers
    handlePlaceOrder: () => Promise<void>;

    // Other setters
    setGuestEmail: (email: string) => void;
    setCustomerNote: (note: string) => void;
    setSaveAddress: (value: boolean) => void;
}

// Full checkout context
export interface CheckoutContextType extends CheckoutState, CheckoutHandlers { }

// Container props
export interface CheckoutPageContainerProps {
    initialLayout?: Section[];
}

// Template props
export interface CheckoutPageTemplateProps {
    layout: Section[];
    checkoutMode: 'stepper' | 'one-page';
    currentStep: number;
    showEmptyState: boolean;
}

// Module props base (for all checkout modules)
export interface CheckoutModuleBaseProps {
    config: Record<string, any>;
}

// Step labels for progress bar
export const CHECKOUT_STEP_LABELS = ['Address', 'Shipping', 'Payment', 'Review'];

// Default order summary
export const DEFAULT_ORDER_SUMMARY: OrderSummary = {
    subtotal: 0,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 0,
};
