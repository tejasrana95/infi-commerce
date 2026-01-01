'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ConfirmDialog, ConfirmDialogProps } from '@/components/molecules/ConfirmDialog';

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    severity?: ConfirmDialogProps['severity'];
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
    const [dialogState, setDialogState] = useState<{
        open: boolean;
        options: ConfirmOptions;
        resolve: (value: boolean) => void;
    }>({
        open: false,
        options: { message: '' },
        resolve: () => { }
    });

    const confirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setDialogState({
                open: true,
                options,
                resolve
            });
        });
    }, []);

    const handleClose = useCallback(() => {
        setDialogState(prev => ({ ...prev, open: false }));
        dialogState.resolve(false);
    }, [dialogState]);

    const handleConfirm = useCallback(() => {
        setDialogState(prev => ({ ...prev, open: false }));
        dialogState.resolve(true);
    }, [dialogState]);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <ConfirmDialog
                open={dialogState.open}
                title={dialogState.options.title || 'Confirm Action'}
                message={dialogState.options.message}
                confirmLabel={dialogState.options.confirmLabel}
                cancelLabel={dialogState.options.cancelLabel}
                severity={dialogState.options.severity}
                onCancel={handleClose}
                onConfirm={handleConfirm}
            />
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};
