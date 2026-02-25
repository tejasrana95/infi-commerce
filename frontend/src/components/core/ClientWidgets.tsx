'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import ScrollToTop from './ScrollToTop';

// Lazy-load heavy modal/widget components — not needed for initial render
const AuthModal = dynamic(() => import('../organisms/AuthModal/AuthModal'), {
    ssr: false,
});
const CompareFloatingWidget = dynamic(() => import('./CompareFloatingWidget'), {
    ssr: false,
});

interface ClientWidgetsProps {
    showCompare?: boolean;
}

export default function ClientWidgets({ showCompare = true }: ClientWidgetsProps) {
    return (
        <>
            <AuthModal />
            {showCompare && <CompareFloatingWidget />}
            <ScrollToTop />
        </>
    );
}
