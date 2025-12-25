'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import styles from './AuthForms.module.scss';

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('auth/customer/forgot-password', { email });
            setSubmitted(true);
        } catch (err: any) {
            // Always show success to prevent email enumeration
            // Backend also returns success even if email doesn't exist
            setSubmitted(true);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className={styles.formContainer}>
                <div className={styles.successMessage}>
                    <h3>Check your inbox</h3>
                    <p>If an account exists for <strong>{email}</strong>, we have sent a password reset link.</p>
                    <Link href="/login" className={styles.backLink}>
                        Back to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.inputGroup}>
                <label htmlFor="forgot-email">Email address</label>
                <input
                    type="email"
                    id="forgot-email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className={styles.footer}>
                <Link href="/login" className={styles.backLink}>
                    ← Back to Sign In
                </Link>
            </div>
        </form>
    );
}
