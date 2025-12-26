// Search Page - Server Component with SSR layout fetching

import { Metadata } from 'next';
import SearchPageClient from './SearchPageClient';
import { getServerStore, fetchLayout } from '@/lib/api/server-store';

export const metadata: Metadata = {
    title: 'Search Products',
    description: 'Search our catalog of products',
};

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const store = await getServerStore();

    // Fetch search layout from API
    let layout = null;
    if (store?._id) {
        layout = await fetchLayout(store._id, 'search');
    }

    return <SearchPageClient initialLayout={layout} />;
}
