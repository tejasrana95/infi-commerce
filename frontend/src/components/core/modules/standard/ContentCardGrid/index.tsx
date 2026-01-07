'use client';

import React, { useEffect, useState } from 'react';
import { ModuleProps } from '../../index';
import styles from './styles.module.css';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import * as BiIcons from 'react-icons/bi';
import * as IoIcons from 'react-icons/io5';
import * as LucideIcons from 'lucide-react';
import api from '@/lib/api';

interface ContentCard {
    _id: string;
    title: string;
    slug: string;
    visualType: 'image' | 'icon';
    image?: string;
    icon?: string;
    excerpt?: string;
    content: string;
    metadata?: Array<{
        icon?: string;
        label: string;
        value: string;
    }>;
    valueDisplay?: {
        prefix?: string;
        amount: string;
        postfix?: string;
    };
    categoryId?: any;
    tags?: string[];
    buttons?: Array<{
        label: string;
        url: string;
        isPrimary: boolean;
        openInNewTab: boolean;
    }>;
    status: string;
}

const ContentCardGridModule: React.FC<ModuleProps> = ({ config }) => {
    const [cards, setCards] = useState<ContentCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCards();
    }, [config.categoryId, config.limit, config.sortBy]);

    const fetchCards = async () => {
        try {
            setLoading(true);
            const params: any = {
                limit: config.limit || 6,
                status: 'published',
            };

            if (config.categoryId) {
                params.categoryId = config.categoryId;
            }

            if (config.sortBy) {
                const sortMap: Record<string, { sortBy: string; sortOrder: string }> = {
                    latest: { sortBy: 'publishedAt', sortOrder: 'desc' },
                    oldest: { sortBy: 'publishedAt', sortOrder: 'asc' },
                    'title-asc': { sortBy: 'title', sortOrder: 'asc' },
                    'title-desc': { sortBy: 'title', sortOrder: 'desc' },
                };
                const sort = sortMap[config.sortBy] || sortMap.latest;
                params.sortBy = sort.sortBy;
                params.sortOrder = sort.sortOrder;
            }

            const queryParams = new URLSearchParams();
            Object.keys(params).forEach(key => queryParams.append(key, params[key]));

            const response = await api.get(`content-cards/cards?${queryParams.toString()}`);
            setCards(response.data || []);
        } catch (error) {
            console.error('Failed to fetch content cards:', error);
            setCards([]);
        } finally {
            setLoading(false);
        }
    };

    const renderIcon = (iconName: string, size = 24) => {
        try {
            if (iconName.startsWith('Fa')) {
                const Icon = (FaIcons as any)[iconName];
                return Icon ? <Icon size={size} /> : null;
            }
            if (iconName.startsWith('Md')) {
                const Icon = (MdIcons as any)[iconName];
                return Icon ? <Icon size={size} /> : null;
            }
            if (iconName.startsWith('Bi')) {
                const Icon = (BiIcons as any)[iconName];
                return Icon ? <Icon size={size} /> : null;
            }
            if (iconName.startsWith('Io')) {
                const Icon = (IoIcons as any)[iconName];
                return Icon ? <Icon size={size} /> : null;
            }
            const Icon = (LucideIcons as any)[iconName];
            return Icon ? <Icon size={size} /> : null;
        } catch (e) {
            return null;
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                {config.title && <h2 className={styles.title}>{config.title}</h2>}
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    if (cards.length === 0) {
        return null;
    }

    const gapValue = config.gap !== undefined ? config.gap : 3;
    const gridGap = gapValue * 0.75;

    const variantName = config.variant || 'default';
    const variantClass = styles[`variant-${variantName}`];

    const gridClass = [
        styles.grid,
        styles[`grid-${config.gridColumns || 3}`],
        styles[`direction-${config.direction || 'vertical'}`],
        variantClass
    ].filter(Boolean).join(' ');

    return (
        <div className={styles.container}>
            {config.title && <h2 className={styles.title}>{config.title}</h2>}
            <div className={gridClass} style={{ gap: `${gridGap}rem` }}>
                {cards.map((card) => (
                    <div key={card._id} className={styles.card}>
                        {/* Visual */}
                        {((config.showImage && card.visualType === 'image') || (config.showIcon && card.visualType === 'icon')) && (
                            <div className={styles.visual}>
                                {card.visualType === 'image' && card.image ? (
                                    <img src={card.image} alt={card.title} className={styles.image} />
                                ) : card.visualType === 'icon' && card.icon ? (
                                    <div className={styles.iconContainer}>
                                        {renderIcon(card.icon, 48)}
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {/* Content */}
                        <div className={styles.content}>
                            {/* Header: Title + Value Display */}
                            <div className={styles.cardHeader}>
                                <h3 className={styles.cardTitle}>{card.title}</h3>
                                {config.showValue && card.valueDisplay && (
                                    <div className={styles.valueDisplay}>
                                        {card.valueDisplay.prefix && <span className={styles.prefix}>{card.valueDisplay.prefix}</span>}
                                        <span className={styles.amount}>{card.valueDisplay.amount}</span>
                                        {card.valueDisplay.postfix && <span className={styles.postfix}>{card.valueDisplay.postfix}</span>}
                                    </div>
                                )}
                            </div>

                            {/* Metadata Row */}
                            {config.showMetadata && card.metadata && card.metadata.length > 0 && (
                                <div className={styles.metadata}>
                                    {card.metadata.map((meta, idx) => (
                                        <div key={idx} className={styles.metaItem}>
                                            {meta.icon && (
                                                <span className={styles.metaIcon}>
                                                    {renderIcon(meta.icon, 14)}
                                                </span>
                                            )}
                                            <span className={styles.metaValue}>{meta.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Excerpt */}
                            {config.showExcerpt && card.excerpt && (
                                <p className={styles.excerpt}>{card.excerpt}</p>
                            )}

                            {/* Tags */}
                            {config.showTags && card.tags && card.tags.length > 0 && (
                                <div className={styles.tags}>
                                    {card.tags.map((tag, idx) => (
                                        <span key={idx} className={styles.tag}>{tag}</span>
                                    ))}
                                </div>
                            )}

                            {/* Buttons */}
                            {config.showButtons && card.buttons && card.buttons.length > 0 && (
                                <div className={styles.buttons}>
                                    {card.buttons.map((button, idx) => (
                                        <a
                                            key={idx}
                                            href={button.url}
                                            className={`${styles.button} ${button.isPrimary ? styles.buttonPrimary : styles.buttonSecondary}`}
                                            target={button.openInNewTab ? '_blank' : undefined}
                                            rel={button.openInNewTab ? 'noopener noreferrer' : undefined}
                                        >
                                            {button.label}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ContentCardGridModule;
