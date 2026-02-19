'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import ClientWidgets from './ClientWidgets';

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
    return (
        <>
            <ClientWidgets showCompare={showCompare} />
            <AIAssistant />
        </>
    );
}
