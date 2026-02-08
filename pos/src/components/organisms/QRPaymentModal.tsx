'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, CheckCircle, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import QRCode from "react-qr-code";
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/services/api';
import Image from 'next/image';
import { useSessionStore } from '@/store/sessionStore';

interface QRPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (paymentData: any) => void;
    amount: number;
    currency: string;
    settings: any; // PosPaymentSettings['qrSettings']
    customer?: any;
}

type PaymentStage = 'initializing' | 'generating' | 'waiting' | 'verifying' | 'success' | 'failed' | 'expired';

export default function QRPaymentModal({
    isOpen,
    onClose,
    onSuccess,
    amount,
    currency,
    settings,
    customer
}: QRPaymentModalProps) {
    const { formatPrice } = useCurrency();
    const [stage, setStage] = useState<PaymentStage>('initializing');
    const [qrData, setQrData] = useState<any>(null);
    const [error, setError] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes default
    const pollInterval = useRef<NodeJS.Timeout | null>(null);
    const timerInterval = useRef<NodeJS.Timeout | null>(null);
    const { activeSession } = useSessionStore();
    // Initial Setup
    useEffect(() => {
        if (isOpen) {
            initializePayment();
        } else {
            cleanup();
        }
    }, [isOpen]);

    // Timer
    useEffect(() => {
        if (stage === 'waiting' && timeLeft > 0) {
            if (timerInterval.current) clearInterval(timerInterval.current);
            timerInterval.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleExpiry();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerInterval.current) clearInterval(timerInterval.current);
        }
        return () => {
            if (timerInterval.current) clearInterval(timerInterval.current);
        };
    }, [stage]);

    // Cleanup on unmount (CRITICAL: stops polling leak)
    useEffect(() => {
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
            if (timerInterval.current) clearInterval(timerInterval.current);
        };
    }, []);

    // Cleanup on unmount or close
    const cleanup = () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
        if (timerInterval.current) clearInterval(timerInterval.current);
        setStage('initializing');
        setQrData(null);
        setError('');
        setTimeLeft(300);
    };

    const handleClose = () => {
        cleanup();
        onClose();
    };

    const handleExpiry = () => {
        setStage('expired');
        if (pollInterval.current) clearInterval(pollInterval.current);
    };

    const initializePayment = async () => {
        setError('');

        if (settings.mode === 'custom') {
            // Static QR Mode
            setStage('waiting');
            setQrData({
                qrCodeUrl: settings.customConfig?.qrCodeImage || '',
                instructions: settings.displaySettings?.instructions
            });
            // For custom mode, we don't necessarily poll, or we poll manual verify endpoint?
            // Usually custom QR is just a static image. The cashier verifies manually.
            // But if we wanted to support some background check we could.
            // For now, we rely on "Manual Verify" button for Custom mode.
        } else {
            // Gateway Mode
            setStage('generating');
            try {
                const response = await api.generateQR({
                    amount,
                    currency,
                    description: `POS Payment: ${formatPrice(amount)}`,
                    posSessionId: activeSession?._id,
                    customerDetails: customer ? {
                        id: customer.id || '',
                        name: customer.name || `${customer.firstName} ${customer.lastName}`,
                        email: customer.email,
                        phone: customer.phone,
                        address: customer.addresses && customer.addresses.length > 0 ? {
                            line1: customer.addresses[0].address1,
                            line2: customer.addresses[0].address2,
                            city: customer.addresses[0].city,
                            state: customer.addresses[0].state,
                            country: customer.addresses[0].country,
                            postalCode: customer.addresses[0].postalCode
                        } : undefined
                    } : undefined
                });

                if (response.qrCodeUrl || response.qrCodeData || response.paymentLink) {
                    setQrData(response);
                    setStage('waiting');
                    startPolling(response.qrCodeId, {
                        gateway: response.gateway,
                        configId: response.configId
                    });
                } else {
                    throw new Error('No QR code returned from gateway');
                }
            } catch (err: any) {
                console.error('QR Generation Failed:', err);
                setError(err.response?.data?.message || 'Failed to generate QR code');
                setStage('failed');
            }
        }
    };

    const startPolling = (qrId: string, params?: { gateway?: string; configId?: string }) => {
        if (pollInterval.current) clearInterval(pollInterval.current);

        pollInterval.current = setInterval(async () => {
            try {
                const statusRes = await api.getQRPaymentStatus(qrId, params);
                const status = statusRes.status;
                if (status === 'completed' || status === 'success') {
                    handleSuccess(statusRes);
                } else if (status === 'failed') {
                    setStage('failed');
                    setError(statusRes.message || 'Payment failed');
                    if (pollInterval.current) clearInterval(pollInterval.current);
                }
            } catch (err) {
                console.error('Polling error:', err);
                // Don't fail immediately on polling error (could be network glitch)
            }
        }, 3000); // Poll every 3 seconds
    };

    const handleSuccess = (data: any) => {
        setStage('success');
        if (pollInterval.current) clearInterval(pollInterval.current);
        if (timerInterval.current) clearInterval(timerInterval.current);

        // Include gateway/mode info
        // Pass the actual gateway type from settings for proper payment method recording
        const result = {
            ...data,
            gateway: qrData?.gateway || (settings.mode === 'custom' ? 'qr' : undefined),
            gatewayType: settings.mode === 'gateway' && settings.gatewayConfig
                ? settings.gatewayConfig.gatewayType
                : undefined
        };

        // Wait a moment to show success state before closing
        setTimeout(() => {
            onSuccess(result);
        }, 1500);
    };

    const handleManualVerify = async () => {
        setStage('verifying');
        try {
            // If custom mode, there's no technical verification, just trust the cashier.
            // If gateway mode, we might want to force a check or mark as manually verified.
            // Using the manual verify endpoint we created
            if (settings.mode === 'gateway' && qrData?.qrCodeId) {
                await api.manualVerifyQR(qrData.qrCodeId);
                // The polling should catch it, or we trigger success directly
                handleSuccess({ status: 'completed', paymentId: qrData.qrCodeId, method: 'manual_verify' });
            } else {
                // Custom mode - pure trust
                handleSuccess({ status: 'completed', paymentId: `CUSTOM_${Date.now()}`, method: 'manual_custom' });
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Verification failed');
            setStage('waiting'); // Return to waiting to try again
        }
    };

    const handleCancel = async () => {
        cleanup(); // Immediate stop
        if (settings.mode === 'gateway' && qrData?.qrCodeId) {
            try {
                await api.cancelQR(qrData.qrCodeId);
            } catch (err) {
                console.warn('Cancel failed:', err);
            }
        }
        onClose();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col items-center"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="w-full p-4 border-b flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-blue-600" />
                            Scan to Pay
                        </h3>
                        <button onClick={handleCancel} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 flex flex-col items-center w-full">

                        {/* Amount Display */}
                        <div className="mb-8 text-center">
                            <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">Total Amount</div>
                            <div className="text-4xl font-bold text-blue-600 mt-1">{formatPrice(amount)}</div>
                        </div>

                        {/* QR / Status Area */}
                        <div className="w-64 h-64 bg-slate-100 rounded-xl flex flex-col items-center justify-center mb-6 relative border-2 border-slate-200">
                            {stage === 'generating' && (
                                <div className="flex flex-col items-center gap-2 text-slate-500">
                                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                                    <span className="text-sm font-medium">Generating QR...</span>
                                </div>
                            )}

                            {stage === 'waiting' && qrData && (
                                <>
                                    {qrData.qrCodeUrl ? (
                                        <Image
                                            height={200}
                                            width={200}
                                            src={qrData.qrCodeUrl}
                                            alt="Payment QR"
                                            className="w-full h-full object-contain p-2"
                                        />
                                    ) : qrData.qrCodeData ? (
                                        <div className="p-4 bg-white rounded-lg flex items-center justify-center w-full h-full">
                                            <QRCode
                                                value={qrData.qrCodeData}
                                                size={200}
                                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                viewBox={`0 0 256 256`}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <AlertCircle className="w-10 h-10" />
                                            <span>No QR Image Available</span>
                                        </div>
                                    )}

                                    {/* Timer Overlay */}
                                    {timeLeft > 0 && (
                                        <div className="absolute -bottom-3 bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                                            <Clock className="w-3 h-3" />
                                            {formatTime(timeLeft)}
                                        </div>
                                    )}
                                </>
                            )}

                            {stage === 'success' && (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center gap-2 text-green-600"
                                >
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-10 h-10" />
                                    </div>
                                    <span className="font-bold text-lg">Paid!</span>
                                </motion.div>
                            )}

                            {stage === 'failed' && (
                                <div className="flex flex-col items-center gap-2 text-red-500 px-4 text-center">
                                    <AlertCircle className="w-10 h-10" />
                                    <span className="font-bold">Payment Failed</span>
                                    <span className="text-xs text-slate-500">{error}</span>
                                </div>
                            )}

                            {stage === 'expired' && (
                                <div className="flex flex-col items-center gap-2 text-orange-500">
                                    <AlertCircle className="w-10 h-10" />
                                    <span className="font-bold">QR Expired</span>
                                </div>
                            )}
                        </div>

                        {/* Instructions */}
                        {settings.displaySettings?.instructions && stage === 'waiting' && (
                            <p className="text-center text-sm text-slate-600 mb-6 px-4">
                                {settings.displaySettings.instructions}
                            </p>
                        )}
                        {!settings.displaySettings?.instructions && stage === 'waiting' && (
                            <p className="text-center text-sm text-slate-500 mb-6">
                                Scan the QR code using to make payment.
                            </p>
                        )}

                        {/* Actions */}
                        <div className="w-full flex gap-3">
                            <button
                                onClick={handleCancel}
                                className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            {(stage === 'waiting' || stage === 'expired' || stage === 'failed' || stage === 'verifying') && (
                                <button
                                    onClick={stage === 'expired' ? initializePayment : handleManualVerify}
                                    disabled={stage === 'verifying'}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {stage === 'expired' ? 'Regenerate' : (stage === 'verifying' ? 'Verifying...' : 'Verify Manually')}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// Helper for 'step' typo in JSX above if any
// corrected 'step' to 'stage' in Instructions check block
