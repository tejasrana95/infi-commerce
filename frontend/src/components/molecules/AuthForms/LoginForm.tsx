'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './AuthForms.module.scss';
import SocialLoginButtons from '../SocialLoginButtons/SocialLoginButtons';
import { useAuth } from '@/providers/AuthProvider';
import { useStore } from '@/providers/StoreProvider';

interface LoginFormProps {
    isModal?: boolean;
    onSuccess?: () => void;
}

export default function LoginForm({ isModal = false, onSuccess }: LoginFormProps) {
    const router = useRouter();
    const { login, verify2FA } = useAuth();
    const { store } = useStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaToken, setMfaToken] = useState('');
    const [mfaCode, setMfaCode] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            if (onSuccess) {
                onSuccess();
            }
        } else if (result.mfaRequired) {
            setMfaRequired(true);
            setMfaToken(result.mfaToken || '');
        } else {
            setError(result.error || 'Invalid email or password');
        }

        setLoading(false);
    };

    const handleMfaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await verify2FA(mfaToken, mfaCode);

        if (result.success) {
            if (onSuccess) {
                onSuccess();
            }
        } else {
            setError(result.error || 'Invalid verification code');
        }

        setLoading(false);
    };

    if (mfaRequired) {
        return (
            <div className={styles.formContainer}>
                <div className={styles.mfaHeader}>
                    <h3>Two-Factor Authentication</h3>
                    <p>Please enter the 6-digit code from your authenticator app.</p>
                </div>

                <form onSubmit={handleMfaSubmit} className={styles.form}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.inputGroup}>
                        <label htmlFor="mfa-code">Verification Code</label>
                        <input
                            type="text"
                            id="mfa-code"
                            value={mfaCode}
                            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            required
                            autoFocus
                            inputMode="numeric"
                            autoComplete="one-time-code"
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading || mfaCode.length !== 6}>
                        {loading ? 'Verifying...' : 'Verify & Sign In'}
                    </button>

                    <button type="button" className={styles.backBtn} onClick={() => setMfaRequired(false)}>
                        Back to Login
                    </button>
                </form>
            </div>
        );
    }

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

                {store?.settings?.allowCustomerLogin !== false && (
                    <div className={styles.forgotPassword}>
                        <Link href="/forgot-password" className={styles.linkBtn}>
                            Forgot Password?
                        </Link>
                    </div>
                )}

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

            {store?.settings?.allowCustomerSignup !== false && (
                <div className={styles.footer}>
                    <p>
                        Don't have an account?{' '}
                        <Link href="/register" className={styles.linkBtn}>
                            Sign up
                        </Link>
                    </p>
                </div>
            )}
        </div>
    );
}

