'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Barcode, CheckCircle, AlertCircle, Camera } from 'lucide-react';

import { barcodeService } from '@/services/barcode.service';
import { sounds } from '@/utils/sounds';
import Input from '../atoms/Input';
import Spinner from '../atoms/Spinner';
import IconButton from '../atoms/IconButton';
import { isMobile, isTablet } from '@/utils/device';

interface BarcodeInputProps {
    onScan: (barcode: string) => Promise<void>;
    placeholder?: string;
    autoFocus?: boolean;
    setShowCameraScanner?: (show: boolean) => void;
}

export function BarcodeInput({ onScan, placeholder = 'Scan or type SKU/barcode...', autoFocus = true, setShowCameraScanner = () => { } }: BarcodeInputProps) {
    const [barcode, setBarcode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const lastKeyTimeRef = useRef<number>(0);
    const typingSpeedRef = useRef<number[]>([]);
    const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-focus on mount
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    // Keep focus when clicking on empty areas (not on interactive elements)
    useEffect(() => {
        const disableAutoFocus = isMobile() || isTablet();

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Check if clicking on an interactive element or inside one
            const isInteractive = target.closest('input, button, select, textarea, [role="button"], [tabindex], a, label');

            // Only refocus if clicking on a truly empty area (like the background)
            if (!isInteractive && inputRef.current && !loading && !disableAutoFocus) {
                // Check if the click target is a container/wrapper element
                const isEmptyArea = target.tagName === 'DIV' || target.tagName === 'MAIN' || target.tagName === 'SECTION';
                if (isEmptyArea) {
                    setTimeout(() => {
                        inputRef.current?.focus();
                    }, 10);
                }
            }
        };
        if (!disableAutoFocus) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [loading]);

    // Register global keyboard shortcut (F2 or F4) to focus input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                const target = e.target as HTMLElement;
                const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

                if (!isInInput || e.key === 'F2') {
                    e.preventDefault();
                    inputRef.current?.focus();
                    inputRef.current?.select();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        };
    }, []);

    const refocusInput = useCallback(() => {
        setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    }, []);

    const handleSubmit = async () => {
        const trimmedBarcode = barcode.trim().toUpperCase(); // Normalize to uppercase for SKU matching

        if (!trimmedBarcode) {
            refocusInput();
            return;
        }

        // For SKU/barcode lookup, we allow alphanumeric and common barcode characters
        if (!barcodeService.isValidBarcode(trimmedBarcode)) {
            setError('Invalid SKU/barcode format');
            sounds.error()
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
            errorTimeoutRef.current = setTimeout(() => {
                setError(null);
            }, 3000);
            setBarcode(''); // Clear invalid input
            refocusInput();
            return;
        }

        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            await onScan(trimmedBarcode);

            setSuccess(`Added: ${trimmedBarcode}`);
            if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
            successTimeoutRef.current = setTimeout(() => {
                setSuccess(null);
            }, 2000);

            setBarcode('');
            typingSpeedRef.current = [];
            lastKeyTimeRef.current = 0;

        } catch (err) {
            // More specific error message for SKU lookup
            const errorMessage = err instanceof Error ? err.message : 'No product found with this SKU/barcode';
            setError(errorMessage);
            sounds.error();
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
            errorTimeoutRef.current = setTimeout(() => {
                setError(null);
            }, 3000);
            // Don't clear input on error so user can see what they entered
        } finally {
            setLoading(false);
            refocusInput();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const now = Date.now();
        if (lastKeyTimeRef.current > 0) {
            const timeDiff = now - lastKeyTimeRef.current;
            typingSpeedRef.current.push(timeDiff);
            if (typingSpeedRef.current.length > 20) {
                typingSpeedRef.current.shift();
            }
        }
        lastKeyTimeRef.current = now;

        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }

        if (e.key === 'Escape') {
            setBarcode('');
            setError(null);
            setSuccess(null);
            typingSpeedRef.current = [];
            lastKeyTimeRef.current = 0;
        }
    };

    const handleChange = (value: string) => {
        // Convert to uppercase for consistency with SKU format
        const upperValue = value.toUpperCase();
        setBarcode(upperValue);
        setError(null);

        if (upperValue.length >= 6) {
            const speeds = typingSpeedRef.current;
            if (speeds.length >= 3) {
                const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
                if (barcodeService.detectScannerInput(upperValue, avgSpeed)) {
                    setTimeout(() => {
                        if (inputRef.current?.value.toUpperCase() === upperValue) {
                            handleSubmit();
                        }
                    }, 100);
                }
            }
        }
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-5 text-gray-400" />
                <Input
                    ref={inputRef}
                    type="text"
                    value={barcode}
                    onChange={(e) => handleChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={`pl-10 pr-10 text-sm  ${error ? 'border-red-500 focus:ring-red-500' :
                        success ? 'border-green-500 focus:ring-green-500' : ''
                        }`}
                    disabled={loading}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                />
                {!loading && (!success && !error) && (
                    <IconButton
                        icon={<Camera className="w-5 h-5" />}
                        onClick={() => setShowCameraScanner(true)}
                        variant="ghost"
                        title="Open camera scanner"
                        className='absolute right-0 top-1/2 transform -translate-y-1/2'
                    />
                )}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {loading && <Spinner size="sm" />}
                    {!loading && success && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {!loading && error && <AlertCircle className="w-5 h-5 text-red-500" />}
                </div>
            </div>

            {/* Status Messages */}
            <div className="h-5 mt-1">
                {error && (
                    <p className="text-sm text-red-500 animate-pulse">{error}</p>
                )}
                {success && !error && (
                    <p className="text-sm text-green-600">{success}</p>
                )}
                {!error && !success && (
                    <p className="text-xs text-gray-500" style={{ fontSize: '10px' }}>
                        SKU/Barcode only • F2 to focus • Enter to add
                    </p>
                )}
            </div>
        </div>
    );
}
