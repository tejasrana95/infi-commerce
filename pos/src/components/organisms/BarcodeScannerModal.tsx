'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, AlertCircle, RefreshCw, CheckCircle, Package } from 'lucide-react';
import { barcodeService } from '@/services/barcode.service';
import { sounds } from '@/utils/sounds';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../atoms/Button';

interface ScannedItem {
    barcode: string;
    productName?: string;
    timestamp: Date;
    success: boolean;
    error?: string;
}

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (barcode: string) => Promise<{ productName?: string } | void>;
}

export function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initializing, setInitializing] = useState(false);
    const [lastScanned, setLastScanned] = useState<ScannedItem | null>(null);
    const [scannedHistory, setScannedHistory] = useState<ScannedItem[]>([]);
    const [totalScanned, setTotalScanned] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const startScanning = useCallback(async () => {
        if (!videoRef.current) return;

        setInitializing(true);
        setScanning(false);
        setError(null);

        try {
            await barcodeService.startCameraScan(
                videoRef.current,
                handleScanSuccess,
                handleScanError
            );
            setScanning(true);
            setInitializing(false);
        } catch (err) {
            handleScanError(err as Error);
        }
    }, []);

    const stopScanning = useCallback(async () => {
        if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current);
        }
        await barcodeService.stopCameraScan();
        setScanning(false);
        setInitializing(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            // Reset state when opening
            setScannedHistory([]);
            setTotalScanned(0);
            setLastScanned(null);
            
            // Small delay to ensure DOM is ready
            const timer = setTimeout(() => {
                startScanning();
            }, 200);
            return () => clearTimeout(timer);
        } else {
            stopScanning();
        }

        return () => {
            stopScanning();
        };
    }, [isOpen, startScanning, stopScanning]);

    const handleScanSuccess = async (barcode: string) => {
        // Temporarily pause scanning to process
        setScanning(false);
        
        const scannedItem: ScannedItem = {
            barcode,
            timestamp: new Date(),
            success: false,
        };

        try {
            const result = await onScan(barcode);
            
            scannedItem.success = true;
            scannedItem.productName = result?.productName;
            
            setLastScanned(scannedItem);
            setScannedHistory(prev => [scannedItem, ...prev].slice(0, 10)); // Keep last 10
            setTotalScanned(prev => prev + 1);

            // Auto-restart scanning after brief success feedback
            scanTimeoutRef.current = setTimeout(() => {
                setLastScanned(null);
                startScanning();
            }, 1500);

        } catch (err) {
            scannedItem.success = false;
            scannedItem.error = err instanceof Error ? err.message : 'Product not found';
            
            // Play error sound
           sounds.error();
            
            setLastScanned(scannedItem);
            setScannedHistory(prev => [scannedItem, ...prev].slice(0, 10));

            // Auto-restart scanning after error feedback
            scanTimeoutRef.current = setTimeout(() => {
                setLastScanned(null);
                startScanning();
            }, 2000);
        }
    };

    const handleScanError = (err: Error) => {
        console.error('Scanner error:', err);
        setError(err.message || 'Failed to access camera. Please check permissions.');
        setScanning(false);
        setInitializing(false);
    };

    const handleClose = async () => {
        await stopScanning();
        onClose();
    };

    const handleRetry = () => {
        setError(null);
        startScanning();
    };

    const handleClearHistory = () => {
        setScannedHistory([]);
        setTotalScanned(0);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-4xl mx-4 bg-white rounded-lg shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Camera className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-semibold">Quick Scan Mode</h2>
                            </div>
                            {totalScanned > 0 && (
                                <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full">
                                    <Package className="w-4 h-4" />
                                    <span className="text-sm font-medium">{totalScanned} item{totalScanned !== 1 ? 's' : ''} added</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-col lg:flex-row">
                        {/* Scanner Container */}
                        <div 
                            ref={containerRef}
                            className="relative bg-black flex-1"
                            style={{ minHeight: '400px' }}
                        >
                            {/* Hidden video element for reference */}
                            <video
                                ref={videoRef}
                                className="hidden"
                                autoPlay
                                playsInline
                                muted
                            />

                            {/* Scanner will render here via html5-qrcode */}
                            <div 
                                id="barcode-scanner-container" 
                                className="w-full h-full"
                                style={{ minHeight: '400px' }}
                            />

                            {/* Initializing Overlay */}
                            {initializing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                                    <div className="text-white text-center">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            className="w-12 h-12 mx-auto mb-4"
                                        >
                                            <RefreshCw className="w-12 h-12" />
                                        </motion.div>
                                        <p className="text-lg font-medium">Initializing Camera...</p>
                                    </div>
                                </div>
                            )}

                            {/* Scanning Status */}
                            {scanning && !error && !lastScanned && (
                                <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2">
                                    <div className="bg-blue-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </motion.div>
                                        <span className="text-sm font-medium">Ready to scan...</span>
                                    </div>
                                </div>
                            )}

                            {/* Last Scanned Feedback */}
                            {lastScanned && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`absolute inset-0 flex items-center justify-center ${
                                        lastScanned.success ? 'bg-green-500/90' : 'bg-red-500/90'
                                    } backdrop-blur-sm`}
                                >
                                    <div className="text-white text-center">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center"
                                        >
                                            {lastScanned.success ? (
                                                <CheckCircle className="w-10 h-10 text-green-500" />
                                            ) : (
                                                <AlertCircle className="w-10 h-10 text-red-500" />
                                            )}
                                        </motion.div>
                                        <p className="text-xl font-bold mb-1">
                                            {lastScanned.success ? 'Added to Cart!' : 'Not Found'}
                                        </p>
                                        {lastScanned.productName && (
                                            <p className="text-sm mb-2">{lastScanned.productName}</p>
                                        )}
                                        <p className="text-sm font-mono bg-white/20 px-4 py-2 rounded-lg inline-block">
                                            {lastScanned.barcode}
                                        </p>
                                        {lastScanned.error && (
                                            <p className="text-sm mt-2 text-red-200">{lastScanned.error}</p>
                                        )}
                                        <p className="text-xs mt-3 text-white/70">
                                            Resuming scan automatically...
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Error Overlay */}
                            {error && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                                    <div className="text-white  flex flex-col items-center justify-center text-center max-w-md mx-4">
                                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                                        <p className="text-lg font-semibold mb-2">Camera Error</p>
                                        <p className="text-sm text-gray-300 mb-4">{error}</p>
                                        <Button onClick={handleRetry} className='flex  text-center items-center' variant="primary">
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Try Again
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Scan History Sidebar */}
                        <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l bg-gray-50">
                            <div className="p-3 border-b bg-white flex items-center justify-between">
                                <h3 className="font-medium text-sm">Recent Scans</h3>
                                {scannedHistory.length > 0 && (
                                    <button
                                        onClick={handleClearHistory}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <div className="max-h-80 lg:max-h-[350px] overflow-y-auto">
                                {scannedHistory.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                        <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                        Scanned items will appear here
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {scannedHistory.map((item, index) => (
                                            <div
                                                key={`${item.barcode}-${index}`}
                                                className={`p-3 ${item.success ? 'bg-white' : 'bg-red-50'}`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    {item.success ? (
                                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    ) : (
                                                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            {item.productName || item.barcode}
                                                        </p>
                                                        {item.productName && (
                                                            <p className="text-xs text-gray-500 font-mono">
                                                                {item.barcode}
                                                            </p>
                                                        )}
                                                        {item.error && (
                                                            <p className="text-xs text-red-600">{item.error}</p>
                                                        )}
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {item.timestamp.toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 border-t">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                {initializing ? (
                                    'Starting camera...'
                                ) : scanning && !error && !lastScanned ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        Point camera at barcode • Continuous mode active
                                    </span>
                                ) : lastScanned ? (
                                    <span className="flex items-center gap-2">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Resuming scanner...
                                    </span>
                                ) : error ? (
                                    'Camera access failed'
                                ) : (
                                    'Initializing...'
                                )}
                            </div>
                            <Button onClick={handleClose} variant="secondary">
                                Done ({totalScanned} added)
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
