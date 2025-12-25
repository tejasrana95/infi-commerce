'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import styles from './AuthForms.module.scss';

export default function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Invalid reset link. Please request a new password reset.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await api.post('auth/customer/reset-password', {
                token,
                newPassword: password,
            });
            setSuccess(true);
            // Redirect to login after a short delay
            setTimeout(() => {
                router.push('/login?reset=success');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className={styles.formContainer}>
                <div className={styles.successMessage}>
                    <h3>Password Reset Successful!</h3>
                    <p>Your password has been reset. Redirecting to login...</p>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className={styles.formContainer}>
                <div className={styles.errorMessage}>
                    <h3>Invalid Reset Link</h3>
                    <p>This password reset link is invalid or has expired.</p>
                    <Link href="/forgot-password" className={styles.submitBtn} style={{ display: 'block', textAlign: 'center', marginTop: '1rem', textDecoration: 'none' }}>
                        Request New Reset Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.inputGroup}>
                <label htmlFor="reset-password">New Password</label>
                <input
                    type="password"
                    id="reset-password"
                    placeholder="Create a new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                />
            </div>

            <div className={styles.inputGroup}>
                <label htmlFor="reset-confirmPassword">Confirm Password</label>
                <input
                    type="password"
                    id="reset-confirmPassword"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className={styles.footer}>
                <Link href="/login" className={styles.backLink}>
                    ← Back to Sign In
                </Link>
            </div>
        </form>
    );
}
