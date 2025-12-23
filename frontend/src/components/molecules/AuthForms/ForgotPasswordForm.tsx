'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './AuthForms.module.scss';

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setLoading(false);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className={styles.formContainer}>
                <div className={styles.successMessage}>
                    <h3>Check your inbox</h3>
                    <p>We have sent a password reset link to <strong>{email}</strong>.</p>
                    <Link href="/login" className={styles.backLink}>
                        Back to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
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
