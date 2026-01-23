'use client';

import { useState } from 'react';
import { X, DollarSign, FileText, Printer } from 'lucide-react';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';

interface EndShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: any;
    onSuccess: () => void;
}

export function EndShiftModal({ isOpen, onClose, session, onSuccess }: EndShiftModalProps) {
    const [closingCash, setClosingCash] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shiftSummary, setShiftSummary] = useState<any>(null);
    const { formatPrice, baseCurrency } = useCurrency();
    const {logout} = useAuth();
    const closeModal = () => {
        logout();
        onClose();
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const amount = parseFloat(closingCash);
        if (isNaN(amount) || amount < 0) {
            setError('Please enter a valid amount');
            return;
        }

        setLoading(true);

        try {
            const result = await api.endSession(session._id, amount, notes);
            setShiftSummary(result);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to end shift');
        } finally {
            setLoading(false);
        }
    };

    const cashDifference = closingCash
        ? parseFloat(closingCash) - (session?.openingCash || 0) - (session?.totalSales || 0)
        : 0;

    const expectedCash = (session?.openingCash || 0) + ((session?.paymentBreakdown?.cash || 0));

    if (!isOpen) return null;

    // Show summary if shift ended successfully
    if (shiftSummary) {
        return (
            <AnimatePresence>
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-lg mx-4 bg-white rounded-lg shadow-xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b bg-green-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-green-800">Shift Ended Successfully</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-lg hover:bg-green-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Summary */}
                        <div className="p-6">
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <h3 className="font-semibold mb-3 text-gray-900">Shift Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Session #:</span>
                                        <span className="font-semibold text-gray-900">{shiftSummary.sessionNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Sales:</span>
                                        <span className="font-semibold text-gray-900">{formatPrice(shiftSummary.totalSales || 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Orders:</span>
                                        <span className="font-semibold text-gray-900">{shiftSummary.totalOrders}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Opening Cash:</span>
                                        <span className="font-semibold text-gray-900">{formatPrice(shiftSummary.openingCash || 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Closing Cash:</span>
                                        <span className="font-semibold text-gray-900">{formatPrice(shiftSummary.closingCash || 0)}</span>
                                    </div>
                                    {shiftSummary.paymentBreakdown && (
                                        <>
                                            <div className="border-t pt-2 mt-2">
                                                <p className="text-xs text-gray-500 mb-1">Payment Breakdown:</p>
                                            </div>
                                            <div className="flex justify-between pl-4">
                                                <span className="text-gray-600">Cash:</span>
                                                <span className="font-semibold text-gray-500">{formatPrice(shiftSummary.paymentBreakdown.cash || 0)}</span>
                                            </div>
                                            <div className="flex justify-between pl-4">
                                                <span className="text-gray-600">Card:</span>
                                                <span className="font-semibold text-gray-500">{formatPrice(shiftSummary.paymentBreakdown.card || 0)}</span>
                                            </div>
                                            <div className="flex justify-between pl-4">
                                                <span className="text-gray-600">UPI:</span>
                                                <span className="font-semibold text-gray-500">{formatPrice(shiftSummary.paymentBreakdown.upi || 0)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {/* TODO: Print shift report */ }}
                                    variant="secondary"
                                    className="flex-1 flex items-center justify-center"
                                >
                                    <Printer className="w-4 h-4 mr-2" />
                                    Print Report
                                </Button>
                                <Button
                                    onClick={closeModal}
                                    variant="primary"
                                    className="flex-1"
                                >
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-lg mx-4 bg-white rounded-lg shadow-xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <span className="text-xl font-bold text-orange-600">{baseCurrency?.symbol || '$'}</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">End Shift</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="p-6">
                        {/* Shift Info */}
                        <div className="bg-blue-50 rounded-lg p-4 mb-4">
                            <h3 className="font-semibold mb-2 text-gray-600">Current Shift</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-gray-600">Opening Cash:</p>
                                    <p className="font-semibold text-gray-600">{formatPrice(session?.openingCash || 0)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Total Sales:</p>
                                    <p className="font-semibold text-gray-600">{formatPrice(session?.totalSales || 0)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Cash Sales:</p>
                                    <p className="font-semibold text-gray-600">{formatPrice(session?.paymentBreakdown?.cash || 0)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Expected Cash:</p>
                                    <p className="font-semibold text-green-600">{formatPrice(expectedCash)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2 text-gray-600">
                                Closing Cash Amount *
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={closingCash}
                                onChange={(e) => setClosingCash(e.target.value)}
                                placeholder="0.00"
                                required
                                autoFocus
                                className="text-lg"
                            />
                            {closingCash && (
                                <p className={`text-sm mt-1 ${cashDifference === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                    {cashDifference === 0
                                        ? '✓ Cash matches expected amount'
                                        : `${cashDifference > 0 ? 'Overage' : 'Shortage'}: $${Math.abs(cashDifference).toFixed(2)}`
                                    }
                                </p>
                            )}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-2 text-gray-600">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any discrepancies or special notes..."
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
                                rows={3}
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
                                onClick={onClose}
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
                                {loading ? 'Ending...' : 'End Shift'}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
