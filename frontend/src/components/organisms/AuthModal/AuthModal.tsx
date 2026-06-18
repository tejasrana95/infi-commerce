'use client';

import React, { useEffect, useRef } from 'react';
import { useUI } from '@/providers/UIProvider';
import styles from './AuthModal.module.scss';
import LoginForm from '@/components/molecules/AuthForms/LoginForm';
import RegisterForm from '@/components/molecules/AuthForms/RegisterForm';

export default function AuthModal() {
    const { isAuthModalOpen, closeAuthModal, authView } = useUI();
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeAuthModal();
        };

        const originalOverflow = document.body.style.overflow;

        if (isAuthModalOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            const activeOverlays = document.querySelectorAll('[role="dialog"], [class*="overlay"], [class*="modal"], [class*="drawer"]');
            if (activeOverlays.length <= 1) {
                document.body.style.overflow = '';
            } else {
                document.body.style.overflow = originalOverflow;
            }
        };
    }, [isAuthModalOpen, closeAuthModal]);

    // Close on click outside
    const handleClickOutside = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            closeAuthModal();
        }
    };

    if (!isAuthModalOpen) return null;

    return (
        <div className={styles.overlay} onClick={handleClickOutside}>
            <div className={styles.modal} ref={modalRef} role="dialog" aria-modal="true">
                <button
                    onClick={closeAuthModal}
                    className={styles.closeBtn}
                    aria-label="Close modal"
                >
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className={styles.content}>
                    {authView === 'login' && <LoginForm />}
                    {authView === 'register' && <RegisterForm />}
                </div>
            </div>
        </div>
    );
}
