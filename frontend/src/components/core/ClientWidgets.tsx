'use client';

import React from 'react';
import AuthModal from '../organisms/AuthModal/AuthModal';
import CompareFloatingWidget from './CompareFloatingWidget';

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
