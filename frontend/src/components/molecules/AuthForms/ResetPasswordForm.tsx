'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './AuthForms.module.scss';

export default function ResetPasswordForm() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setLoading(false);
        router.push('/login?reset=success');
    };

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
                    minLength={8}
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

