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
    const { exchangeConditions = [], processSteps = [], returnConditions = [] } = (store as any)?.returnSettings || {};
    const returnInfo = { ...defaultReturnExchangeInfo, ...info };

    const hasReturnPolicy = returnInfo?.returnWindow !== undefined && returnInfo?.returnWindow > 0;
    const hasExchangePolicy = returnInfo?.exchangeWindow !== undefined && returnInfo?.exchangeWindow > 0;

    if (!hasReturnPolicy && !hasExchangePolicy) return null;

    return (
        <div className={styles.container}>
            {/* Minimal Service Row */}
            <div className={styles.serviceRow}>
                {hasReturnPolicy && (
                    <div
                        className={styles.serviceItem}
                        onClick={() => setShowDetails(!showDetails)}
                        role="button"
                        tabIndex={0}
                    >
                        <div className={styles.iconWrapper}>
                            <DynamicIcon name="MdOutlineKeyboardReturn" size={20} />
                        </div>
                        <span className={styles.label}>
                            {returnInfo.returnWindow} Days Returnable
                        </span>
                    </div>
                )}

                {hasExchangePolicy && (
                    <div
                        className={styles.serviceItem}
                        onClick={() => setShowDetails(!showDetails)}
                        role="button"
                        tabIndex={0}
                    >
                        <div className={styles.iconWrapper}>
                            <DynamicIcon name="MdOutlineSwapHoriz" size={20} />
                        </div>
                        <span className={styles.label}>
                            Exchange Available
                        </span>
                    </div>
                )}
            </div>

            {/* Detailed Information (Expandable) */}
            {showDetails && (
                <div className={styles.detailsContainer}>
                    <div className="flex justify-end">
                        <button
                            className={styles.closeDetails}
                            onClick={() => setShowDetails(false)}
                        >
                            Close Details <DynamicIcon name="MdClose" size={14} />
                        </button>
                    </div>
                    {/* Return Conditions */}
                    <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>
                            Return Policy
                        </h4>
                        <ul className={styles.conditionsList}>
                            {returnConditions?.length > 0 ? returnConditions.map((condition: string, idx: number) => (
                                <li key={idx}>
                                    <DynamicIcon name="MdCheck" size={14} />
                                    {condition}
                                </li>
                            )) : (
                                <li>
                                    <DynamicIcon name="MdCheck" size={14} />
                                    Items must be returned within {returnInfo.returnWindow} days
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Exchange Conditions */}
                    {hasExchangePolicy && (
                        <div className={styles.section}>
                            <h4 className={styles.sectionTitle}>
                                Exchange Policy
                            </h4>
                            <ul className={styles.conditionsList}>
                                {exchangeConditions?.length > 0 ? exchangeConditions.map((condition: string, idx: number) => (
                                    <li key={idx}>
                                        <DynamicIcon name="MdCheck" size={14} />
                                        {condition}
                                    </li>
                                )) : (
                                    <li>
                                        <DynamicIcon name="MdCheck" size={14} />
                                        Free exchange for size or color issues
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Process Steps */}
                    {processSteps?.length > 0 && (
                        <div className={styles.section}>
                            <h4 className={styles.sectionTitle}>
                                How It Works
                            </h4>
                            <div className={styles.steps}>
                                {processSteps.map((step: { label?: string; description?: string }, idx: number) => (
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
                    )}

                    {/* Additional Description */}
                    {returnInfo.description && (
                        <div className={styles.description}>
                            {returnInfo.description}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
