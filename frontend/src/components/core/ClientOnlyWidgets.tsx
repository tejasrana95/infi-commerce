'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ClientWidgets from './ClientWidgets';

// Lazy-load AIAssistant — only downloaded when user opens the chat widget
const AIAssistant = dynamic(() => import('./AIAssistant/AIAssistant'), {
    ssr: false,
});

interface ClientOnlyWidgetsProps {
    showCompare?: boolean;
}

/**
 * Wrapper component for client-side interactive widgets.
 * These components are SSR'd for SEO content (FAQ, contact info, etc.)
 * but require client-side JavaScript for interactivity.
 */
export default function ClientOnlyWidgets({ showCompare = true }: ClientOnlyWidgetsProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <>
            <ClientWidgets showCompare={showCompare} />
            {isMounted && <AIAssistant />}
        </>
    );
}
