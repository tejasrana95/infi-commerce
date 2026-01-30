'use client';

import React, { useState, useEffect } from 'react';
import styles from './AccountProfile.module.scss';
import { useCustomer } from '@/providers/AuthProvider';
import api from '@/lib/api';
import { formatDate } from '@/lib/date';
import Loader from '@/components/molecules/Loader';
import TwoFactorSetup from '@/components/molecules/TwoFactorSetup/TwoFactorSetup';

export interface ModuleProps {
    config: Record<string, any>;
    sectionType?: 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';
    initialData?: any;
    priority?: boolean;
}

export default function AccountProfileModule({ config = {} }: ModuleProps) {
    const { customer, refreshCustomer } = useCustomer();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (customer) {
            setFormData({
                firstName: customer.firstName || '',
                lastName: customer.lastName || '',
                email: customer.email || '',
                phone: customer.phone || '',
            });
        }
    }, [customer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await api.put('auth/customer/me', {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
            });
            await refreshCustomer();
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile.' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordLoading(true);
        setPasswordMessage(null);

        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
            setPasswordLoading(false);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
            setPasswordLoading(false);
            return;
        }

        try {
            await api.post('auth/customer/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (error: any) {
            setPasswordMessage({ type: 'error', text: error.message || 'Failed to change password.' });
        } finally {
            setPasswordLoading(false);
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
                <h1>Profile Settings</h1>
                <p>Manage your personal information and security</p>
            </header>

            {/* Personal Information */}
            <form onSubmit={handleSubmit} className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2>Personal Information</h2>
                </div>
                <div className={styles.cardBody}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label htmlFor="firstName">First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="lastName">Last Name</label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                disabled
                                className={styles.disabled}
                            />
                            <span className={styles.hint}>Email cannot be changed</span>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.cardFooter}>
                    {message && (
                        <span className={`${styles.message} ${styles[message.type]}`}>
                            {message.text}
                        </span>
                    )}
                    <button type="submit" className={styles.saveBtn} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>

            {/* Change Password */}
            <form onSubmit={handlePasswordSubmit} className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2>Change Password</h2>
                </div>
                <div className={styles.cardBody}>
                    <div className={styles.formGrid}>
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label htmlFor="currentPassword">Current Password</label>
                            <input
                                type="password"
                                id="currentPassword"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="newPassword">New Password</label>
                            <input
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                required
                                minLength={6}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="confirmNewPassword">Confirm New Password</label>
                            <input
                                type="password"
                                id="confirmNewPassword"
                                name="confirmNewPassword"
                                value={passwordData.confirmNewPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.cardFooter}>
                    {passwordMessage && (
                        <span className={`${styles.message} ${styles[passwordMessage.type]}`}>
                            {passwordMessage.text}
                        </span>
                    )}
                    <button type="submit" className={styles.saveBtn} disabled={passwordLoading}>
                        {passwordLoading ? 'Changing...' : 'Change Password'}
                    </button>
                </div>
            </form>

            {/* Two-Factor Authentication */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2>Two-Factor Authentication</h2>
                </div>
                <div className={styles.cardBody}>
                    <TwoFactorSetup />
                </div>
            </div>

            {/* Account Status */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2>Account Status</h2>
                </div>
                <div className={styles.cardBody}>
                    <div className={styles.statusList}>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>Email Verification</span>
                            <span className={`${styles.statusValue} ${customer.emailVerified ? styles.verified : styles.notVerified}`}>
                                {customer.emailVerified ? '✓ Verified' : '✗ Not Verified'}
                            </span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>Account Created</span>
                            <span className={styles.statusValue}>
                                {formatDate(customer.createdAt, 'long')}
                            </span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>Newsletter</span>
                            <span className={styles.statusValue}>
                                {customer.preferences?.newsletter ? 'Subscribed' : 'Not Subscribed'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
