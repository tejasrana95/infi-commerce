// CheckoutContent Module - Wrapper for full checkout functionality
// Used by ModuleRenderer when checkout-content is placed in layout

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { useCart } from '@/providers/CartProvider';
import { useCurrency } from '@/hooks/useCurrency';
import * as checkoutService from '@/services/checkout.service';
import type { Address, PaymentMethod, TaxBreakdown } from '@/services/checkout.service';
import EmptyCheckout from '@/app/checkout/components/EmptyCheckout';
import styles from './CheckoutContent.module.scss';

// Import context
import {
    CheckoutContext,
    CheckoutContextType,
    CheckoutContentConfig,
    OrderSummary,
    AppliedCoupon
} from '../context';
import { CartItem } from '@/types/cart';

// Import individual checkout components
import CheckoutProgress from '@/components/core/modules/checkout/CheckoutProgress';
import CheckoutAddress from '@/components/core/modules/checkout/CheckoutAddress';
import CheckoutShipping from '@/components/core/modules/checkout/CheckoutShipping';
import CheckoutPayment from '@/components/core/modules/checkout/CheckoutPayment';
import CheckoutReview from '@/components/core/modules/checkout/CheckoutReview';
import CheckoutSummary from '@/components/core/modules/checkout/CheckoutSummary';
import CheckoutOnePage from '@/components/core/modules/checkout/CheckoutOnePage';

interface CheckoutContentProps {
    config: any;
}

const DEFAULT_ORDER_SUMMARY: OrderSummary = {
    subtotal: 0,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 0,
};

