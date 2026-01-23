'use client';

import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import { useSessionStore } from '@/store/sessionStore';
import { useRouter } from 'next/navigation';
import { useStore } from '@/contexts/StoreContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';

interface StartShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (session: any) => void;
}

export function StartShiftModal({ isOpen, onClose, onSuccess }: StartShiftModalProps) {
    const { baseCurrency } = useCurrency();
    const [openingCash, setOpeningCash] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const router = useRouter();
    const logout = useSessionStore((state) => state.logout);
    const { clearStore } = useStore();
    const { logout: authLogout } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const amount = parseFloat(openingCash);
        if (isNaN(amount) || amount < 0) {
            setError('Please enter a valid amount');
            return;
        }

        setLoading(true);

        try {
            const session = await api.startSession(amount);
            onSuccess(session);
            setOpeningCash('');
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to start shift');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authLogout();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-xl font-bold text-green-600">{baseCurrency?.symbol || '$'}</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Start Shift</h2>
                        </div>
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="mb-6">
                            <p className="text-gray-600 mb-4">
                                Count the cash in your register and enter the opening balance to start your shift.
                            </p>

                            <label className="block text-sm font-semibold mb-2 text-gray-600">
                                Opening Cash Amount
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={openingCash}
                                onChange={(e) => setOpeningCash(e.target.value)}
                                placeholder="0.00"
                                required
                                autoFocus
                                className="text-lg"
                            />
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                onClick={() => setShowLogoutConfirm(true)}
                                variant="secondary"
                                className="flex-1"
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                className="flex-1"
                                disabled={loading}
                            >
                                {loading ? 'Starting...' : 'Start Shift'}
                            </Button>
                        </div>
                    </form>

                    {/* Logout Confirmation Overlay */}
                    {showLogoutConfirm && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 rounded-lg backdrop-blur-sm p-6">
                            <div className="w-full text-center">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Logout?</h3>
                                <p className="text-gray-600 mb-6">
                                    Cancelling the shift start will log you out. Are you sure?
                                </p>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => setShowLogoutConfirm(false)}
                                        variant="secondary"
                                        className="flex-1"
                                    >
                                        Go Back
                                    </Button>
                                    <Button
                                        onClick={handleLogout}
                                        variant="danger"
                                        className="flex-1"
                                    >
                                        Logout
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
