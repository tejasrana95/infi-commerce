// CheckoutProgress Module - Horizontal stepper showing checkout steps

'use client';

import React from 'react';
import styles from './CheckoutProgress.module.scss';

interface CheckoutProgressProps {
    config: {
        style?: 'numbered' | 'icons';
        showLabels?: boolean;
        steps?: string[];
    };
    currentStep: number;
    onStepClick?: (step: number) => void;
    canGoToStep?: (step: number) => boolean;
}

export default function CheckoutProgress({
    config,
    currentStep,
    onStepClick,
    canGoToStep = () => true,
}: CheckoutProgressProps) {
    const {
        style = 'numbered',
        showLabels = true,
        steps = ['Address', 'Shipping', 'Payment', 'Review'],
    } = config || {};

    const handleStepClick = (stepNum: number) => {
        if (canGoToStep(stepNum) && onStepClick) {
            onStepClick(stepNum);
        }
    };

    return (
        <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
                {steps.map((step, index) => {
                    const stepNum = index + 1;
                    const isActive = currentStep === stepNum;
                    const isCompleted = currentStep > stepNum;
                    const isClickable = canGoToStep(stepNum);

                    return (
                        <React.Fragment key={step}>
                            <div
                                className={`
                                    ${styles.step}
                                    ${isActive ? styles.active : ''}
                                    ${isCompleted ? styles.completed : ''}
                                    ${isClickable ? styles.clickable : ''}
                                `}
                                onClick={() => handleStepClick(stepNum)}
                                role="button"
                                tabIndex={isClickable ? 0 : -1}
                                aria-current={isActive ? 'step' : undefined}
                            >
                                <div className={styles.stepCircle}>
                                    {isCompleted ? (
                                        <svg
                                            className={styles.checkIcon}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : style === 'numbered' ? (
                                        stepNum
                                    ) : (
                                        <StepIcon step={step} />
                                    )}
                                </div>
                                {showLabels && (
                                    <span className={styles.stepLabel}>{step}</span>
                                )}
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`
                                        ${styles.connector}
                                        ${isCompleted ? styles.completed : ''}
                                        ${showLabels ? styles.showLabels : ''}
                                    `}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}

// Helper component for step icons
function StepIcon({ step }: { step: string }) {
    const iconMap: Record<string, React.ReactNode> = {
        Address: (
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
        ),
        Shipping: (
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
            </svg>
        ),
        Payment: (
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
            </svg>
        ),
        Review: (
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
        ),
    };

    return <>{iconMap[step] || step}</>;
}
