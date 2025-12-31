// CartPage Container - Entry point for Cart Page
// Passes layout data to Template

'use client';

import React from 'react';
import CartTemplate from './Template';
import { Section } from '@/types/layout';

interface CartPageContainerProps {
    initialLayout?: Section[];
}

export default function CartPageContainer({ initialLayout }: CartPageContainerProps) {
    return (
        <CartTemplate
            layout={initialLayout || []}
        />
    );
}
