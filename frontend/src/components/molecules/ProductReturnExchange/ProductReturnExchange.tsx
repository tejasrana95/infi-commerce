'use client';

import React, { useState } from 'react';
import styles from './ProductReturnExchange.module.scss';
import DynamicIcon from '@/components/core/common/DynamicIcon';
import { useStore } from '@/providers/StoreProvider';
interface ReturnExchangeInfo {
    returnWindow?: number; // in days
    exchangeWindow?: number; // in days
    freeReturns?: boolean;
    freeExchanges?: boolean;
    returnShippingCost?: number;
    exchangeShippingCost?: number;
    returnConditions?: string[];
    exchangeConditions?: string[];
    restockingFee?: number; // percentage
    description?: string;
}

interface ProductReturnExchangeProps {
    info: ReturnExchangeInfo;
}

const defaultReturnExchangeInfo: ReturnExchangeInfo = {
    returnWindow: 7,
    exchangeWindow: 7,
    freeReturns: true,
    freeExchanges: true,
};

export default function ProductReturnExchange({ 
    info = defaultReturnExchangeInfo,
}: ProductReturnExchangeProps) {
    const [showDetails, setShowDetails] = useState(false);
    const { store } = useStore();
    const { exchangeConditions = [], processSteps = [], returnConditions = []} = store?.settings?.returnSettings || {};
    const returnInfo = { ...defaultReturnExchangeInfo, ...info };

    const getReturnWindowText = () => {
        if (!returnInfo.returnWindow) return 'Check return policy';
        return `${returnInfo.returnWindow}-day returns`;
    };

    const getExchangeWindowText = () => {
        if (!returnInfo.exchangeWindow) return 'Check exchange policy';
        return `${returnInfo.exchangeWindow}-day exchanges`;
    };

    return (
        <div className={styles.container}>
            {/* Quick Info Cards */}
            <div className={styles.quickInfo}>
                {/* Returns Card */}
                <div className={styles.infoCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.iconWrapper}>
                            <DynamicIcon name="MdOutlineKeyboardReturn" size={24} />
                        </div>
                        <div className={styles.cardContent}>
                            <h3 className={styles.cardTitle}>{getReturnWindowText()}</h3>
                            <span className={styles.badge}>Free Returns</span>
                        </div>
                    </div>
                </div>

                {/* Exchanges Card */}
                <div className={styles.infoCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.iconWrapper}>
                             <DynamicIcon name="MdOutlineSwapHoriz" size={24} />
                        </div>
                        <div className={styles.cardContent}>
                            <h3 className={styles.cardTitle}>{getExchangeWindowText()}</h3>
                            <span className={styles.badge}>Free Exchanges</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Toggle */}
            <button
                className={styles.toggleBtn}
                onClick={() => setShowDetails(!showDetails)}
            >
                <span>{showDetails ? 'Hide' : 'View'} Return & Exchange Details</span>
                <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth={2}
                    className={showDetails ? styles.iconOpen : ''}
                >
                    <path d="M19 14l-7-7-7 7" />
                </svg>
            </button>

            {/* Detailed Information */}
            {showDetails && (
                <div className={styles.details}>
                    {/* Return Conditions */}
                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>
                            <span className={styles.sectionIcon}><DynamicIcon name="MdOutlineKeyboardReturn" size={24} /></span>
                            Return Requirements
                        </h4>
                        <ul className={styles.conditionsList}>
                            {returnConditions?.map((condition, idx) => (
                                <li key={idx}>
                                    <span className={styles.checkmark}><DynamicIcon name="MdCheck" size={12} /></span>
                                    {condition}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Exchange Conditions */}
                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>
                            <span className={styles.sectionIcon}><DynamicIcon name="MdOutlineSwapHoriz" size={24} /></span>
                            Exchange Process
                        </h4>
                        <ul className={styles.conditionsList}>
                            {exchangeConditions?.map((condition, idx) => (
                                <li key={idx}>
                                    <span className={styles.checkmark}><DynamicIcon name="MdCheck" size={12} /></span>
                                    {condition}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Process Steps */}
                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>
                            <span className={styles.sectionIcon}><DynamicIcon name="MdOutlineListAlt" size={24} /></span>
                            How It Works
                        </h4>
                        <div className={styles.steps}>
                            {processSteps?.map((step, idx) => (
                            <div key={idx} className={styles.step}>
                                <div className={styles.stepNumber}>{idx + 1}</div>
                                <div className={styles.stepContent}>
                                    <strong>{step.label}</strong>
                                    {step.description && <p>{step.description}</p>}
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>

                    {/* Info Text */}
                    {returnInfo.description && (
                        <div className={styles.description}>
                            <p>{returnInfo.description}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
