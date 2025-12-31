// CheckoutAddress Module - Shipping and billing address selection

'use client';

import React, { useState, useEffect } from 'react';
import { useCheckout } from '../context';
import styles from './CheckoutAddress.module.scss';
import { getCountries, type Address, type GeoCountry } from '@/services/checkout.service';

// --- Types ---

export interface CheckoutAddressProps {
    config?: any; // Allow override
}

interface AddressFormProps {
    countries: GeoCountry[];
    onSubmit: (data: any) => Promise<void>;
    onCancel?: () => void;
    title: string;
    submitLabel: string;
    showCancel?: boolean;
    initialValues?: any;
    isGuest?: boolean;
    guestEmail?: string;
    setGuestEmail?: (email: string) => void;
}

interface SavedAddressListProps {
    addresses: Address[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAddNew: () => void;
    displayStyle: 'cards' | 'dropdown';
    maxItems: number;
}

// --- Sub-Components ---

const AddressForm = ({
    countries,
    onSubmit,
    onCancel,
    title,
    submitLabel,
    showCancel,
    initialValues,
    isGuest,
    guestEmail,
    setGuestEmail
}: AddressFormProps) => {
    const [formData, setFormData] = useState({
        firstName: initialValues?.firstName || '',
        lastName: initialValues?.lastName || '',
        phone: initialValues?.phone || '',
        address1: initialValues?.address1 || '',
        address2: initialValues?.address2 || '',
        city: initialValues?.city || '',
        state: initialValues?.state || '',
        postalCode: initialValues?.postalCode || '',
        country: initialValues?.country || '',
    });

    const [availableStates, setAvailableStates] = useState<any[]>([]);
    const [availableCities, setAvailableCities] = useState<any[]>([]);

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const countryId = e.target.value;
        const country = countries.find(c => c._id === countryId);

        if (country) {
            const countryValue = country.countryCode || country.countryName;
            setFormData(prev => ({
                ...prev,
                country: countryValue,
                state: '',
                city: '' // Clear city too when country changes
            }));
            setAvailableStates(country.states || []);
            setAvailableCities([]);
        } else {
            setFormData(prev => ({ ...prev, country: '', state: '', city: '' }));
            setAvailableStates([]);
            setAvailableCities([]);
        }
    };

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const stateCode = e.target.value;
        const state = availableStates.find(s => s.name === stateCode);

        setFormData(prev => ({ ...prev, state: stateCode, city: '' })); // Clear city when state changes

