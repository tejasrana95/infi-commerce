'use client';

import { useState, useEffect } from 'react';
import type { Address } from '@/services/checkout.service';
import styles from './AddressForm.module.scss';

interface AddressFormProps {
    initialAddress?: Partial<Address>;
    onSubmit: (address: Address) => void;
    onCancel?: () => void;
    type?: 'shipping' | 'billing';
    submitLabel?: string;
}

// Common countries (you can expand this list)
const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'IN', name: 'India' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'CN', name: 'China' },
    { code: 'BR', name: 'Brazil' },
];

// US States
const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

// Indian States
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
    'West Bengal'
];

export default function AddressForm({
    initialAddress,
    onSubmit,
    onCancel,
    type = 'shipping',
    submitLabel = 'Save Address'
}: AddressFormProps) {
    const [formData, setFormData] = useState<Partial<Address>>({
        type,
        firstName: '',
        lastName: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        country: 'US',
        postalCode: '',
        phone: '',
        isDefault: false,
        ...initialAddress,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [states, setStates] = useState<string[]>(US_STATES);

    // Update states list when country changes
    useEffect(() => {
        if (formData.country === 'US') {
            setStates(US_STATES);
        } else if (formData.country === 'IN') {
            setStates(INDIAN_STATES);
        } else {
            setStates([]);
        }
        // Reset state when country changes
        setFormData(prev => ({ ...prev, state: '' }));
    }, [formData.country]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName?.trim()) {
            newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName?.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        if (!formData.address1?.trim()) {
            newErrors.address1 = 'Address is required';
        }

        if (!formData.city?.trim()) {
            newErrors.city = 'City is required';
        }

        if (!formData.state?.trim()) {
            newErrors.state = 'State is required';
        }

        if (!formData.country?.trim()) {
            newErrors.country = 'Country is required';
        }

        if (!formData.postalCode?.trim()) {
            newErrors.postalCode = 'Postal code is required';
        }

        if (!formData.phone?.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
            newErrors.phone = 'Invalid phone number format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validate()) {
            onSubmit(formData as Address);
        }
    };

    return (
        <form className={styles.addressForm} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
                {/* First Name */}
                <div className={styles.formGroup}>
                    <label htmlFor="firstName">
                        First Name <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName || ''}
                        onChange={handleChange}
                        className={errors.firstName ? styles.error : ''}
                    />
                    {errors.firstName && <span className={styles.errorMessage}>{errors.firstName}</span>}
                </div>

                {/* Last Name */}
                <div className={styles.formGroup}>
                    <label htmlFor="lastName">
                        Last Name <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName || ''}
                        onChange={handleChange}
                        className={errors.lastName ? styles.error : ''}
                    />
                    {errors.lastName && <span className={styles.errorMessage}>{errors.lastName}</span>}
                </div>

                {/* Address Line 1 */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label htmlFor="address1">
                        Address Line 1 <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="text"
                        id="address1"
                        name="address1"
                        value={formData.address1 || ''}
                        onChange={handleChange}
                        placeholder="Street address, P.O. box, company name"
                        className={errors.address1 ? styles.error : ''}
                    />
                    {errors.address1 && <span className={styles.errorMessage}>{errors.address1}</span>}
                </div>

                {/* Address Line 2 */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label htmlFor="address2">Address Line 2 (Optional)</label>
                    <input
                        type="text"
                        id="address2"
                        name="address2"
                        value={formData.address2 || ''}
                        onChange={handleChange}
                        placeholder="Apartment, suite, unit, building, floor, etc."
                    />
                </div>

                {/* City */}
                <div className={styles.formGroup}>
                    <label htmlFor="city">
                        City <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city || ''}
                        onChange={handleChange}
                        className={errors.city ? styles.error : ''}
                    />
                    {errors.city && <span className={styles.errorMessage}>{errors.city}</span>}
                </div>

                {/* State */}
                <div className={styles.formGroup}>
                    <label htmlFor="state">
                        State/Province <span className={styles.required}>*</span>
                    </label>
                    {states.length > 0 ? (
                        <select
                            id="state"
                            name="state"
                            value={formData.state || ''}
                            onChange={handleChange}
                            className={errors.state ? styles.error : ''}
                        >
                            <option value="">Select State</option>
                            {states.map(state => (
                                <option key={state} value={state}>
                                    {state}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            id="state"
                            name="state"
                            value={formData.state || ''}
                            onChange={handleChange}
                            className={errors.state ? styles.error : ''}
                        />
                    )}
                    {errors.state && <span className={styles.errorMessage}>{errors.state}</span>}
                </div>

                {/* Country */}
                <div className={styles.formGroup}>
                    <label htmlFor="country">
                        Country <span className={styles.required}>*</span>
                    </label>
                    <select
                        id="country"
                        name="country"
                        value={formData.country || ''}
                        onChange={handleChange}
                        className={errors.country ? styles.error : ''}
                    >
                        {COUNTRIES.map(country => (
                            <option key={country.code} value={country.code}>
                                {country.name}
                            </option>
                        ))}
                    </select>
                    {errors.country && <span className={styles.errorMessage}>{errors.country}</span>}
                </div>

                {/* Postal Code */}
                <div className={styles.formGroup}>
                    <label htmlFor="postalCode">
                        Postal Code <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode || ''}
                        onChange={handleChange}
                        className={errors.postalCode ? styles.error : ''}
                    />
                    {errors.postalCode && <span className={styles.errorMessage}>{errors.postalCode}</span>}
                </div>

                {/* Phone */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label htmlFor="phone">
                        Phone Number <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleChange}
                        placeholder="+1 (555) 123-4567"
                        className={errors.phone ? styles.error : ''}
                    />
                    {errors.phone && <span className={styles.errorMessage}>{errors.phone}</span>}
                </div>

                {/* Set as Default */}
                <div className={`${styles.formGroup} ${styles.fullWidth} ${styles.checkboxGroup}`}>
                    <label htmlFor="isDefault" className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            id="isDefault"
                            name="isDefault"
                            checked={formData.isDefault || false}
                            onChange={handleChange}
                        />
                        <span>Set as default {type} address</span>
                    </label>
                </div>
            </div>

            {/* Form Actions */}
            <div className={styles.formActions}>
                {onCancel && (
                    <button type="button" className={styles.btnCancel} onClick={onCancel}>
                        Cancel
                    </button>
                )}
                <button type="submit" className={styles.btnSubmit}>
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
