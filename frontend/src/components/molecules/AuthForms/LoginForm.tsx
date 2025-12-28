'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './AuthForms.module.scss';
import SocialLoginButtons from '../SocialLoginButtons/SocialLoginButtons';
import { useAuth } from '@/providers/AuthProvider';

interface LoginFormProps {
    isModal?: boolean;
    onSuccess?: () => void;
}

export default function LoginForm({ isModal = false, onSuccess }: LoginFormProps) {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            if (onSuccess) {
                onSuccess();
            }
        } else {
            setError(result.error || 'Invalid email or password');
        }

        setLoading(false);
    };

    return (
        <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} className={styles.form}>
                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.inputGroup}>
                    <label htmlFor="login-email">Email Address</label>
                    <input
                        type="email"
                        id="login-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="login-password">Password</label>
                    <input
                        type="password"
                        id="login-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />
                </div>

                <div className={styles.forgotPassword}>
                    <Link href="/forgot-password" className={styles.linkBtn}>
                        Forgot Password?
                    </Link>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            <SocialLoginButtons
                onSuccess={(data) => {
                    if (onSuccess) onSuccess();
                }}
                onError={(err) => setError(err)}
            />

            <div className={styles.footer}>
                <p>
                    Don't have an account?{' '}
                    <Link href="/register" className={styles.linkBtn}>
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}

