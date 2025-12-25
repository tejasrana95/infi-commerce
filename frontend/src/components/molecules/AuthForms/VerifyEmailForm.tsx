'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import styles from './AuthForms.module.scss';

export default function VerifyEmailForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('Invalid verification link.');
            return;
        }

        const verify = async () => {
            try {
                await api.post('auth/customer/verify-email', { token });
                setStatus('success');
            } catch (err: any) {
                setStatus('error');
                setErrorMessage(err.message || 'Verification failed. The link may have expired.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className={styles.formContainer}>
            {status === 'verifying' && (
                <div className={styles.statusMessage}>
                    <div className={styles.spinner} />
                    <h3>Verifying your email...</h3>
                    <p>Please wait while we verify your email address.</p>
                </div>
            )}

            {status === 'success' && (
                <div className={styles.successMessage}>
                    <h3>Email Verified!</h3>
                    <p>Your email has been successfully verified. You can now sign in to your account.</p>
                    <Link href="/login" className={styles.submitBtn} style={{ display: 'block', textAlign: 'center', marginTop: '1rem', textDecoration: 'none' }}>
                        Sign In Now
                    </Link>
                </div>
            )}

            {status === 'error' && (
                <div className={styles.errorMessage}>
                    <h3>Verification Failed</h3>
                    <p>{errorMessage}</p>
                    <Link href="/login" className={styles.backLink}>
                        Back to Login
                    </Link>
                </div>
            )}
        </div>
    );
}
