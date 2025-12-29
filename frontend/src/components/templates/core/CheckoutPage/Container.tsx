// CheckoutPage Container - Entry point for Checkout Page
// Passes layout data to Template

'use client';

import React from 'react';
import CheckoutTemplate from './Template';
import { Section } from '@/types/layout';

interface CheckoutPageContainerProps {
    initialLayout?: Section[];
}

export default function CheckoutPageContainer({ initialLayout }: CheckoutPageContainerProps) {
    // Logic for loading layout if not provided via props could go here.
    // For now assuming initialLayout is passed from Server Component.

    return (
        <CheckoutTemplate
            layout={initialLayout || []}
        />
    );
}
