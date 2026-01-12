'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './RegisterForm.module.scss';
import SocialLoginButtons from '../SocialLoginButtons/SocialLoginButtons';
import { useAuth } from '@/providers/AuthProvider';

interface RegisterFormProps {
    isModal?: boolean;
    onSuccess?: () => void;
}

export default function RegisterForm({ isModal = false, onSuccess }: RegisterFormProps) {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fieldName = e.target.name;
        setFormData({ ...formData, [fieldName]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!agreed) {
            setError('Please agree to the Terms and Privacy Policy');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        const result = await register({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password,
        });

        if (result.success) {
            if (result.requiresVerification) {
                // Show verification success - don't redirect
                setRegisteredEmail(formData.email);
                setRegistrationSuccess(true);
                // Reset form
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    confirmPassword: ''
                });
                setAgreed(false);
            } else if (onSuccess) {
                onSuccess();
            }
        } else {
            setError(result.error || 'Registration failed. Please try again.');
        }

        setLoading(false);
    };

    const getPasswordStrength = () => {
        const { password } = formData;
        if (!password) return { level: 0, text: '', color: '' };
        if (password.length < 6) return { level: 1, text: 'Weak', color: '#ef4444' };
        if (password.length < 8) return { level: 2, text: 'Fair', color: '#f59e0b' };
        if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
            return { level: 4, text: 'Strong', color: '#10b981' };
        }
        return { level: 3, text: 'Good', color: '#3b82f6' };
    };

    const strength = getPasswordStrength();

    return (
        <div className={styles.container}>
            {/* Show success message when registration is complete */}
            {registrationSuccess ? (
                <div className={styles.successContainer}>
                    <div className={styles.successIcon}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="9 12 12 15 16 10" />
                        </svg>
                    </div>
                    <h3 className={styles.successTitle}>Registration Successful!</h3>
                    <p className={styles.successText}>
                        We've sent a verification link to<br />
                        <strong>{registeredEmail}</strong>
                    </p>
                    <p className={styles.successNote}>
                        Please check your inbox and click the link to verify your email before logging in.
                    </p>
                    <Link href="/login" className={styles.submitBtn} style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1.5rem' }}>
                        Go to Login
                    </Link>
                </div>
            ) : (
                <>
                    {/* Social Login First */}
                    <SocialLoginButtons
                        onSuccess={(data) => {
                            if (onSuccess) onSuccess();
                        }}
                        onError={(err) => setError(err)}
                    />

                    <div className={styles.divider}>
                        <span>or register with email</span>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && (
                            <div className={styles.error}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div className={styles.nameRow}>
                            <div className={styles.inputWrapper}>
                                <div className={styles.inputIcon}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="First name"
                                    required
                                    autoComplete="given-name"
                                />
                            </div>
                            <div className={styles.inputWrapper}>
                                <div className={styles.inputIcon}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Last name"
                                    required
                                    autoComplete="family-name"
                                />
                            </div>
                        </div>

                        <div className={styles.inputWrapper}>
                            <div className={styles.inputIcon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                            </div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email address"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className={styles.passwordWrapper}>
                            <div className={styles.inputWrapper}>
                                <div className={styles.inputIcon}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Create password"
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className={styles.togglePassword}
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {formData.password && (
                                <div className={styles.strengthBar}>
                                    <div className={styles.strengthTrack}>
                                        {[1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className={styles.strengthSegment}
                                                style={{
                                                    backgroundColor: i <= strength.level ? strength.color : '#e5e7eb'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span style={{ color: strength.color }}>{strength.text}</span>
                                </div>
                            )}
                        </div>

                        <div className={styles.inputWrapper}>
                            <div className={styles.inputIcon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 11 12 14 22 4" />
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                </svg>
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm password"
                                required
                                autoComplete="new-password"
                            />
                            {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                <div className={styles.checkmark}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                            />
                            <span className={styles.checkboxMark} />
                            <span className={styles.checkboxLabel}>
                                I agree to the <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>
                            </span>
                        </label>

                        <button type="submit" className={styles.submitBtn} disabled={loading || !agreed}>
                            {loading ? (
                                <>
                                    <span className={styles.spinner} />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    <div className={styles.footer}>
                        <p>
                            Already have an account?{' '}
                            <Link href="/login">Sign in</Link>
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
