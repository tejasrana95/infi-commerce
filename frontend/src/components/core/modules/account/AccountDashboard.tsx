'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ModuleProps } from '@/components/core/modules';

// Import sub-modules
import AccountOverview from './AccountOverview';
import AccountOrdersModule from './AccountOrders';
import AccountProfileModule from './AccountProfile';
import AccountAddressesModule from './AccountAddresses';

export default function AccountDashboardModule(props: ModuleProps) {
    const pathname = usePathname();

    // Determine content based on pathname
    // We assume the layout with this module is used across all these routes

    if (pathname === '/account/orders' || pathname.startsWith('/account/orders/')) {
        // Pass generic props or specific config if we wanted
        return <AccountOrdersModule {...props} />;
    }

    if (pathname === '/account/profile') {
        return <AccountProfileModule {...props} />;
    }

    if (pathname === '/account/addresses') {
        return <AccountAddressesModule {...props} />;
    }

    // Default to Overview for '/account'
    return <AccountOverview />;
}
