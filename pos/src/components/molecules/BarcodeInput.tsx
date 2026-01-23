'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Barcode } from 'lucide-react';

import { barcodeService } from '@/services/barcode.service';
import Input from '../atoms/Input';
import Spinner from '../atoms/Spinner';

interface BarcodeInputProps {
    onScan: (barcode: string) => Promise<void>;
    placeholder?: string;
    autoFocus?: boolean;
}

export function BarcodeInput({ onScan, placeholder = 'Scan or enter barcode...', autoFocus = false }: BarcodeInputProps) {
    const [barcode, setBarcode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const lastKeyTimeRef = useRef<number>(0);
    const typingSpeedRef = useRef<number[]>([]);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    // Register global keyboard shortcut (F2) to focus input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSubmit = async () => {
        const trimmedBarcode = barcode.trim();

        if (!trimmedBarcode) {
            return;
        }

        if (!barcodeService.isValidBarcode(trimmedBarcode)) {
            setError('Invalid barcode format');
            return;
        }

        setError(null);
        setLoading(true);

        try {
            await onScan(trimmedBarcode);
            setBarcode(''); // Clear input after successful scan
            typingSpeedRef.current = [];
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process barcode');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Track typing speed to detect scanner input
        const now = Date.now();
        if (lastKeyTimeRef.current > 0) {
            const timeDiff = now - lastKeyTimeRef.current;
            typingSpeedRef.current.push(timeDiff);
        }
        lastKeyTimeRef.current = now;

        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleChange = (value: string) => {
        setBarcode(value);
        setError(null);

        // Auto-submit if it looks like scanner input (very fast typing)
        if (value.length >= 6) {
            const avgSpeed = typingSpeedRef.current.reduce((a, b) => a + b, 0) / typingSpeedRef.current.length;
            if (barcodeService.detectScannerInput(value, avgSpeed)) {
                // Small delay to ensure full barcode is captured
                setTimeout(() => {
                    handleSubmit();
                }, 50);
            }
        }
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                    ref={inputRef}
                    type="text"
                    value={barcode}
                    onChange={(e) => handleChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="pl-10 pr-10 text-sm"
                    disabled={loading}
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Spinner size="sm" />
                    </div>
                )}
            </div>
            {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
            <p className="text-xs text-gray-500  mt-1">
                Press F2 to focus • Enter to search
            </p>
        </div>
    );
}
