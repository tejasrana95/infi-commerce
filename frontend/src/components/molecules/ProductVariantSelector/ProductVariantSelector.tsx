'use client';

import React from 'react';
import styles from './ProductVariantSelector.module.scss';

interface OptionValue {
    label: string;
    value: string;
    colorCode?: string;
}

interface ProductOption {
    optionId: string;
    name: string;
    type?: string;
    values: OptionValue[];
    isVariation: boolean;
}

interface ProductVariantSelectorProps {
    options: ProductOption[];
    selectedOptions: Record<string, string>;
    availableOptions: Record<string, string[]>;
    onOptionChange: (optionId: string, value: string) => void;
    config?: {
        style?: 'dropdown' | 'buttons' | 'swatches';
        showUnavailable?: boolean;
    };
}

export default function ProductVariantSelector({
    options,
    selectedOptions,
    availableOptions,
    onOptionChange,
    config = {},
}: ProductVariantSelectorProps) {
    const { style = 'buttons', showUnavailable = true } = config;

    const variationOptions = options.filter((opt) => opt.isVariation);

    if (variationOptions.length === 0) return null;

    const renderDropdown = (option: ProductOption) => {
        const available = availableOptions[option.optionId] || [];
        const allValues = showUnavailable ? option.values : option.values.filter(v => available.includes(v.value));

        return (
            <select
                className={styles.dropdown}
                value={selectedOptions[option.optionId] || ''}
                onChange={(e) => onOptionChange(option.optionId, e.target.value)}
            >
                <option value="">Select {option.name}</option>
                {allValues.map((optionValue) => {
                    const isAvailable = available.includes(optionValue.value);
                    return (
                        <option
                            key={optionValue.value}
                            value={optionValue.value}
                            disabled={!isAvailable}
                        >
                            {optionValue.label} {!isAvailable ? '(Unavailable)' : ''}
                        </option>
                    );
                })}
            </select>
        );
    };

    const renderButtons = (option: ProductOption) => {
        const available = availableOptions[option.optionId] || [];
        const allValues = showUnavailable ? option.values : option.values.filter(v => available.includes(v.value));

        return (
            <div className={styles.optionButtons}>
                {allValues.map((optionValue) => {
                    const isSelected = selectedOptions[option.optionId] === optionValue.value;
                    const isAvailable = available.includes(optionValue.value);

                    return (
                        <button
                            key={optionValue.value}
                            className={`${styles.optionButton} ${isSelected ? styles.selected : ''} ${!isAvailable ? styles.unavailable : ''}`}
                            onClick={() => isAvailable && onOptionChange(option.optionId, optionValue.value)}
                            disabled={!isAvailable}
                            title={!isAvailable ? 'This option is not available' : ''}
                        >
                            {optionValue.label}
                        </button>
                    );
                })}
            </div>
        );
    };

    const renderSwatches = (option: ProductOption) => {
        const available = availableOptions[option.optionId] || [];
        const allValues = showUnavailable ? option.values : option.values.filter(v => available.includes(v.value));
        const isColorOption = option.type === 'color' || option.values.some(v => v.colorCode);

        return (
            <div className={styles.swatches}>
                {allValues.map((optionValue) => {
                    const isSelected = selectedOptions[option.optionId] === optionValue.value;
                    const isAvailable = available.includes(optionValue.value);

                    if (isColorOption && optionValue.colorCode) {
                        return (
                            <button
                                key={optionValue.value}
                                className={`${styles.colorSwatch} ${isSelected ? styles.selected : ''} ${!isAvailable ? styles.unavailable : ''}`}
                                onClick={() => isAvailable && onOptionChange(option.optionId, optionValue.value)}
                                disabled={!isAvailable}
                                title={optionValue.label}
                                style={{ backgroundColor: optionValue.colorCode }}
                            >
                                {isSelected && <span className={styles.checkmark}>✓</span>}
                            </button>
                        );
                    }

                    // Non-color swatches (like size)
                    return (
                        <button
                            key={optionValue.value}
                            className={`${styles.swatch} ${isSelected ? styles.selected : ''} ${!isAvailable ? styles.unavailable : ''}`}
                            onClick={() => isAvailable && onOptionChange(option.optionId, optionValue.value)}
                            disabled={!isAvailable}
                            title={!isAvailable ? 'Unavailable' : ''}
                        >
                            {optionValue.label}
                        </button>
                    );
                })}
            </div>
        );
    };

    const renderOption = (option: ProductOption) => {
        switch (style) {
            case 'dropdown':
                return renderDropdown(option);
            case 'swatches':
                return renderSwatches(option);
            case 'buttons':
            default:
                return renderButtons(option);
        }
    };

    return (
        <div className={styles.variantSelector}>
            {variationOptions.map((option) => (
                <div key={option.optionId} className={styles.optionGroup}>
                    <label className={styles.optionLabel}>
                        {option.name}
                        {!selectedOptions[option.optionId] && (
                            <span className={styles.required}>*</span>
                        )}
                    </label>
                    {renderOption(option)}
                </div>
            ))}
        </div>
    );
}
