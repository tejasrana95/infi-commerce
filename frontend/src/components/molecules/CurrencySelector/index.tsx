'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/providers/StoreProvider';
import styles from './style.module.scss';

export default function CurrencySelector() {
    const { currentCurrency, availableCurrencies, setCurrency } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleCurrencySelect = (code: string) => {
        setCurrency?.(code);
        setIsOpen(false);
    };

    if (!availableCurrencies || availableCurrencies.length === 0) return null;

    return (
        <div className={styles.container} ref={dropdownRef}>
            <button
                className={styles.trigger}
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={styles.triggerContent}>
                    <span className={styles.symbol}>{currentCurrency?.symbol || '$'}</span>
                    <span className={styles.code}>{currentCurrency?.code || 'USD'}</span>
                </span>
                <svg
                    className={`${styles.arrow} ${isOpen ? styles.open : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <ul className={styles.dropdown} role="listbox">
                    {availableCurrencies.map((currency) => (
                        <li
                            key={currency.code}
                            className={`${styles.item} ${currentCurrency?.code === currency.code ? styles.selected : ''}`}
                            onClick={() => handleCurrencySelect(currency.code)}
                            role="option"
                            aria-selected={currentCurrency?.code === currency.code}
                        >
                            <span className={styles.itemLeft}>
                                <span className={styles.itemSymbol}>{currency.symbol}</span>
                                <span className={styles.itemCode}>{currency.code}</span>
                            </span>
                            {currentCurrency?.code === currency.code && (
                                <svg className={styles.check} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
