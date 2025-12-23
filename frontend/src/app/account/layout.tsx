'use client';

import React from 'react';
import Sidebar from '@/components/templates/core/Dashboard/Sidebar/Sidebar';
import ProtectedRoute from '@/components/molecules/ProtectedRoute/ProtectedRoute';
import styles from './layout.module.scss';

export default function AccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <div className={styles.dashboardContainer}>
                <div className={styles.wrapper}>
                    <Sidebar />
                    <main className={styles.content}>
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}

