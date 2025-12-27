'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { useCurrency } from '@/hooks/useCurrency';
import { formatPrice } from '@/lib/currency';
import * as checkoutService from '@/services/checkout.service';
import type { Address, PaymentMethod, TaxBreakdown } from '@/services/checkout.service';
import AddressForm from './components/AddressForm';
import styles from './page.module.scss';

interface OrderSummary {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { customer, isLoading: authLoading } = useAuth();
    const toast = useToast();
    const currency = useCurrency();

    // Step management
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Cart validation
    const [cartValid, setCartValid] = useState(false);
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [storeConfig, setStoreConfig] = useState<any>(null);

    // Addresses
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
    const [billingAddress, setBillingAddress] = useState<Address | null>(null);
    const [sameAsShipping, setSameAsShipping] = useState(true);
    const [saveAddress, setSaveAddress] = useState(false);
    const [guestEmail, setGuestEmail] = useState('');
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [showBillingAddressForm, setShowBillingAddressForm] = useState(false);
    const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | null>(null);

    // Shipping
    const [shippingCost, setShippingCost] = useState<number>(0);
    const [shippingBreakdown, setShippingBreakdown] = useState<any[]>([]);

    // Tax
    const [taxBreakdown, setTaxBreakdown] = useState<TaxBreakdown[]>([]);

