import React from 'react';
import Modal from '../../atoms/Modal';
import styles from './ConfirmationDialog.module.scss';
import { useStore } from '@/providers/StoreProvider';

export type DialogType = 'info' | 'success' | 'warning' | 'error';

export interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    message: React.ReactNode;
    type?: DialogType;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    loading?: boolean;
    isDanger?: boolean;
}

const ICONS = {
    info: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    success: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    warning: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
    error: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
};

export default function ConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'info',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    showCancel = true,
    loading = false,
    isDanger = false,
}: ConfirmationDialogProps) {

    // Custom footer with action buttons
    const footer = (
        <>
            {showCancel && (
                <button
                    className={`${styles.btn} ${styles.cancel}`}
                    onClick={onClose}
                    disabled={loading}
                >
                    {cancelText}
                </button>
            )}

            <button
                className={`${styles.btn} ${styles.confirm} ${isDanger ? styles.danger : ''}`}
                onClick={onConfirm || onClose}
                disabled={loading}
            >
                {loading ? 'Processing...' : confirmText}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={false} // Clean look
            footer={footer}
            closeOnOverlayClick={!loading}
        >
            <div className={styles.dialogBody}>
                <div className={`${styles.icon} ${styles[type]}`}>
                    {ICONS[type]}
                </div>
                <div className={styles.message}>
                    <h3>{title}</h3>
                    <div>{message}</div>
                </div>
            </div>
        </Modal>
    );
}
