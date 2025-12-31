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
            {children}
        </ProtectedRoute>
    );
}

