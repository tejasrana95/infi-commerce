'use client';

import DynamicIcon from '../../../common/DynamicIcon';
import styles from './index.module.scss';

interface IconProps {
    config: Record<string, any>;
    sectionType?: 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';
    initialData?: any;
    priority?: boolean;
}

export default function Icon({ config }: IconProps) {
    const {
        icon = 'FaStar',
        size = 48,
        iconColor = '#000000',
        position = 'center',
        showBorder = false,
        borderColor = '#000000',
        borderSize = 2,
        borderRadius = 0,
        padding = 16,
        hoverEffect = false,
    } = config;

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: position === 'left' ? 'flex-start' : position === 'right' ? 'flex-end' : 'center',
        padding: `${padding}px`,
    };

    const iconWrapperStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: iconColor,
        ...(showBorder && {
            border: `${borderSize}px solid ${borderColor}`,
            borderRadius: `${borderRadius}px`,
            padding: `${size * 0.3}px`,
        }),
    };

    const iconWrapperClasses = [
        styles.iconWrapper,
        hoverEffect && styles.hoverEffect,
    ].filter(Boolean).join(' ');

    return (
        <div style={containerStyle} className={styles.container}>
            <div style={iconWrapperStyle} className={iconWrapperClasses}>
                <DynamicIcon name={icon} size={size} />
            </div>
        </div>
    );
}
