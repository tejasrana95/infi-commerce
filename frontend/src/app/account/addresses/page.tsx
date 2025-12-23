'use client';

import React, { useState } from 'react';
import styles from './page.module.scss';

// Mock data
const MOCK_ADDRESSES = [
    {
        id: '1',
        type: 'Home',
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        address2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'United States',
        isDefault: true,
        phone: '+1 (555) 123-4567'
    }
];

export default function AddressesPage() {
    const [addresses, setAddresses] = useState(MOCK_ADDRESSES);
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <h1>My Addresses</h1>
                    <p>Manage your shipping and billing addresses.</p>
                </div>
                <button className={styles.addButton} onClick={() => setIsEditing(true)}>
                    + Add New Address
                </button>
            </header>

            <div className={styles.grid}>
                {addresses.map((addr) => (
                    <div key={addr.id} className={styles.card}>
                        {addr.isDefault && <span className={styles.badge}>Default</span>}
                        <div className={styles.cardContent}>
                            <h3>{addr.firstName} {addr.lastName}</h3>
                            <p>{addr.address1}</p>
                            {addr.address2 && <p>{addr.address2}</p>}
                            <p>{addr.city}, {addr.state} {addr.zip}</p>
                            <p>{addr.country}</p>
                            <p className={styles.phone}>Phone: {addr.phone}</p>
                        </div>
                        <div className={styles.actions}>
                            <button className={styles.editBtn}>Edit</button>
                            {!addr.isDefault && <button className={styles.deleteBtn}>Delete</button>}
                        </div>
                    </div>
                ))}
            </div>

            {isEditing && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Add New Address</h2>
                        <p>Form implementation coming soon...</p>
                        <button onClick={() => setIsEditing(false)} className={styles.closeBtn}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
