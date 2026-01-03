'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const AuthModal = dynamic(() => import('../organisms/AuthModal/AuthModal'), { ssr: false });
const CompareFloatingWidget = dynamic(() => import('./CompareFloatingWidget'), { ssr: false });

interface ClientWidgetsProps {
    showCompare?: boolean;
}

export default function ClientWidgets({ showCompare = true }: ClientWidgetsProps) {
    return (
        <>
            <AuthModal />
            {showCompare && <CompareFloatingWidget />}
        </>
    );
}