    // Payment
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);

    // Coupon
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponLoading, setCouponLoading] = useState(false);

    // Order summary
    const [orderSummary, setOrderSummary] = useState<OrderSummary>({
        subtotal: 0,
        shipping: 0,
        tax: 0,
        discount: 0,
        total: 0,
    });

    // Customer note
    const [customerNote, setCustomerNote] = useState('');

    // Initialize checkout on mount - wait for auth to load first
    useEffect(() => {
        if (!authLoading) {
            initializeCheckout();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading]); // Run when auth loading completes

    const initializeCheckout = async () => {
        try {
            setLoading(true);

            // Validate cart
            const validation = await checkoutService.validateCheckout();

            if (!validation || !validation.valid) {
                toast.error(validation?.issues?.join(', ') || 'Cart validation failed');
                router.push('/cart');
                return;
            }

            setCartValid(true);
            setCartItems(validation.cart.items);
            setStoreConfig(validation.storeConfig);
            setOrderSummary(prev => ({
                ...prev,
                subtotal: validation.cart.subtotal,
                total: validation.cart.subtotal,
            }));

            // Check if guest checkout is required
            if (!customer && !validation.storeConfig.guestCheckoutEnabled) {
                toast.error('Please log in to checkout');
                router.push('/login?redirect=/checkout');
                return;
            }

            // Load saved addresses for logged-in users
            if (customer) {
                const { addresses } = await checkoutService.getAddresses();
                setSavedAddresses(addresses);
                // Auto-select default address
                const defaultAddress = addresses.find(addr => addr.isDefault && addr.type === 'shipping');
                if (defaultAddress) {
                    setSelectedAddressId(defaultAddress._id || null);
                    setShippingAddress(defaultAddress);
                }
            }

            setLoading(false);
        } catch (error: any) {
            console.error('Checkout initialization error:', error);
            toast.error(error.response?.data?.message || 'Failed to initialize checkout');
            setLoading(false);
        }
    };

    // Handle address selection
    const handleAddressSelect = (addressId: string) => {
        const address = savedAddresses.find(addr => addr._id === addressId);
        if (address) {
            setSelectedAddressId(addressId);
            setShippingAddress(address);
            setShowAddressForm(false);
        }
    };

    // Handle new address submission
    const handleAddressSubmit = async (address: Address) => {
        try {
            if (customer) {
                // Save address for logged-in user
                const result = await checkoutService.addAddress(address);
                setSavedAddresses(prev => [...prev, result.address]);
                setShippingAddress(result.address);
                setSelectedAddressId(result.address._id || null);
                toast.success('Address saved successfully');
            } else {
                // For guest users, just use the address
                setShippingAddress(address);
            }
            setShowAddressForm(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save address');
        }
    };

    const handleBillingAddressSelect = (addressId: string) => {
        const address = savedAddresses.find((a) => a._id === addressId);
        if (address) {
            setBillingAddress(address);
            setSelectedBillingAddressId(addressId);
            setShowBillingAddressForm(false);
        }
    };

    const handleBillingAddressSubmit = (address: Address) => {
        setBillingAddress(address);
        setShowBillingAddressForm(false);
    };

    // Handle shipping address change
    useEffect(() => {
        if (shippingAddress && shippingAddress.country && storeConfig) {
            loadShippingMethods();
            loadTax();
            loadPaymentMethods();
        }
    }, [shippingAddress, storeConfig]);

    // Load shipping cost using smart calculation
    const loadShippingMethods = async () => {
        if (!shippingAddress || !storeConfig?.shippingEnabled || !cartItems.length) return;

        try {
            const result = await checkoutService.getShippingMethods(shippingAddress, cartItems);

            setShippingCost(result.shippingCost);
            setShippingBreakdown(result.breakdown || []);

            // Update order summary with calculated shipping cost
            setOrderSummary(prev => ({
                ...prev,
                shipping: result.shippingCost,
                total: prev.subtotal + result.shippingCost + prev.tax - prev.discount,
            }));
        } catch (error: any) {
            console.error('Failed to calculate shipping:', error);
            toast.error('Failed to calculate shipping cost');
        }
    };

    // Load tax
    const loadTax = async () => {
        if (!shippingAddress) return;

        try {
            const taxData = await checkoutService.calculateTax(
                shippingAddress,
                shippingCost
            );
            setTaxBreakdown(taxData.taxBreakdown);
            setOrderSummary(prev => ({
                ...prev,
                tax: taxData.totalTax,
                total: prev.subtotal + prev.shipping + taxData.totalTax - prev.discount,
            }));
        } catch (error: any) {
            console.error('Failed to calculate tax:', error);
        }
    };

    // Load payment methods
    const loadPaymentMethods = async () => {
        if (!shippingAddress) return;
        try {
            const { methods } = await checkoutService.getPaymentMethods(
                shippingAddress.country,
                orderSummary.total,
                typeof currency === 'string' ? currency : (currency?.code || 'USD')
            );
            setPaymentMethods(methods);

            // Auto-select first method
            if (methods.length > 0 && !selectedPayment) {
                setSelectedPayment(methods[0]);
            }
        } catch (error: any) {
            console.error('Failed to load payment methods:', error);
            toast.error('Failed to load payment methods');
        }
    };

    // Recalculate tax when shipping cost changes
    useEffect(() => {
        if (shippingCost > 0 && shippingAddress) {
            loadTax();
        }
    }, [shippingCost]);

    // Handle payment method selection
    const handlePaymentSelect = (method: PaymentMethod) => {
        setSelectedPayment(method);

        // Add extra charge if applicable (e.g., COD fee)
        const extraCharge = method.extraCharge || 0;
        setOrderSummary(prev => ({
            ...prev,
            total: prev.subtotal + prev.shipping + prev.tax - prev.discount + extraCharge,
        }));
    };

    // Handle coupon application
    const handleApplyCoupon = async () => {
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

            toast.success('Coupon applied successfully');
            setCouponCode('');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to apply coupon');
        } finally {
            setCouponLoading(false);
        }
    };

    // Handle coupon removal
    const handleRemoveCoupon = async () => {
        try {
            await checkoutService.removeCoupon();

            setAppliedCoupon(null);
            setOrderSummary(prev => ({
                ...prev,
                discount: 0,
                total: prev.subtotal + prev.shipping + prev.tax,
            }));

            toast.success('Coupon removed');
        } catch (error: any) {
            toast.error('Failed to remove coupon');
        }
    };

    // Handle order submission
    const handlePlaceOrder = async () => {
        if (!shippingAddress || (!billingAddress && !sameAsShipping) || !selectedPayment) {
            toast.error('Please complete all required fields');
            return;
        }

        if (!customer && !guestEmail) {
            toast.error('Please enter your email address');
            return;
        }

        try {
            setSubmitting(true);

            const orderData = {
                shippingAddress,
                billingAddress: (sameAsShipping ? shippingAddress : billingAddress) as Address,
                shippingCost: shippingCost,
                paymentMethod: selectedPayment.id,
                currency: typeof currency === 'string' ? currency : (currency?.code || 'USD'),
                customerNote,
                guestEmail: !customer ? guestEmail : undefined,
                saveAddress: customer ? saveAddress : false,
            };

            const result = await checkoutService.createOrder(orderData);

            toast.success('Order placed successfully!');

            // Redirect to order confirmation or payment page
            const redirectParams = new URLSearchParams();
            if (!customer && guestEmail) {
                redirectParams.append('guestEmail', guestEmail);
            }
            const queryString = redirectParams.toString() ? `?${redirectParams.toString()}` : '';

            if (result.order.paymentRequired) {
                // Redirect to payment page for gateway initialization
                router.push(`/orders/${result.order.orderId}/payment${queryString}`);
            } else {
                // COD or offline payment - go directly to confirmation
                router.push(`/orders/${result.order.orderId}/confirmation${queryString}`);
            }
        } catch (error: any) {
            console.error('Order creation error:', error);
            toast.error(error.response?.data?.message || 'Failed to create order');
        } finally {
            setSubmitting(false);
        }
    };

    // Step navigation
    const canProceedToStep = (step: number): boolean => {
        switch (step) {
            case 2:
                return !!shippingAddress;
            case 3:
                return !!shippingAddress && (storeConfig?.shippingEnabled ? shippingCost >= 0 : true);
            case 4:
                return !!shippingAddress && !!selectedPayment && (sameAsShipping || !!billingAddress);
            default:
                return true;
        }
    };

    const handleNextStep = () => {
        if (canProceedToStep(currentStep + 1)) {
            setCurrentStep(currentStep + 1);
        } else {
            toast.error('Please complete the current step');
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading checkout...</p>
            </div>
        );
    }

    if (!cartValid) {
        return null;
    }

    return (
        <div className={styles.checkoutPage}>
            <div className={styles.container}>
                {/* Progress Indicator */}
                <div className={styles.progressBar}>
                    <div className={`${styles.step} ${currentStep >= 1 ? styles.active : ''} ${currentStep > 1 ? styles.completed : ''}`}>
                        <div className={styles.stepNumber}>1</div>
                        <div className={styles.stepLabel}>Address</div>
                    </div>
                    <div className={styles.stepLine}></div>
                    <div className={`${styles.step} ${currentStep >= 2 ? styles.active : ''} ${currentStep > 2 ? styles.completed : ''}`}>
                        <div className={styles.stepNumber}>2</div>
                        <div className={styles.stepLabel}>Shipping</div>
                    </div>
                    <div className={styles.stepLine}></div>
                    <div className={`${styles.step} ${currentStep >= 3 ? styles.active : ''} ${currentStep > 3 ? styles.completed : ''}`}>
                        <div className={styles.stepNumber}>3</div>
                        <div className={styles.stepLabel}>Payment</div>
                    </div>
                    <div className={styles.stepLine}></div>
                    <div className={`${styles.step} ${currentStep >= 4 ? styles.active : ''}`}>
                        <div className={styles.stepNumber}>4</div>
                        <div className={styles.stepLabel}>Review</div>
                    </div>
                </div>

                <div className={styles.checkoutContent}>
                    {/* Main Content Area */}
                    <div className={styles.mainContent}>
                        {/* Step 1: Address */}
                        {currentStep === 1 && (
                            <div className={styles.stepContent}>
                                <h2>Shipping Address</h2>

                                {!customer && (
                                    <div className={styles.guestEmail}>
                                        <label>Email Address *</label>
                                        <input
                                            type="email"
                                            value={guestEmail}
                                            onChange={(e) => setGuestEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            required
                                        />
                                    </div>
                                )}

                                {/* Saved addresses for logged-in users */}
                                {customer && savedAddresses.length > 0 && !showAddressForm && (
                                    <div className={styles.savedAddresses}>
                                        <h3>Saved Addresses</h3>
                                        {savedAddresses.map((addr) => (
                                            <div
                                                key={addr._id}
                                                className={`${styles.addressCard} ${selectedAddressId === addr._id ? styles.selected : ''}`}
                                                onClick={() => handleAddressSelect(addr._id!)}
                                            >
                                                <input
                                                    type="radio"
                                                    checked={selectedAddressId === addr._id}
                                                    onChange={() => handleAddressSelect(addr._id!)}
                                                />
                                                <div className={styles.addressDetails}>
                                                    <strong>{addr.firstName} {addr.lastName}</strong>
                                                    <p>{addr.address1}</p>
                                                    {addr.address2 && <p>{addr.address2}</p>}
                                                    <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                                                    <p>{addr.country}</p>
                                                    <p>{addr.phone}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            className={styles.btnAddNew}
                                            onClick={() => setShowAddressForm(true)}
                                        >
                                            + Add New Address
                                        </button>
                                    </div>
                                )}

                                {/* Address Form */}
                                {(showAddressForm || !shippingAddress || (!customer && !shippingAddress)) && (
                                    <div className={styles.addressFormSection}>
                                        {customer && savedAddresses.length > 0 && (
                                            <h3>Add New Address</h3>
                                        )}
                                        <AddressForm
                                            type="shipping"
                                            onSubmit={handleAddressSubmit}
                                            onCancel={customer && savedAddresses.length > 0 ? () => setShowAddressForm(false) : undefined}
                                            submitLabel={customer ? "Save Address" : "Continue"}
                                        />
                                    </div>
                                )}

                                {customer && saveAddress && (
                                    <div className={styles.saveAddressOption}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={saveAddress}
                                                onChange={(e) => setSaveAddress(e.target.checked)}
                                            />
                                            <span>Save this address for future orders</span>
                                        </label>
                                    </div>
                                )}

                                <div className={styles.stepActions}>
                                    <button
                                        className={styles.btnPrimary}
                                        onClick={handleNextStep}
                                        disabled={!shippingAddress}
                                    >
                                        Continue to Shipping
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Shipping Method */}
                        {currentStep === 2 && (
                            <div className={styles.stepContent}>
                                <h2>Shipping</h2>

                                {storeConfig?.shippingEnabled ? (
                                    <div className={styles.shippingInfo}>
                                        <div className={styles.shippingCost}>
                                            <h3>Shipping Cost</h3>
                                            <p className={styles.cost}>{formatPrice(shippingCost, currency)}</p>
                                        </div>

                                        {shippingBreakdown && shippingBreakdown.length > 0 && (
                                            <div className={styles.shippingBreakdown}>
                                                <h4>Breakdown</h4>
                                                {shippingBreakdown.map((item, index) => (
                                                    <div key={index} className={styles.breakdownItem}>
                                                        <span>{item.ruleName} ({item.ruleType})</span>
                                                        <span>{formatPrice(item.cost, currency)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p>Shipping is not required for this order.</p>
                                )}

                                <div className={styles.stepActions}>
                                    <button className={styles.btnSecondary} onClick={handlePreviousStep}>
                                        Back
                                    </button>
                                    <button
                                        className={styles.btnPrimary}
                                        onClick={handleNextStep}
                                    >
                                        Continue to Payment
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Payment Method */}
                        {currentStep === 3 && (
                            <div className={styles.stepContent}>
                                {/* Billing Address Section */}
                                <div className={styles.section}>
                                    <h2>Billing Address</h2>
                                    <div className={styles.billingOptions}>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={sameAsShipping}
                                                onChange={(e) => setSameAsShipping(e.target.checked)}
                                            />
                                            <span>My billing address is the same as my shipping address</span>
                                        </label>
                                    </div>

                                    {!sameAsShipping && (
                                        <div className={styles.billingAddressForm}>
                                            {/* Saved addresses for billing */}
                                            {customer && savedAddresses.length > 0 && !showBillingAddressForm && (
                                                <div className={styles.savedAddresses}>
                                                    <h3>Select Billing Address</h3>
                                                    {savedAddresses.map((addr) => (
                                                        <div
                                                            key={addr._id}
                                                            className={`${styles.addressCard} ${selectedBillingAddressId === addr._id ? styles.selected : ''}`}
                                                            onClick={() => handleBillingAddressSelect(addr._id!)}
                                                        >
                                                            <input
                                                                type="radio"
                                                                checked={selectedBillingAddressId === addr._id}
                                                                onChange={() => handleBillingAddressSelect(addr._id!)}
                                                            />
                                                            <div className={styles.addressDetails}>
                                                                <strong>{addr.firstName} {addr.lastName}</strong>
                                                                <p>{addr.address1}</p>
                                                                <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button
                                                        className={styles.btnAddNew}
                                                        onClick={() => setShowBillingAddressForm(true)}
                                                    >
                                                        + Add New Billing Address
                                                    </button>
                                                </div>
                                            )}

                                            {/* Billing Address Form */}
                                            {(showBillingAddressForm || (!customer && !billingAddress) || (customer && savedAddresses.length === 0 && !billingAddress)) && (
                                                <div className={styles.addressFormSection}>
                                                    <AddressForm
                                                        type="billing"
                                                        initialAddress={billingAddress || undefined}
                                                        onSubmit={handleBillingAddressSubmit}
                                                        onCancel={customer && savedAddresses.length > 0 ? () => setShowBillingAddressForm(false) : undefined}
                                                        submitLabel="Use this Billing Address"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <h2>Payment Method</h2>

                                <div className={styles.paymentMethods}>
                                    {paymentMethods.map((method) => (
                                        <div
                                            key={method.id}
                                            className={`${styles.paymentCard} ${selectedPayment?.id === method.id ? styles.selected : ''}`}
                                            onClick={() => handlePaymentSelect(method)}
                                        >
                                            <input
                                                type="radio"
                                                checked={selectedPayment?.id === method.id}
                                                onChange={() => handlePaymentSelect(method)}
                                            />
                                            <div className={styles.paymentDetails}>
                                                {method.icon && <img src={method.icon} alt={method.name} />}
                                                <div>
                                                    <strong>{method.name}</strong>
                                                    <p>{method.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className={styles.stepActions}>
                                    <button className={styles.btnSecondary} onClick={handlePreviousStep}>
                                        Back
                                    </button>
                                    <button
                                        className={styles.btnPrimary}
                                        onClick={handleNextStep}
                                        disabled={!selectedPayment}
                                    >
                                        Review Order
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Review */}
                        {currentStep === 4 && (
                            <div className={styles.stepContent}>
                                <h2>Review Your Order</h2>

                                <div className={styles.reviewSection}>
                                    <h3>Shipping Address</h3>
                                    {shippingAddress && (
                                        <div className={styles.reviewAddress}>
                                            <p><strong>{shippingAddress.firstName} {shippingAddress.lastName}</strong></p>
                                            <p>{shippingAddress.address1}</p>
                                            {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
                                            <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                                            <p>{shippingAddress.country}</p>
                                            <p>{shippingAddress.phone}</p>
                                            <button className={styles.btnEdit} onClick={() => setCurrentStep(1)}>Edit</button>
                                        </div>
                                    )}
                                </div>

                                {storeConfig?.shippingEnabled && shippingCost > 0 && (
                                    <div className={styles.reviewSection}>
                                        <h3>Shipping Cost</h3>
                                        <p>{formatPrice(shippingCost, currency)}</p>
                                        <button className={styles.btnEdit} onClick={() => setCurrentStep(2)}>Edit</button>
                                    </div>
                                )}

                                {selectedPayment && (
                                    <div className={styles.reviewSection}>
                                        <h3>Payment Method</h3>
                                        <p>{selectedPayment.name}</p>
                                        <button className={styles.btnEdit} onClick={() => setCurrentStep(3)}>Edit</button>
                                    </div>
                                )}

                                <div className={styles.customerNoteSection}>
                                    <label>Order Notes (Optional)</label>
                                    <textarea
                                        value={customerNote}
                                        onChange={(e) => setCustomerNote(e.target.value)}
                                        placeholder="Special instructions for your order..."
                                        rows={4}
                                    />
                                </div>

                                <div className={styles.stepActions}>
                                    <button className={styles.btnSecondary} onClick={handlePreviousStep}>
                                        Back
                                    </button>
                                    <button
                                        className={styles.btnPrimary}
                                        onClick={handlePlaceOrder}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Placing Order...' : 'Place Order'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className={styles.orderSummary}>
                        <h3>Order Summary</h3>

                        <div className={styles.summaryItems}>
                            <div className={styles.summaryRow}>
                                <span>Subtotal ({cartItems.length} items)</span>
                                <span>{formatPrice(orderSummary.subtotal, currency)}</span>
                            </div>

                            {storeConfig?.shippingEnabled && (
                                <div className={styles.summaryRow}>
                                    <span>Shipping</span>
                                    <span>{formatPrice(orderSummary.shipping, currency)}</span>
                                </div>
                            )}

                            <div className={styles.summaryRow}>
                                <span>Tax</span>
                                <span>{formatPrice(orderSummary.tax, currency)}</span>
                            </div>

                            {appliedCoupon && (
                                <div className={`${styles.summaryRow} ${styles.discount}`}>
                                    <span>Discount ({appliedCoupon.code})</span>
                                    <span>-{formatPrice(orderSummary.discount, currency)}</span>
                                </div>
                            )}

                            <div className={`${styles.summaryRow} ${styles.total}`}>
                                <strong>Total</strong>
                                <strong>{formatPrice(orderSummary.total, currency)}</strong>
                            </div>
                        </div>

                        {/* Coupon Input */}
                        <div className={styles.couponSection}>
                            {!appliedCoupon ? (
                                <div className={styles.couponInput}>
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder="Coupon code"
                                        disabled={couponLoading}
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        disabled={couponLoading || !couponCode.trim()}
                                    >
                                        {couponLoading ? 'Applying...' : 'Apply'}
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.appliedCoupon}>
                                    <span className={styles.couponBadge}>{appliedCoupon.code}</span>
                                    <span className={styles.couponDiscount}>-{formatPrice(appliedCoupon.discountAmount, currency)}</span>
                                    <button className={styles.btnRemove} onClick={handleRemoveCoupon}>×</button>
                                </div>
                            )}
                        </div>

                        {/* Cart Items Preview */}
                        <div className={styles.cartPreview}>
                            <h4>Items in Cart</h4>
                            {cartItems.slice(0, 3).map((item, index) => (
                                <div key={index} className={styles.cartItem}>
                                    <span>{item.name} × {item.quantity}</span>
                                </div>
                            ))}
                            {cartItems.length > 3 && (
                                <p className={styles.moreItems}>+{cartItems.length - 3} more items</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
