'use client';

import React, { useState, useEffect } from 'react';
import styles from './AccountAddresses.module.scss';
import { useCustomer } from '@/providers/AuthProvider';
import api from '@/lib/api';
import Loader from '@/components/molecules/Loader';
import { getCountries, type GeoCountry } from '@/services/checkout.service';
import { ModuleProps } from '@/components/core/modules';

interface Address {
    _id?: string;
    type: 'billing' | 'shipping';
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone: string;
    isDefault: boolean;
}

const EMPTY_ADDRESS: Address = {
    type: 'shipping',
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    phone: '',
    isDefault: false,
};

export default function AccountAddressesModule({ config = {} }: ModuleProps) {
    const { customer, refreshCustomer } = useCustomer();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [formData, setFormData] = useState<Address>(EMPTY_ADDRESS);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Geo API state
    const [availableCountries, setAvailableCountries] = useState<GeoCountry[]>([]);
    const [availableStates, setAvailableStates] = useState<any[]>([]);
    const [availableCities, setAvailableCities] = useState<any[]>([]);

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

    const addresses = customer?.addresses || [];

    const openAddModal = () => {
        setEditingAddress(null);
        setFormData(EMPTY_ADDRESS);
        setIsModalOpen(true);
    };

    const openEditModal = (address: Address, index: number) => {
        setEditingAddress({ ...address, _id: String(index) });
        setFormData(address);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAddress(null);
        setFormData(EMPTY_ADDRESS);
        setMessage(null);
    };

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const countryId = e.target.value;
        const country = availableCountries.find(c => c._id === countryId);

        if (country) {
            setFormData(prev => ({
                ...prev,
                country: country.countryCode || country.countryName, // Fallback to name if code is missing
                state: '',
            }));
            setAvailableStates(country.states || []);
            setAvailableCities([]);
        } else {
            setFormData(prev => ({ ...prev, country: '', state: '' }));
            setAvailableStates([]);
            setAvailableCities([]);
        }
    };

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const stateCode = e.target.value;
        const state = availableStates.find(s => s.name === stateCode);

        setFormData(prev => ({ ...prev, state: stateCode }));

        if (state) {
            setAvailableCities(state.cities || []);
        } else {
            setAvailableCities([]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate phone number: +Code then digits, no spaces
        const phoneRegex = /^\+\d{1,4}\d{6,14}$/; // Basic E.164 check without spaces
        if (!phoneRegex.test(formData.phone)) {
            setMessage({ type: 'error', text: 'Phone number must start with + and contain no spaces. Example: +919876543210' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            let updatedAddresses = [...addresses];

            if (editingAddress?._id !== undefined) {
                // Edit existing
                const index = parseInt(editingAddress._id);
                updatedAddresses[index] = { ...formData };
            } else {
                // Add new
                updatedAddresses.push({ ...formData });
            }

            // If this is set as default, unset others
            if (formData.isDefault) {
                updatedAddresses = updatedAddresses.map((addr, i) => ({
                    ...addr,
                    isDefault: editingAddress?._id !== undefined
                        ? i === parseInt(editingAddress._id)
                        : i === updatedAddresses.length - 1,
                }));
            }

            await api.put('auth/customer/me', { addresses: updatedAddresses });
            await refreshCustomer();
            setMessage({ type: 'success', text: editingAddress ? 'Address updated!' : 'Address added!' });
            setTimeout(closeModal, 1000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to save address.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (index: number) => {
        if (!confirm('Are you sure you want to delete this address?')) return;

        try {
            const updatedAddresses = addresses.filter((_, i) => i !== index);
            await api.put('auth/customer/me', { addresses: updatedAddresses });
            await refreshCustomer();
        } catch (error) {
            console.error('Failed to delete address:', error);
        }
    };

    const handleSetDefault = async (index: number) => {
        try {
            const updatedAddresses = addresses.map((addr, i) => ({
                ...addr,
                isDefault: i === index,
            }));
            await api.put('auth/customer/me', { addresses: updatedAddresses });
            await refreshCustomer();
        } catch (error) {
            console.error('Failed to set default:', error);
        }
    };

    if (!customer) {
        return (
            <div className={styles.loadingContainer}>
                <Loader variant="spinner" size="lg" />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>My Addresses</h1>
                    <p>Manage your shipping and billing addresses</p>
                </div>
                <button className={styles.addBtn} onClick={openAddModal}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Address
                </button>
            </header>

            {addresses.length > 0 ? (
                <div className={styles.addressGrid}>
                    {addresses.map((addr: any, index: number) => (
                        <div key={index} className={`${styles.addressCard} ${addr.isDefault ? styles.default : ''}`}>
                            {addr.isDefault && <span className={styles.defaultBadge}>Default</span>}
                            <div className={styles.addressType}>{addr.type}</div>
                            <div className={styles.addressContent}>
                                <p className={styles.name}>{addr.firstName} {addr.lastName}</p>
                                <p>{addr.address1}</p>
                                {addr.address2 && <p>{addr.address2}</p>}
                                <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                                <p>{addr.country}</p>
                                <p className={styles.phone}>{addr.phone}</p>
                            </div>
                            <div className={styles.addressActions}>
                                <button onClick={() => openEditModal(addr, index)} className={styles.editBtn}>
                                    Edit
                                </button>
                                {!addr.isDefault && (
                                    <>
                                        <button onClick={() => handleSetDefault(index)} className={styles.defaultBtn}>
                                            Set Default
                                        </button>
                                        <button onClick={() => handleDelete(index)} className={styles.deleteBtn}>
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h3>No addresses saved</h3>
                    <p>Add an address to make checkout faster</p>
                    <button className={styles.addBtnLarge} onClick={openAddModal}>
                        Add Your First Address
                    </button>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{editingAddress ? 'Edit Address' : 'Add New Address'}</h2>
                            <button className={styles.closeBtn} onClick={closeModal}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.modalBody}>
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup}>
                                        <label>Address Type</label>
                                        <select name="type" value={formData.type} onChange={handleChange}>
                                            <option value="shipping">Shipping</option>
                                            <option value="billing">Billing</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>First Name</label>
                                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Last Name</label>
                                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label>Address Line 1</label>
                                        <input type="text" name="address1" value={formData.address1} onChange={handleChange} required />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label>Address Line 2 (Optional)</label>
                                        <input type="text" name="address2" value={formData.address2 || ''} onChange={handleChange} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>City</label>
                                        {availableCities.length > 0 ? (
                                            <select
                                                name="city"
                                                value={formData.city}
                                                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                                required
                                                className={styles.select}
                                            >
                                                <option value="">Select City</option>
                                                {availableCities.map((city: any) => (
                                                    <option key={city._id} value={city.name}>
                                                        {city.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input type="text" name="city" value={formData.city} onChange={handleChange} required />
                                        )}
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>State / Province</label>
                                        {availableStates.length > 0 ? (
                                            <select
                                                name="state"
                                                value={formData.state}
                                                onChange={handleStateChange}
                                                required
                                                className={styles.select}
                                            >
                                                <option value="">Select State</option>
                                                {availableStates.map((state: any) => (
                                                    <option key={state._id} value={state.name}>
                                                        {state.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input type="text" name="state" value={formData.state} onChange={handleChange} required />
                                        )}
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Postal Code</label>
                                        <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Country</label>
                                        <select
                                            name="country"
                                            value={formData.country}
                                            onChange={handleCountryChange}
                                            required
                                            className={styles.select}
                                        >
                                            <option value="">Select Country</option>
                                            {availableCountries.map(country => (
                                                <option key={country._id} value={country.countryCode}>
                                                    {country.countryName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label>Phone Number (e.g. +919876543210)</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+919876543210"
                                            required
                                        />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                name="isDefault"
                                                checked={formData.isDefault}
                                                onChange={handleChange}
                                            />
                                            Set as default address
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                {message && (
                                    <span className={`${styles.message} ${styles[message.type]}`}>
                                        {message.text}
                                    </span>
                                )}
                                <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.saveBtn} disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Address'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
