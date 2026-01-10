'use client';

import React from 'react';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import * as AiIcons from 'react-icons/ai';
import * as BiIcons from 'react-icons/bi';
import * as BsIcons from 'react-icons/bs';
import * as IoIcons from 'react-icons/io5';
import * as HiIcons from 'react-icons/hi';
import * as RiIcons from 'react-icons/ri';
import * as LucideIcons from 'lucide-react';
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

    // Get the icon library based on prefix
    const getIconLibrary = (iconName: string) => {
        // Check if icon has a 2-letter prefix (e.g., Fa, Md, Ai, etc.)
        const prefix = iconName.substring(0, 2).toLowerCase();
        const libraries: Record<string, any> = {
            'fa': FaIcons,
            'md': MdIcons,
            'ai': AiIcons,
            'bi': BiIcons,
            'bs': BsIcons,
            'io': IoIcons,
            'hi': HiIcons,
            'ri': RiIcons,
        };

        // If prefix exists in libraries, use it; otherwise assume Lucide
        return libraries[prefix] || LucideIcons;
    };

    // Get the icon component dynamically
    const iconLibrary = getIconLibrary(icon);
    const IconComponent = (iconLibrary as any)[icon] || FaIcons.FaStar;
    const isLucideIcon = iconLibrary === LucideIcons;

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
        fontSize: `${size}px`,
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
                {isLucideIcon ? (
                    <IconComponent size={size} strokeWidth={1.5} />
                ) : (
                    <IconComponent />
                )}
            </div>
        </div>
    );
}