        if (state) {
            setAvailableCities(state.cities || []);
        } else {
            setAvailableCities([]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const phoneRegex = /^\+\d{1,4}\d{6,14}$/;
        if (!phoneRegex.test(formData.phone)) {
            alert('Phone number must start with country code (+) and contain no spaces. Example: +919876543210');
            return;
        }

        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.addressForm}>
            <h3 className={styles.formTitle}>{title}</h3>

            {isGuest && setGuestEmail && (
                <div className={styles.guestSection}>
                    <label className={styles.label}>
                        Email Address <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="your@email.com"
                        className={styles.input}
                        required
                    />
                    <p className={styles.helper}>We'll send order confirmation to this email</p>
                </div>
            )}

            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label>First Name</label>
                    <input
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Last Name</label>
                    <input
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                    />
                </div>
            </div>

            <div className={styles.formGroup}>
                <label>Address Line 1</label>
                <input
                    name="address1"
                    value={formData.address1}
                    onChange={handleInputChange}
                    required
                />
            </div>

            <div className={styles.formGroup}>
                <label>Address Line 2 (Optional)</label>
                <input
                    name="address2"
                    value={formData.address2}
                    onChange={handleInputChange}
                />
            </div>

            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label>City</label>
                    {availableCities.length > 0 ? (
                        <select
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange} // Just update value, no cascade
                            className={styles.select}
                            required
                        >
                            <option value="">Select City</option>
                            {availableCities.map((city: any) => (
                                <option key={city._id} value={city.name}>
                                    {city.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                        />
                    )}
                </div>
                <div className={styles.formGroup}>
                    <label>State/Province</label>
                    {availableStates.length > 0 ? (
                        <select
                            name="state"
                            value={formData.state}
                            onChange={handleStateChange}
                            className={styles.select}
                            required
                        >
                            <option value="">Select State</option>
                            {availableStates.map((state: any) => (
                                <option key={state._id} value={state.name}>
                                    {state.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            required
                        />
                    )}
                </div>
            </div>

            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label>Postal Code</label>
                    <input
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Country</label>
                    <select
                        name="country"
                        // value={formData.country} - Removed correct value logic below
                        // Actually, the select uses country._id as value in original code.
                        // But we store country.countryCode in formData.
                        // Wait, in handleCountryChange we use ID to lookup, then set formData.country.
                        // So the SELECT value must be derived or controlled properly.
                        // In original code: value={formData.country} was used on select.
                        // But options had value={country._id}. This works ONLY if formData.country === country._id.
                        // ORIGINAL BUG ALERT: Original code set formData.country = countryValue (code/name),
                        // but select options had value={country._id}.
                        // So the select would break (show nothing selected) after selection if values mismatch.
                        // FIX: We should use country._id for the select value if possible, or match by code.
                        // I will assume we should use the ID for the SELECT state, but store the NAME/CODE in formData?
                        // To keep it simple and consistent with previous "fix", I will use `country._id` as the option value.
                        // And I need to find the `_id` corresponding to `formData.country` to control the select?
                        // Or just force the user to re-select?
                        // Let's stick to using `_id` for values in the select.
                        // But `formData.country` holds the code/name.
                        // So `defaultValue` or `value` logic is tricky without extra state.
                        // I'll leave `value` uncontrolled or try to find it.
                        // Actually, let's keep it simple: The select `value` should match what's in options.
                        // If we store 'US' in formData, but option is '123', it won't match.
                        // I'll assume for now we can iterate countries to find the ID that matches formData.country.
                        value={countries.find(c => (c.countryCode || c.countryName) === formData.country)?._id || ''}
                        onChange={handleCountryChange}
                        className={styles.select}
                        required
                    >
                        <option value="">Select Country</option>
                        {countries.map(country => (
                            <option key={country._id} value={country._id}>
                                {country.countryName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.formGroup}>
                <label>Phone Number (e.g. +919876543210)</label>
                <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+919876543210"
                    required
                />
            </div>

            <div className={styles.formActions}>
                {showCancel && onCancel && (
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                )}
                <button type="submit" className={styles.submitBtn}>
                    {submitLabel}
                </button>
            </div>
        </form>
    );
};

const SavedAddressList = ({
    addresses,
    selectedId,
    onSelect,
    onAddNew,
    displayStyle,
    maxItems
}: SavedAddressListProps) => {
    const [showAll, setShowAll] = useState(false);

    const displayedAddresses = showAll ? addresses : addresses.slice(0, maxItems);
    const hasHidden = addresses.length > maxItems;

    if (displayStyle === 'dropdown') {
        return (
            <div className={styles.savedAddresses}>
                <h3 className={styles.subtitle}>Select a saved address</h3>
                <div className={styles.formGroup}>
                    <select
                        className={styles.select}
                        value={selectedId || ''}
                        onChange={(e) => {
                            if (e.target.value === 'new') onAddNew();
                            else onSelect(e.target.value);
                        }}
                    >
                        <option value="" disabled>Select an address</option>
                        {addresses.map((addr) => (
                            <option key={addr._id} value={addr._id}>
                                {addr.firstName} {addr.lastName} - {addr.address1}, {addr.city} ({addr.country})
                            </option>
                        ))}
                        <option value="new">+ Add New Address</option>
                    </select>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.savedAddresses}>
            <h3 className={styles.subtitle}>Select a saved address</h3>
            <div className={styles.addressGrid}>
                {displayedAddresses.map((addr) => (
                    <div
                        key={addr._id}
                        className={`${styles.addressCard} ${selectedId === addr._id ? styles.selected : ''}`}
                        onClick={() => onSelect(addr._id!)}
                    >
                        <div className={styles.cardHeader}>
                            <input
                                type="radio"
                                checked={selectedId === addr._id}
                                onChange={() => onSelect(addr._id!)}
                                className={styles.radio}
                            />
                            {addr.isDefault && (
                                <span className={styles.defaultBadge}>Default</span>
                            )}
                        </div>
                        <div className={styles.cardBody}>
                            <strong>{addr.firstName} {addr.lastName}</strong>
                            <p>{addr.address1}</p>
                            {addr.address2 && <p>{addr.address2}</p>}
                            <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                            <p>{addr.country}</p>
                            <p className={styles.phone}>{addr.phone}</p>
                        </div>
                    </div>
                ))}

                {hasHidden && !showAll && (
                    <div
                        className={`${styles.addressCard} ${styles.showMore}`}
                        onClick={() => setShowAll(true)}
                    >
                        <div className={styles.addNewContent}>
                            <span>+{addresses.length - maxItems} More</span>
                            <span style={{ fontSize: '0.8rem' }}>Show All</span>
                        </div>
                    </div>
                )}

                {hasHidden && showAll && (
                    <div
                        className={`${styles.addressCard} ${styles.showMore}`}
                        onClick={() => setShowAll(false)}
                    >
                        <div className={styles.addNewContent}>
                            <span>Show Less</span>
                        </div>
                    </div>
                )}

                <div
                    className={`${styles.addressCard} ${styles.addNew}`}
                    onClick={onAddNew}
                >
                    <div className={styles.addNewContent}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                        <span>Add New Address</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SelectedAddressDisplay = ({ address, onChange }: { address: Address, onChange?: () => void }) => (
    <div className={styles.selectedAddress}>
        <div className={styles.selectedHeader}>
            <h4>Delivering to:</h4>
            {onChange && (
                <button onClick={onChange} className={styles.changeBtn}>Change</button>
            )}
        </div>
        <div className={styles.selectedBody}>
            <strong>{address.firstName} {address.lastName}</strong>
            <p>{address.address1}</p>
            {address.address2 && <p>{address.address2}</p>}
            <p>{address.city}, {address.state} {address.postalCode}</p>
            <p>{address.phone}</p>
        </div>
    </div>
);

// --- Main Component ---

export default function CheckoutAddress({ config: propsConfig }: CheckoutAddressProps) {
    const {
        config: globalConfig,
        savedAddresses,
        shippingAddress,
        billingAddress,
        selectedAddressId,
        sameAsShipping,
        isLoggedIn,
        guestEmail,
        handleAddressSelect,
        handleAddressSubmit,
        handleBillingAddressSelect,
        handleBillingAddressSubmit,
        setSameAsShipping,
        setGuestEmail
    } = useCheckout();

    const config = propsConfig || globalConfig?.address || {};
    const {
        displayStyle = 'cards',
        showBillingToggle = true,
        maxSavedAddresses = 5,
    } = config;

    // State for Shipping
    const [showShippingForm, setShowShippingForm] = useState(false);
    const [isAddingNewShipping, setIsAddingNewShipping] = useState(false);

    // State for Billing
    const [showBillingForm, setShowBillingForm] = useState(false);
    const [isAddingNewBilling, setIsAddingNewBilling] = useState(false);
    // We need to track selected Billing Address ID separately if it's not in context nicely,
    // but useCheckout provides `billingAddress` object. We can check if `billingAddress._id` exists.
    // However, `handleBillingAddressSelect` accepts an ID.
    // We should probably rely on `billingAddress?._id` to know what's selected?
    // Let's assume `billingAddress` from context is the source of truth.

    const [availableCountries, setAvailableCountries] = useState<GeoCountry[]>([]);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const { countries } = await getCountries();
                setAvailableCountries(countries.filter(c => c.isShippingAvailable !== false));
            } catch (error) {
                console.error('Failed to load countries', error);
            }
        };
        fetchCountries();
    }, []);

    // Handlers
    const handleNewShippingSubmit = async (data: any) => {
        try {
            await handleAddressSubmit({ ...data, type: 'shipping' });
            setShowShippingForm(false);
            setIsAddingNewShipping(false);
        } catch (e) { console.error(e); }
    };

    const handleNewBillingSubmit = async (data: any) => {
        try {
            await handleBillingAddressSubmit({ ...data, type: 'billing' });
            setShowBillingForm(false);
            setIsAddingNewBilling(false);
        } catch (e) { console.error(e); }
    };

    return (
        <div className={styles.addressModule}>

            {/* --- SHIPPING SECTION --- */}
            <h2 className={styles.title}>Shipping Address</h2>

            {/* View 1: Saved Addresses List (only if logged in and has addresses and not adding new) */}
            {isLoggedIn && savedAddresses.length > 0 && !showShippingForm && (
                <SavedAddressList
                    addresses={savedAddresses}
                    selectedId={selectedAddressId}
                    onSelect={handleAddressSelect}
                    onAddNew={() => {
                        setShowShippingForm(true);
                        setIsAddingNewShipping(true);
                    }}
                    displayStyle={displayStyle}
                    maxItems={maxSavedAddresses}
                />
            )}

            {/* View 2: Address Form (if adding new OR guest with no address OR logged in with no saved addresses) */}
            {(showShippingForm || (!isLoggedIn && !shippingAddress) || (isLoggedIn && savedAddresses.length === 0 && !shippingAddress)) && (
                <AddressForm
                    title={isLoggedIn ? 'Add New Address' : 'Enter Shipping Details'}
                    submitLabel={isLoggedIn ? 'Save Address' : 'Continue'}
                    countries={availableCountries}
                    onSubmit={handleNewShippingSubmit}
                    onCancel={isLoggedIn && savedAddresses.length > 0 ? () => {
                        setShowShippingForm(false);
                        setIsAddingNewShipping(false);
                    } : undefined}
                    showCancel={isLoggedIn && savedAddresses.length > 0}
                    isGuest={!isLoggedIn}
                    guestEmail={guestEmail}
                    setGuestEmail={setGuestEmail}
                />
            )}

            {/* View 3: Selected Summary (if address selected and form hidden, and we aren't showing the list) */}
            {shippingAddress && !showShippingForm && (!isLoggedIn || savedAddresses.length === 0) && (
                <SelectedAddressDisplay
                    address={shippingAddress}
                    onChange={() => setShowShippingForm(true)}
                />
            )}


            {/* --- BILLING SECTION --- */}

            {showBillingToggle && shippingAddress && (
                <div className={styles.billingToggle}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={sameAsShipping}
                            onChange={(e) => setSameAsShipping(e.target.checked)}
                            className={styles.checkbox}
                        />
                        <span>Billing address same as shipping</span>
                    </label>
                </div>
            )}

            {!sameAsShipping && shippingAddress && (
                <div className={styles.billingSection}>
                    <h3 className={styles.subtitle} style={{ marginTop: '2rem' }}>Billing Address</h3>

                    {/* View 1: Saved Addresses List (only if logged in and has addresses) */}
                    {isLoggedIn && savedAddresses.length > 0 && !showBillingForm && (
                        <SavedAddressList
                            addresses={savedAddresses}
                            selectedId={billingAddress?._id || null}
                            onSelect={handleBillingAddressSelect}
                            onAddNew={() => {
                                setShowBillingForm(true);
                                setIsAddingNewBilling(true);
                            }}
                            displayStyle={displayStyle}
                            maxItems={maxSavedAddresses}
                        />
                    )}

                    {/* View 2: Billing Form (if adding new OR guest with no billing OR logged in with no saved addresses) */}
                    {(showBillingForm || (!isLoggedIn && !billingAddress) || (isLoggedIn && savedAddresses.length === 0 && !billingAddress)) && (
                        <AddressForm
                            title="Enter Billing Address"
                            submitLabel="Save Billing Address"
                            countries={availableCountries}
                            onSubmit={handleNewBillingSubmit}
                            onCancel={savedAddresses.length > 0 ? () => {
                                setShowBillingForm(false);
                                setIsAddingNewBilling(false);
                            } : undefined}
                            showCancel={savedAddresses.length > 0}
                        />
                    )}

                    {/* View 3: Selected Billing Summary */}
                    {billingAddress && !showBillingForm && (
                        <div className={styles.selectedAddress}>
                            <div className={styles.selectedHeader}>
                                <h4>Billing To:</h4>
                                <button onClick={() => setShowBillingForm(true)} className={styles.changeBtn}>Change</button>
                            </div>
                            <div className={styles.selectedBody}>
                                <strong>{billingAddress.firstName} {billingAddress.lastName}</strong>
                                <p>{billingAddress.address1}</p>
                                {billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}
                                <p>{billingAddress.country}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}