export default function CheckoutContent({ config: propsConfig }: CheckoutContentProps) {
    const config = (propsConfig || {}) as CheckoutContentConfig;
    const router = useRouter();
    const { customer, isLoading: authLoading } = useAuth();
    const toast = useToast();
    const { clearCart } = useCart();
    const currency = useCurrency();
    // Step management
    const [currentStep, setCurrentStep] = useState(1);
    const checkoutMode = config?.mode || 'stepper';
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showEmptyState, setShowEmptyState] = useState(false);

    // Cart state
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    // Customer state
    const [guestEmail, setGuestEmail] = useState('');

    // Address state
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
    const [billingAddress, setBillingAddress] = useState<Address | null>(null);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [sameAsShipping, setSameAsShipping] = useState(true);

    // Shipping state
    const [shippingCost, setShippingCost] = useState(0);
    const [shippingDetails, setShippingDetails] = useState<any | null>(null);
    const [storeConfig, setStoreConfig] = useState<any>(null);
    const [restrictedItems, setRestrictedItems] = useState<string[]>([]); // Track restricted items

    // Payment state
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);

    // Tax state
    const [taxBreakdown, setTaxBreakdown] = useState<TaxBreakdown[]>([]);

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
    const [couponLoading, setCouponLoading] = useState(false);

    // Order summary
    const [orderSummary, setOrderSummary] = useState<OrderSummary>(DEFAULT_ORDER_SUMMARY);

    // Additional
    const [customerNote, setCustomerNote] = useState('');
    const [saveAddress, setSaveAddress] = useState(true);

    // Initialize checkout
    const initializeCheckout = useCallback(async () => {
        try {
            setLoading(true);
            const validation = await checkoutService.validateCheckout();

            if (!validation || !validation.valid) {
                setShowEmptyState(true);
                setLoading(false);
                return;
            }

            setCartItems(validation.cart?.items || []);
            setStoreConfig(validation.storeConfig || {});
            setOrderSummary({
                subtotal: validation.cart?.subtotal || 0,
                shipping: 0,
                tax: 0,
                discount: 0,
                total: validation.cart?.subtotal || 0,
            });

            if (customer) {
                try {
                    const { addresses } = await checkoutService.getAddresses();
                    setSavedAddresses(addresses || []);
                    const defaultAddr = addresses.find((a: Address) => a.isDefault);
                    if (defaultAddr) {
                        setShippingAddress(defaultAddr);
                        setSelectedAddressId(defaultAddr._id || null);
                    }
                } catch (error) {
                    console.error('Failed to load addresses:', error);
                }
            }

            setLoading(false);
        } catch (error) {
            console.error('Failed to initialize checkout:', error);
            setShowEmptyState(true);
            setLoading(false);
        }
    }, [customer]);

    useEffect(() => {
        if (!authLoading) {
            initializeCheckout();
        }
    }, [authLoading, initializeCheckout]);

    // Handle multi-tab sync (refresh when tab is focused)
    useEffect(() => {
        const handleFocus = () => {
            if (!authLoading) {
                initializeCheckout();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [authLoading, initializeCheckout]);

    // Load shipping when address changes
    useEffect(() => {
        const loadShipping = async () => {
            if (!shippingAddress || !storeConfig?.shippingEnabled || !cartItems.length) return;
            try {
                const result = await checkoutService.getShippingMethods(shippingAddress, cartItems);

                if (result.success === false && result.restrictedItems) {
                    setRestrictedItems(result.restrictedItems);
                    setShippingCost(0);
                    setShippingDetails(null);
                } else {
                    setRestrictedItems([]); // Clear restrictions
                    setShippingCost(result.shippingCost);
                    // Set shipping details
                    setShippingDetails({
                        name: result.name || 'Standard Shipping',
                        description: result.description,
                        cost: result.shippingCost,
                        estimatedDays: (result as any).estimatedDays
                    });
                    setOrderSummary(prev => ({
                        ...prev,
                        shipping: result.shippingCost,
                        total: prev.subtotal + result.shippingCost + prev.tax - prev.discount,
                    }));
                }
            } catch (error: any) {
                console.error('Failed to calculate shipping:', error);
                toast.error(error.response?.data?.message || 'Failed to calculate shipping');
            }
        };
        loadShipping();
    }, [shippingAddress, storeConfig?.shippingEnabled, cartItems]);

    // Load tax
    useEffect(() => {
        const loadTax = async () => {
            if (!shippingAddress) return;
            try {
                const taxData = await checkoutService.calculateTax(shippingAddress, shippingCost);
                setTaxBreakdown(taxData.taxBreakdown);
                setOrderSummary(prev => ({
                    ...prev,
                    tax: taxData.totalTax,
                    total: prev.subtotal + prev.shipping + taxData.totalTax - prev.discount,
                }));
            } catch (error) {
                console.error('Failed to calculate tax:', error);
            }
        };
        loadTax();
    }, [shippingAddress, shippingCost]);

    // Load payment methods
    useEffect(() => {
        const loadPayments = async () => {
            if (!shippingAddress) return;
            try {
                const { methods } = await checkoutService.getPaymentMethods(
                    shippingAddress.country,
                    orderSummary.total,
                    typeof currency === 'string' ? currency : (currency.currentCurrency?.code || 'USD')
                );
                setPaymentMethods(methods);
                if (methods.length > 0 && !selectedPayment) {
                    setSelectedPayment(methods[0]);
                }
            } catch (error) {
                console.error('Failed to load payment methods:', error);
            }
        };
        if (currentStep >= 3 || checkoutMode === 'one-page') loadPayments();
    }, [shippingAddress, currentStep, orderSummary.total, currency, selectedPayment, checkoutMode]);

    // Step navigation
    const canProceedToStep = useCallback((step: number): boolean => {
        // Block progress if there are restricted items
        if (restrictedItems.length > 0) return false;

        switch (step) {
            case 2: return !!shippingAddress;
            case 3: return !!shippingAddress && (storeConfig?.shippingEnabled ? shippingCost >= 0 : true);
            case 4: return !!shippingAddress && !!selectedPayment && (sameAsShipping || !!billingAddress);
            default: return true;
        }
    }, [shippingAddress, storeConfig?.shippingEnabled, shippingCost, selectedPayment, sameAsShipping, billingAddress, restrictedItems]);

    const handleNextStep = useCallback(() => {
        if (canProceedToStep(currentStep + 1)) {
            setCurrentStep(currentStep + 1);
        } else {
            toast.error('Please complete the current step');
        }
    }, [currentStep, canProceedToStep, toast]);

    const handlePreviousStep = useCallback(() => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    }, [currentStep]);

    const goToStep = useCallback((step: number) => {
        if (step >= 1 && step <= 4 && canProceedToStep(step)) {
            setCurrentStep(step);
        }
    }, [canProceedToStep]);

    // Address handlers
    const handleAddressSelect = useCallback((addressId: string) => {
        const address = savedAddresses.find(addr => addr._id === addressId);
        if (address) {
            setSelectedAddressId(addressId);
            setShippingAddress(address);
        }
    }, [savedAddresses]);

    const handleAddressSubmit = useCallback(async (address: Omit<Address, '_id'>) => {
        try {
            if (customer) {
                const result = await checkoutService.addAddress(address);
                setSavedAddresses(prev => [...prev, result.address]);
                setShippingAddress(result.address);
                setSelectedAddressId(result.address._id || null);
                toast.success('Address saved');
            } else {
                setShippingAddress(address as Address);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save address');
        }
    }, [customer, toast]);

    // Billing address Handlers
    const handleBillingAddressSelect = useCallback((addressId: string) => {
        const address = savedAddresses.find(addr => addr._id === addressId);
        if (address) {
            setBillingAddress(address);
        }
    }, [savedAddresses]);

    const handleBillingAddressSubmit = useCallback(async (address: Omit<Address, '_id'>) => {
        // For guest, just set it locally. For logged in, maybe save it?
        // Logic similar to shipping address but setting billingAddress
        setBillingAddress(address as Address);
    }, []);

    // Payment handlers
    const handlePaymentSelect = useCallback((method: PaymentMethod) => {
        setSelectedPayment(method);
        const extraCharge = method.extraCharge || 0;
        setOrderSummary(prev => ({
            ...prev,
            total: prev.subtotal + prev.shipping + prev.tax - prev.discount + extraCharge,
        }));
    }, []);

    // Coupon handlers
    const handleApplyCoupon = useCallback(async () => {
        if (!couponCode.trim()) {
            toast.error('Please enter a coupon code');
            return;
        }
        try {
            setCouponLoading(true);
            const result = await checkoutService.applyCoupon(couponCode.trim());
            setAppliedCoupon(result.coupon);
            setOrderSummary(prev => ({
                ...prev,
                discount: result.coupon.discountAmount,
                total: prev.subtotal + prev.shipping + prev.tax - result.coupon.discountAmount,
            }));
            toast.success('Coupon applied');
            setCouponCode('');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to apply coupon');
        } finally {
            setCouponLoading(false);
        }
    }, [couponCode, toast]);

    const handleRemoveCoupon = useCallback(async () => {
        try {
            await checkoutService.removeCoupon();
            setAppliedCoupon(null);
            setOrderSummary(prev => ({
                ...prev,
                discount: 0,
                total: prev.subtotal + prev.shipping + prev.tax,
            }));
            toast.success('Coupon removed');
        } catch (error) {
            toast.error('Failed to remove coupon');
        }
    }, [toast]);

    // Place order
    const handlePlaceOrder = useCallback(async () => {
        if (restrictedItems.length > 0) {
            toast.error('Please remove restricted items');
            return;
        }
        if (!shippingAddress || (!billingAddress && !sameAsShipping) || !selectedPayment) {
            toast.error('Please complete all required fields');
            return;
        }
        if (storeConfig?.shippingEnabled && !shippingDetails) {
            toast.error('Please select a valid shipping method');
            return;
        }
        if (!customer && !guestEmail) {
            toast.error('Please enter your email');
            return;
        }
        try {
            setSubmitting(true);
            const orderData = {
                shippingAddress,
                billingAddress: (sameAsShipping ? shippingAddress : billingAddress) as Address,
                paymentMethod: selectedPayment.id,
                currency: typeof currency === 'string' ? currency : (currency.currentCurrency?.code || 'USD'),
                customerNote,
                guestEmail: !customer ? guestEmail : undefined,
                saveAddress: customer ? saveAddress : false,
            };
            const result = await checkoutService.createOrder(orderData);

            // Clear cart after successful order creation
            await clearCart();

            const redirectParams = new URLSearchParams();
            if (!customer && guestEmail) {
                redirectParams.append('guestEmail', guestEmail);
            }
            const queryString = redirectParams.toString() ? `?${redirectParams.toString()}` : '';
            if (result.order.paymentRequired) {
                router.push(`/orders/${result.order.orderId}/payment${queryString}`);
            } else {
                toast.success('Order placed successfully!');
                router.push(`/orders/${result.order.orderId}/confirmation${queryString}`);
            }
        } catch (error: any) {
            console.error('Order creation error:', error);
            toast.error(error.response?.data?.message || 'Failed to create order');
        } finally {
            setSubmitting(false);
        }
    }, [shippingAddress, billingAddress, sameAsShipping, selectedPayment, customer, guestEmail, currency, customerNote, saveAddress, router, toast, clearCart, restrictedItems, storeConfig, shippingDetails]);

    // Empty state
    if (showEmptyState) {
        return <EmptyCheckout />;
    }

    // Loading state
    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Preparing checkout...</p>
            </div>
        );
    }

    // Build context
    const contextValue: CheckoutContextType = {
        config,
        currentStep, checkoutMode, loading, submitting, cartItems, customer, isLoggedIn: !!customer, guestEmail,
        savedAddresses, shippingAddress, billingAddress, selectedAddressId, sameAsShipping,
        shippingCost, shippingDetails, paymentMethods, selectedPayment, taxBreakdown, couponCode, appliedCoupon,
        couponLoading, orderSummary, customerNote, saveAddress, storeConfig, restrictedItems,
        handleNextStep, handlePreviousStep, goToStep, canProceedToStep, handleAddressSelect,
        handleAddressSubmit, handleBillingAddressSelect, handleBillingAddressSubmit,
        setSameAsShipping, handlePaymentSelect, handleApplyCoupon,
        handleRemoveCoupon, setCouponCode, handlePlaceOrder, setGuestEmail, setCustomerNote, setSaveAddress,
    };

    // Render based on mode
    if (checkoutMode === 'one-page') {
        return (
            <CheckoutContext.Provider value={contextValue}>
                <div className={styles.checkoutContainer}>
                    <div className={styles.checkoutBody}>
                        <div className={styles.mainContent}>
                            {restrictedItems.length > 0 && (
                                <div className={styles.shippingModule}>
                                    <div className={styles.errorContainer} style={{ padding: '15px', backgroundColor: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '4px', color: '#c53030', marginBottom: '20px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>Shipping Restrictions</h3>
                                        <p style={{ marginBottom: '10px' }}>{`The following item${restrictedItems.length > 1 ? 's' : ''} cannot be shipped to your selected location`}:</p>
                                        <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                                            {restrictedItems.map((item, index) => (
                                                <li key={index} style={{ marginBottom: '4px' }}>{item}</li>
                                            ))}
                                        </ul>
                                        <p style={{ marginTop: '10px', fontSize: '14px' }}>Please remove these items or select a different shipping address.</p>
                                    </div>
                                </div>
                            )}
                            <CheckoutOnePage
                                config={config.onePage}
                                completedSections={{
                                    address: !!shippingAddress && restrictedItems.length === 0,
                                    shipping: shippingCost >= 0 && !!shippingDetails,
                                    payment: !!selectedPayment,
                                }}
                            >
                                {{
                                    address: <CheckoutAddress />,
                                    shipping: <CheckoutShipping />,
                                    payment: <CheckoutPayment />,
                                    review: <CheckoutReview />,
                                }}
                            </CheckoutOnePage>
                        </div>
                        <aside className={styles.sidebar}>
                            <CheckoutSummary />
                        </aside>
                    </div>
                </div>
            </CheckoutContext.Provider>
        );
    }

    // Stepper mode
    return (
        <CheckoutContext.Provider value={contextValue}>
            <div className={styles.checkoutContainer}>
                <CheckoutProgress
                    config={config.progress}
                    currentStep={currentStep}
                    onStepClick={goToStep}
                    canGoToStep={canProceedToStep}
                />

                <div className={styles.checkoutBody}>
                    <main className={styles.mainContent}>
                        {currentStep === 1 && <CheckoutAddress />}
                        {currentStep === 2 && <CheckoutShipping />}
                        {currentStep === 3 && <CheckoutPayment />}
                        {currentStep === 4 && <CheckoutReview />}

                        {restrictedItems.length > 0 && (
                            <div className={styles.shippingModule}>
                                <div className={styles.errorContainer} style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '4px', color: '#c53030' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>Shipping Restrictions</h3>
                                    <p style={{ marginBottom: '10px' }}>{`The following item${restrictedItems.length > 1 ? 's' : ''} cannot be shipped to your selected location`}:</p>
                                    <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                                        {restrictedItems.map((item, index) => (
                                            <li key={index} style={{ marginBottom: '4px' }}>{item}</li>
                                        ))}
                                    </ul>
                                    <p style={{ marginTop: '10px', fontSize: '14px' }}>Please remove these items or select a different shipping address.</p>
                                </div>
                            </div>
                        )}

                        <div className={styles.stepActions}>
                            {currentStep > 1 && (
                                <button
                                    className={styles.backButton}
                                    onClick={handlePreviousStep}
                                >
                                    Back
                                </button>
                            )}


                            {currentStep < 4 ? (
                                (currentStep !== 1 || shippingAddress) ? (
                                    <button
                                        className={styles.nextButton}
                                        onClick={handleNextStep}
                                        disabled={!canProceedToStep(currentStep + 1)}
                                    >
                                        Continue
                                    </button>
                                ) : null
                            ) : (
                                <button
                                    className={styles.placeOrderButton}
                                    onClick={handlePlaceOrder}
                                    disabled={submitting || restrictedItems.length > 0 || (storeConfig?.shippingEnabled && !shippingDetails)}
                                >
                                    {submitting ? 'Placing Order...' : 'Place Order'}
                                </button>
                            )}
                        </div>
                    </main>

                    <aside className={styles.sidebar}>
                        <CheckoutSummary />
                    </aside>
                </div>
            </div>
        </CheckoutContext.Provider>
    );
}
