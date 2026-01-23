'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';
import { barcodeService } from '@/services/barcode.service';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../atoms/Button';

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (barcode: string) => Promise<void>;
}

export function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isOpen && videoRef.current) {
            startScanning();
        }

        return () => {
            stopScanning();
        };
    }, [isOpen]);

    const startScanning = async () => {
        if (!videoRef.current) return;

        setScanning(true);
        setError(null);

        try {
            await barcodeService.startCameraScan(
                videoRef.current,
                handleScanSuccess,
                handleScanError
            );
        } catch (err) {
            handleScanError(err as Error);
        }
    };

    const stopScanning = () => {
        barcodeService.stopCameraScan();
        setScanning(false);
    };

    const handleScanSuccess = async (barcode: string) => {
        setScanning(false);
        setSuccess(true);

        try {
            await onScan(barcode);

            // Show success feedback briefly
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add product');
            setSuccess(false);

            // Restart scanning after error
            setTimeout(() => {
                setError(null);
                startScanning();
            }, 2000);
        }
    };

    const handleScanError = (err: Error) => {
        console.error('Scanner error:', err);
        setError(err.message || 'Failed to access camera');
        setScanning(false);
    };

    const handleClose = () => {
        stopScanning();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-2xl mx-4 bg-white rounded-lg shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2">
                            <Camera className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold">Scan Barcode</h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Video Container */}
                    <div className="relative aspect-video bg-black">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            autoPlay
                            playsInline
                            muted
                        />

                        {/* Scanning Overlay */}
                        {scanning && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                    {/* Scanning Frame */}
                                    <div className="w-64 h-64 border-4 border-blue-500 rounded-lg relative">
                                        {/* Corner Decorations */}
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />

                                        {/* Scanning Line */}
                                        <motion.div
                                            className="absolute left-0 right-0 h-1 bg-blue-400 shadow-lg shadow-blue-400"
                                            animate={{ top: ['0%', '100%'] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                        />
                                    </div>

                                    {/* Instruction Text */}
                                    <p className="text-white text-center mt-4 bg-black/50 px-4 py-2 rounded-lg">
                                        Position barcode within the frame
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Success Overlay */}
                        {success && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 flex items-center justify-center bg-green-500/30 backdrop-blur-sm"
                            >
                                <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
                                    <p className="text-lg font-semibold">✓ Scanned Successfully!</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Error Overlay */}
                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                                <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-md mx-4 text-center">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                                    <p className="font-semibold mb-1">Camera Error</p>
                                    <p className="text-sm">{error}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 border-t">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                {scanning ? 'Scanning for barcode...' : 'Camera stopped'}
                            </p>
                            <Button onClick={handleClose} variant="secondary">
                                Close
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
