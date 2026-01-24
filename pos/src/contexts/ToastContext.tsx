'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastVariant = 'default' | 'success' | 'destructive' | 'warning';

export interface Toast {
    id: string;
    title?: string;
    description?: string;
    variant?: ToastVariant;
    duration?: number;
}

interface ToastContextType {
    toast: (props: Omit<Toast, 'id'>) => void;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToastContext() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback(({ title, description, variant = 'default', duration = 3000 }: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, title, description, variant, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast, dismiss }}>
            {children}
            <ToastViewport toasts={toasts} dismiss={dismiss} />
        </ToastContext.Provider>
    );
}

function ToastViewport({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
    return (
        <div className="fixed bottom-0 right-0 z-[100] p-4 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
                ))}
            </AnimatePresence>
        </div>
    );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const icons = {
        default: <Info className="w-5 h-5 text-blue-500" />,
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        destructive: <AlertCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertCircle className="w-5 h-5 text-orange-500" />,
    };

    const bgColors = {
        default: 'bg-white border-slate-200',
        success: 'bg-green-50 border-green-200',
        destructive: 'bg-red-50 border-red-200',
        warning: 'bg-orange-50 border-orange-200',
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg ${bgColors[toast.variant || 'default']}`}
        >
            <div className="shrink-0 pt-0.5">{icons[toast.variant || 'default']}</div>
            <div className="flex-1">
                {toast.title && <h3 className="font-semibold text-sm">{toast.title}</h3>}
                {toast.description && <p className="text-sm opacity-90">{toast.description}</p>}
            </div>
            <button onClick={onDismiss} className="shrink-0 rounded-md p-1 opacity-50 hover:opacity-100 hover:bg-black/5">
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}
