'use client';

import React from 'react';
import DynamicIcon from '../../../common/DynamicIcon';
import styles from './index.module.scss';

interface TableProps {
    config: Record<string, any>;
    sectionType?: 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';
    initialData?: any;
    priority?: boolean;
}

export default function Table({ config }: TableProps) {
    const {
        headers = ['Header 1', 'Header 2', 'Header 3'],
        rows = [['Cell 1-1', 'Cell 1-2', 'Cell 1-3']],
        headerBgColor = '#f3f4f6',
        headerTextColor = '#1f2937',
        headerAlignment = 'left',
        stripedRows = true,
        hoverEffect = true,
        borderWidth = 1,
        borderColor = '#e5e7eb',
        borderStyle = 'solid',
        borderRadius = 8,
        cellPadding = 12,
        cellAlignment = 'left',
        responsiveMode = 'scroll',
    } = config;

    const renderCellContent = (cell: any) => {
        // Handle legacy string format
        if (typeof cell === 'string') {
            return <span>{cell}</span>;
        }

        // Handle new object format with icons and HTML
        const { content = '', prefixIcon = '', suffixIcon = '', textColor = '', bgColor = '' } = cell;

        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: textColor || 'inherit',
                backgroundColor: bgColor || 'transparent',
                padding: bgColor ? '4px 8px' : '0',
                borderRadius: bgColor ? '4px' : '0',
            }}>
                {prefixIcon && <DynamicIcon name={prefixIcon} size={16} />}
                <span dangerouslySetInnerHTML={{ __html: content }} />
                {suffixIcon && <DynamicIcon name={suffixIcon} size={16} />}
            </div>
        );
    };

    const tableStyle: React.CSSProperties = {
        border: `${borderWidth}px ${borderStyle} ${borderColor}`,
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
        width: '100%',
    };

    const headerStyle: React.CSSProperties = {
        backgroundColor: headerBgColor,
        color: headerTextColor,
        textAlign: headerAlignment as any,
        padding: `${cellPadding}px`,
        fontWeight: 600,
    };

    const cellStyle: React.CSSProperties = {
        textAlign: cellAlignment as any,
        padding: `${cellPadding}px`,
        borderBottom: `${borderWidth}px ${borderStyle} ${borderColor}`,
    };

    const containerClasses = [
        styles.tableContainer,
        responsiveMode === 'scroll' && styles.scroll,
        responsiveMode === 'stack' && styles.stack,
    ].filter(Boolean).join(' ');

    const tableClasses = [
        styles.table,
        stripedRows && styles.striped,
        hoverEffect && styles.hoverable,
    ].filter(Boolean).join(' ');

    return (
        <div className={containerClasses}>
            <table className={tableClasses} style={tableStyle}>
                <thead>
                    <tr>
                        {headers.map((header: string, index: number) => (
                            <th key={index} style={headerStyle}>
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row: any[], rowIndex: number) => (
                        <tr key={rowIndex}>
                            {row.map((cell: any, cellIndex: number) => (
                                <td
                                    key={cellIndex}
                                    style={cellStyle}
                                    data-label={headers[cellIndex]}
                                >
                                    {renderCellContent(cell)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
