'use client';

import React, { useState } from 'react';
import styles from './page.module.scss';
import axios from 'axios';

export default function ProfilePage() {
    const [formData, setFormData] = useState({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            // Simulate API
            await new Promise(resolve => setTimeout(resolve, 800));
            setMessage('Profile updated successfully!');
            // clear passwords
            setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmNewPassword: '' }));
        } catch (error) {
            setMessage('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Profile Settings</h1>
                <p>Update your personal information and password.</p>
            </header>

            <form onSubmit={handleSubmit} className={styles.form}>

                <section className={styles.section}>
                    <h2>Personal Information</h2>
                    <div className={styles.row}>
                        <div className={styles.group}>
                            <label htmlFor="firstName">First Name</label>
                            <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} />
                        </div>
                        <div className={styles.group}>
                            <label htmlFor="lastName">Last Name</label>
                            <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} />
                        </div>
                    </div>
                    <div className={styles.row}>
                        <div className={styles.group}>
                            <label htmlFor="email">Email Address</label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} disabled className={styles.disabled} />
                        </div>
                        <div className={styles.group}>
                            <label htmlFor="phone">Phone Number</label>
                            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                    </div>
                </section>

                <hr className={styles.divider} />

                <section className={styles.section}>
                    <h2>Change Password</h2>
                    <div className={styles.group}>
                        <label htmlFor="currentPassword">Current Password</label>
                        <input type="password" id="currentPassword" name="currentPassword" value={formData.currentPassword} onChange={handleChange} />
                    </div>
                    <div className={styles.row}>
                        <div className={styles.group}>
                            <label htmlFor="newPassword">New Password</label>
                            <input type="password" id="newPassword" name="newPassword" value={formData.newPassword} onChange={handleChange} />
                        </div>
                        <div className={styles.group}>
                            <label htmlFor="confirmNewPassword">Confirm New Password</label>
                            <input type="password" id="confirmNewPassword" name="confirmNewPassword" value={formData.confirmNewPassword} onChange={handleChange} />
                        </div>
                    </div>
                </section>

                <div className={styles.actions}>
                    {message && <span className={styles.message}>{message}</span>}
                    <button type="submit" className={styles.saveBtn} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

            </form>
        </div>
    );
}
