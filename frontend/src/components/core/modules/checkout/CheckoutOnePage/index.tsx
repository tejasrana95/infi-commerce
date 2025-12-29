// CheckoutOnePage Module - Accordion/Single Page layout

'use client';

import React, { useState } from 'react';
import { useCheckout } from '../context';
import styles from './CheckoutOnePage.module.scss';

// We accept children as props (slots) but configuration comes from context
export interface CheckoutOnePageProps {
    config?: any;
    // Slots for content
    children?: {
        address?: React.ReactNode;
        shipping?: React.ReactNode;
        payment?: React.ReactNode;
        review?: React.ReactNode;
    };
    // Status to control accordion state (from main content)
    completedSections?: {
        address: boolean;
        shipping: boolean;
        payment: boolean;
    };
}

export default function CheckoutOnePage({ config: propsConfig, children, completedSections }: CheckoutOnePageProps) {
    const {
        config: globalConfig,
        canProceedToStep // We can use this to determine if section is editable/valid
    } = useCheckout();

    const config = propsConfig || globalConfig?.onePage || {};
    const {
        expandedByDefault = 'address',
        showSectionNumbers = true,
        allowMultipleExpanded = false,
    } = config;

    // Use internal state for expansion if not controlled?
    // Actually, in One Page Checkout, typically sections open as you complete previous ones.
    // Let's use internal state initialized with defaults.

    // Initialize expanded sections based on config
    const [expandedSections, setExpandedSections] = useState<number[]>(() => {
        if (expandedByDefault === 'all') return [1, 2, 3, 4];
        if (expandedByDefault === 'none') return [];
        return [1]; // Default to 'address'
    });

    const toggleSection = (step: number) => {
        setExpandedSections(prev => {
            const isExpanded = prev.includes(step);

            // If already expanded, toggle off (unless it's the only one and we generally like to keep one open? No, let user control)
            if (isExpanded) {
                if (allowMultipleExpanded) {
                    return prev.filter(s => s !== step);
                }
                // In single mode, clicking the header of active section usually toggles it off or ignored. 
                // Let's allow toggle off for now.
                return [];
            } else {
                // Expanding
                const canExpand = step === 1 || (completedSections && (
                    (step === 2 && completedSections.address) ||
                    (step === 3 && completedSections.shipping) ||
                    (step === 4 && completedSections.payment)
                ));

                // Strict enforcement:
                // if (!canExpand) return prev; 
                // However, user often wants to go back. 
                // And for forward navigation, we usually block via "Continue" button, not header click.
                // But header click should probably be restricted to accessible steps.

                if (allowMultipleExpanded) {
                    return [...prev, step];
                } else {
                    return [step];
                }
            }
        });
    };

    return (
        <div className={styles.onePageCheckout}>
            {/* Address Section */}
            <div className={`${styles.section} ${expandedSections.includes(1) ? styles.expanded : ''} ${completedSections?.address ? styles.completed : ''}`}>
                <button className={styles.sectionHeader} onClick={() => toggleSection(1)} type="button">
                    <div className={styles.headerLeft}>
                        {showSectionNumbers && <span className={styles.sectionNumber}>1</span>}
                        <h3 className={styles.sectionLabel}>Shipping Address</h3>
                        {completedSections?.address && !expandedSections.includes(1) && <span className={styles.completedIcon}>✓</span>}
                    </div>
                    <svg
                        className={`${styles.chevron} ${expandedSections.includes(1) ? styles.rotated : ''}`}
                        width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <div className={styles.sectionContent}>
                    <div className={styles.contentInner}>
                        {children?.address}
                        {expandedSections.includes(1) && (
                            <div className={styles.sectionActions}>
                                <button
                                    className={styles.continueBtn}
                                    onClick={() => toggleSection(2)}
                                // disabled={!completedSections?.address} // Optional: strictly enforce
                                >
                                    Continue to Shipping
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Shipping Section */}
            <div className={`${styles.section} ${expandedSections.includes(2) ? styles.expanded : ''} ${completedSections?.shipping ? styles.completed : ''}`}>
                <button className={styles.sectionHeader} onClick={() => toggleSection(2)} type="button">
                    <div className={styles.headerLeft}>
                        {showSectionNumbers && <span className={styles.sectionNumber}>2</span>}
                        <h3 className={styles.sectionLabel}>Shipping Method</h3>
                        {completedSections?.shipping && !expandedSections.includes(2) && <span className={styles.completedIcon}>✓</span>}
                    </div>
                    <svg
                        className={`${styles.chevron} ${expandedSections.includes(2) ? styles.rotated : ''}`}
                        width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <div className={styles.sectionContent}>
                    <div className={styles.contentInner}>
                        {children?.shipping}
                        {expandedSections.includes(2) && (
                            <div className={styles.sectionActions}>
                                <button
                                    className={styles.continueBtn}
                                    onClick={() => toggleSection(3)}
                                >
                                    Continue to Payment
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Section */}
            <div className={`${styles.section} ${expandedSections.includes(3) ? styles.expanded : ''} ${completedSections?.payment ? styles.completed : ''}`}>
                <button className={styles.sectionHeader} onClick={() => toggleSection(3)} type="button">
                    <div className={styles.headerLeft}>
                        {showSectionNumbers && <span className={styles.sectionNumber}>3</span>}
                        <h3 className={styles.sectionLabel}>Payment</h3>
                        {completedSections?.payment && !expandedSections.includes(3) && <span className={styles.completedIcon}>✓</span>}
                    </div>
                    <svg
                        className={`${styles.chevron} ${expandedSections.includes(3) ? styles.rotated : ''}`}
                        width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <div className={styles.sectionContent}>
                    <div className={styles.contentInner}>
                        {children?.payment}
                        {expandedSections.includes(3) && (
                            <div className={styles.sectionActions}>
                                <button
                                    className={styles.continueBtn}
                                    onClick={() => toggleSection(4)}
                                >
                                    Review Order
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Review Section */}
            <div className={`${styles.section} ${expandedSections.includes(4) ? styles.expanded : ''}`}>
                <button className={styles.sectionHeader} onClick={() => toggleSection(4)} type="button">
                    <div className={styles.headerLeft}>
                        {showSectionNumbers && <span className={styles.sectionNumber}>4</span>}
                        <h3 className={styles.sectionLabel}>Review & Place Order</h3>
                    </div>
                    <svg
                        className={`${styles.chevron} ${expandedSections.includes(4) ? styles.rotated : ''}`}
                        width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <div className={styles.sectionContent}>
                    <div className={styles.contentInner}>
                        {children?.review}
                        {expandedSections.includes(4) && (
                            <div className={styles.sectionActions}>
                                <PlaceOrderButtonWrapper />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PlaceOrderButtonWrapper() {
    const { handlePlaceOrder, submitting } = useCheckout();
    return (
        <button
            className={styles.placeOrderBtn}
            onClick={handlePlaceOrder}
            disabled={submitting}
        >
            {submitting ? 'Placing Order...' : 'Place Order'}
        </button>
    );
}
