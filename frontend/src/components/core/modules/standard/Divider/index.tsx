'use client';

import React from 'react';
import { ModuleProps } from '../..';
import styles from './Divider.module.scss';

interface DividerConfig {
    style?: 'solid' | 'dashed' | 'dotted' | 'double';
    thickness?: number;
    color?: string;
    width?: 'full' | '75%' | '50%' | '25%' | 'custom';
    customWidth?: number | string;
    alignment?: 'left' | 'center' | 'right';
    marginTop?: number;
    marginBottom?: number;
}

export default function DividerModule({ config }: ModuleProps) {
    const {
        style = 'solid',
        thickness = 1,
        color = '#e0e0e0',
        width = 'full',
        customWidth,
        alignment = 'center',
        marginTop = 16,
        marginBottom = 16,
    } = config as DividerConfig;

    const widthValue = width === 'custom' && customWidth
        ? typeof customWidth === 'number' ? `${customWidth}px` : customWidth
        : width === 'full' ? '100%' : width;

    const alignClass = styles[`align${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`];

    return (
        <div
            className={`${styles.container} ${alignClass}`}
            style={{
                marginTop: `${marginTop}px`,
                marginBottom: `${marginBottom}px`,
            }}
        >
            <hr
                className={styles.divider}
                style={{
                    borderStyle: style,
                    borderTopWidth: `${thickness}px`,
                    borderColor: color,
                    width: widthValue,
                }}
            />
        </div>
    );
}
