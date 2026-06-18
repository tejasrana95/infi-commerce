'use client';

import React from 'react';
import { ModuleProps } from '../..';
import ModuleRenderer from '@/components/core/layout/ModuleRenderer';
import styles from './SectionLayout.module.scss';

interface SectionLayoutConfig {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
    borderRadius?: number;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    modules?: any[];
}

export default function SectionLayoutModule({ config, sectionType }: ModuleProps) {
    const {
        backgroundColor = 'transparent',
        borderColor = '#e5e7eb',
        borderWidth = 0,
        borderStyle = 'none',
        borderRadius = 8,
        paddingTop = 16,
        paddingBottom = 16,
        paddingLeft = 16,
        paddingRight = 16,
        modules = []
    } = config as SectionLayoutConfig;

    const containerStyle: React.CSSProperties = {
        backgroundColor,
        borderColor,
        borderWidth: borderWidth > 0 && borderStyle !== 'none' ? `${borderWidth}px` : undefined,
        borderStyle: borderWidth > 0 ? borderStyle : undefined,
        borderRadius: borderRadius ? `${borderRadius}px` : undefined,
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        paddingLeft: `${paddingLeft}px`,
        paddingRight: `${paddingRight}px`,
        gap: config.gap !== undefined ? `${config.gap}px` : undefined,
        boxSizing: 'border-box',
        width: '100%',
    };

    // Sort modules by order
    const sortedModules = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));

    return (
        <div className={styles.sectionLayout} style={containerStyle}>
            {sortedModules.map((nestedModule) => (
                <ModuleRenderer
                    key={nestedModule.id}
                    module={nestedModule}
                    sectionType={sectionType}
                />
            ))}
        </div>
    );
}
