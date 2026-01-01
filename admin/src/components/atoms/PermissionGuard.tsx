'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];
    deniedRoles?: string[];
    fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    children,
    allowedRoles,
    deniedRoles,
    fallback = null,
}) => {
    const { user } = useAuth();

    if (!user) return fallback as React.ReactElement | null;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return fallback as React.ReactElement | null;
    }

    if (deniedRoles && deniedRoles.includes(user.role)) {
        return fallback as React.ReactElement | null;
    }

    return <>{children}</>;
};

export default PermissionGuard;
