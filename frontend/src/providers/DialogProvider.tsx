'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import ConfirmationDialog, { DialogType, ConfirmationDialogProps } from '@/components/molecules/ConfirmationDialog';

interface DialogOptions {
    title?: string;
    message: React.ReactNode;
    type?: DialogType;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    isDanger?: boolean;
}

interface DialogContextType {
    showConfirm: (options: DialogOptions) => Promise<boolean>;
    showAlert: (options: DialogOptions) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function useDialog() {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
    const [dialogState, setDialogState] = useState<ConfirmationDialogProps | null>(null);
    const awaiterRef = useRef<{ resolve: (value: boolean) => void } | null>(null);

    const closeDialog = useCallback(() => {
        setDialogState(null);
        if (awaiterRef.current) {
            awaiterRef.current.resolve(false);
            awaiterRef.current = null;
        }
    }, []);

    const confirmDialog = useCallback(() => {
        setDialogState(null);
        if (awaiterRef.current) {
            awaiterRef.current.resolve(true);
            awaiterRef.current = null;
        }
    }, []);

    const showConfirm = useCallback((options: DialogOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            awaiterRef.current = { resolve };
            setDialogState({
                isOpen: true,
                onClose: closeDialog,
                onConfirm: confirmDialog,
                title: options.title || 'Confirm Action',
                message: options.message,
                type: options.type || 'warning',
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
                showCancel: true,
                isDanger: options.isDanger ?? false,
            });
        });
    }, [closeDialog, confirmDialog]);

    const showAlert = useCallback((options: DialogOptions): Promise<void> => {
        return new Promise((resolve) => {
            const handleClose = () => {
                setDialogState(null);
                resolve();
            };

            setDialogState({
                isOpen: true,
                onClose: handleClose,
                onConfirm: handleClose,
                title: options.title || 'Alert',
                message: options.message,
                type: options.type || 'info',
                confirmText: options.confirmText || 'OK',
                showCancel: false,
            });
        });
    }, []);

    return (
        <DialogContext.Provider value={{ showConfirm, showAlert }}>
            {children}
            {dialogState && <ConfirmationDialog {...dialogState} />}
        </DialogContext.Provider>
    );
}
