'use client';

import React, { useState } from 'react';
import styles from './Footer.module.scss';
import { FooterElementSettings } from '@/types/store';

interface NewsletterFormProps {
    settings?: FooterElementSettings;
}

export default function NewsletterForm({ settings = {} }: NewsletterFormProps) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            // TODO: Implement newsletter subscription API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setStatus('success');
            setEmail('');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <>
            {settings.newsletterTitle && (
                <h4>{settings.newsletterTitle}</h4>
            )}
            {settings.newsletterDescription && (
                <p>{settings.newsletterDescription}</p>
            )}
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={settings.newsletterPlaceholder || 'Enter your email'}
                    required
                    disabled={status === 'loading'}
                />
                <button type="submit" disabled={status === 'loading'}>
                    {status === 'loading' ? 'Sending...' : (settings.newsletterButtonText || 'Subscribe')}
                </button>
            </form>
            {status === 'success' && (
                <p className={`${styles.status} ${styles.statusSuccess}`}>Thanks for subscribing!</p>
            )}
            {status === 'error' && (
                <p className={`${styles.status} ${styles.statusError}`}>Something went wrong. Please try again.</p>
            )}
        </>
    );
}
