'use client';

import { useState } from 'react';
import styles from './index.module.scss';
import { FiMail, FiCheck } from 'react-icons/fi';
import Honeypot from '@/components/core/common/Honeypot';
import { track } from '@/lib/ga';

interface NewsletterSignupProps {
    config: {
        title?: string;
        description?: string;
        placeholder?: string;
        buttonText?: string;
        successMessage?: string;
        style?: 'minimal' | 'card' | 'banner';
        showPrivacyNote?: boolean;
    };
}

export default function NewsletterSignup({ config }: NewsletterSignupProps) {
    const {
        title = 'Subscribe to our Newsletter',
        description = 'Get the latest articles and insights delivered to your inbox.',
        placeholder = 'Enter your email',
        buttonText = 'Subscribe',
        successMessage = 'Thanks for subscribing!',
        style = 'card',
        showPrivacyNote = true,
    } = config;

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [honeyTrap, setHoneyTrap] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address');
            track('newsletter_validation_error', {
                error: 'invalid_email',
                path: typeof window !== 'undefined' ? window.location.pathname : '',
            });
            return;
        }

        setLoading(true);
        try {
            const { apiClient } = await import('@/services/api-client');
            await apiClient.post('newsletter/subscribe', {
                email,
                _newsletter_trap: honeyTrap
            });

            setSuccess(true);
            setEmail('');

            // Track successful newsletter signup
            track('newsletter_signup_success', {
                source: 'blog',
                path: typeof window !== 'undefined' ? window.location.pathname : '',
            });

            setTimeout(() => setSuccess(false), 5000);
        } catch (err: any) {
            const errorMessage = err.message || 'Something went wrong. Please try again.';
            setError(errorMessage);

            // Track failed newsletter signup
            track('newsletter_signup_error', {
                error_message: errorMessage,
                path: typeof window !== 'undefined' ? window.location.pathname : '',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${styles.newsletter} ${styles[style]}`}>
            {success ? (
                <div className={styles.success}>
                    <FiCheck className={styles.successIcon} />
                    <h3>{successMessage}</h3>
                </div>
            ) : (
                <>
                    <div className={styles.header}>
                        <FiMail className={styles.icon} />
                        <h3 className={styles.title}>{title}</h3>
                        <p className={styles.description}>{description}</p>
                    </div>

                    <form
                        className={styles.form}
                        onSubmit={handleSubmit}
                        data-track="newsletter_signup"
                    >
                        <div className={styles.inputWrapper}>
                            <Honeypot
                                name="_newsletter_trap"
                                value={honeyTrap}
                                onChange={setHoneyTrap}
                            />
                            <input
                                type="email"
                                placeholder={placeholder}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                            <button type="submit" disabled={loading}>
                                {loading ? 'Subscribing...' : buttonText}
                            </button>
                        </div>

                        {error && <p className={styles.error}>{error}</p>}

                        {showPrivacyNote && (
                            <p className={styles.privacy}>
                                We respect your privacy. Unsubscribe at any time.
                            </p>
                        )}
                    </form>
                </>
            )}
        </div>
    );
}
