import React from 'react';
import styles from './ProgressBar.module.scss';

interface ProgressBarProps {
    currentStep: number;
    steps?: string[]; // optional custom step labels
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, steps = ['Address', 'Shipping', 'Payment', 'Review'] }) => {
    return (
        <div className={styles.progressBar}>
            {steps.map((label, index) => {
                const stepNumber = index + 1;
                const isActive = currentStep >= stepNumber;
                const isCompleted = currentStep > stepNumber;
                return (
                    <React.Fragment key={label}>
                        <div className={`${styles.step} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}>
                            <div className={styles.stepNumber}>{stepNumber}</div>
                            <div className={styles.stepLabel}>{label}</div>
                        </div>
                        {index < steps.length - 1 && <div className={styles.stepLine} />}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
