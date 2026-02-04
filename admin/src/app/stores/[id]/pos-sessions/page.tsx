'use client';

import { useEffect, useState, useMemo } from 'react';

import { useParams } from 'next/navigation';
import POSSessionsOverview from '@/components/organisms/POSSessionsOverview';

export default function POSSessionsPage() {
    const params = useParams();
    const storeId = params.id as string;

    return <POSSessionsOverview storeId={storeId} />;
}

