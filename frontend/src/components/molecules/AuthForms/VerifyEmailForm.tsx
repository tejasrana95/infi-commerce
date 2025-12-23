'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './AuthForms.module.scss';

export default function VerifyEmailForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }

        const verify = async () => {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setStatus('success');
        };

        verify();
    }, [token]);

    return (
        <div className={styles.formContainer}>
            {status === 'verifying' && (
                <div className={styles.statusMessage}>
                    <h3>Verifying your email...</h3>
                    <p>Please wait while we verify your email address.</p>
                </div>
            )}

            {status === 'success' && (
                <div className={styles.successMessage}>
                    <h3>Email Verified!</h3>
                    <p>Your email has been successfully verified.</p>
                    <Link href="/login" className={styles.submitBtn} style={{ display: 'block', textAlign: 'center', marginTop: '1rem', textDecoration: 'none' }}>
                        Sign In Now
                    </Link>
                </div>
            )}

            {status === 'error' && (
                <div className={styles.errorMessage}>
                    <h3>Verification Failed</h3>
                    <p>The verification link is invalid or has expired.</p>
                    <Link href="/login" className={styles.backLink}>
                        Back to Login
                    </Link>
                </div>
            )}
        </div>
    );
}
