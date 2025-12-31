'use client';

import React from 'react';
import { Section } from '@/types/layout';
import SectionRenderer from '@/components/core/layout/SectionRenderer';
import styles from './AccountPage.module.scss'; // We can reuse CartPage styles or create new ones

interface AccountTemplateProps {
    layout: Section[];
}

const AccountTemplate: React.FC<AccountTemplateProps> = ({ layout }) => {
    return (
        <div className={styles.pageContainer}>
            {layout.map((section) => (
                <SectionRenderer key={section.id} section={section} />
            ))}
        </div>
    );
};

export default AccountTemplate;
