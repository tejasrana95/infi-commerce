import React from 'react';
import styles from './Chip.module.scss';
import { X } from 'lucide-react';

/**
 * Chip Component - A versatile atomic component for displaying small pieces of information
 *
 * @example
 * // Basic usage
 * <Chip>Default Chip</Chip>
 *
 * // With variant and size
 * <Chip variant="primary" size="large">Primary Large</Chip>
 *
 * // With icon
 * <Chip variant="success" icon={<CheckIcon />}>Success</Chip>
 *
 * // Removable chip
 * <Chip variant="secondary" removable onRemove={() => console.log('removed')}>Removable</Chip>
 *
 * // Clickable chip
 * <Chip variant="info" onClick={() => console.log('clicked')}>Clickable</Chip>
 *
 * // Discount chip (special variant for order discounts)
 * <Chip variant="discount" size="small">-20% OFF</Chip>
 */
export type ChipVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'discount' | 'info';
export type ChipSize = 'small' | 'medium' | 'large';

export interface ChipProps {
    /** The content to display inside the chip */
    children: React.ReactNode;
    /** The visual style variant of the chip */
    variant?: ChipVariant;
    /** The size of the chip */
    size?: ChipSize;
    /** Additional CSS classes */
    className?: string;
    /** Click handler - makes the chip clickable */
    onClick?: () => void;
    /** Remove handler - called when remove button is clicked */
    onRemove?: () => void;
    /** Whether to show a remove button (×) */
    removable?: boolean;
    /** Icon to display before the content */
    icon?: React.ReactNode;
    /** Inline styles */
    style?: React.CSSProperties;
}

export default function Chip({
    children,
    variant = 'default',
    size = 'medium',
    className = '',
    onClick,
    onRemove,
    removable = false,
    icon,
    style = {},
}: ChipProps) {
    const handleClick = (e: React.MouseEvent) => {
        if (onClick) {
            e.preventDefault();
            onClick();
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRemove) {
            onRemove();
        }
    };

    return (
        <span
            className={`${styles.chip} ${styles[variant]} ${styles[size]} ${onClick ? styles.clickable : ''} ${className}`}
            onClick={handleClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            style={style}
        >
            {icon && <span className={styles.icon}>{icon}</span>}
            <span className={styles.content}>{children}</span>
            {removable && (
                <button
                    className={styles.removeButton}
                    onClick={handleRemove}
                    aria-label="Remove"
                    type="button"
                >
                    <X size={14} />
                </button>
            )}
        </span>
    );
}