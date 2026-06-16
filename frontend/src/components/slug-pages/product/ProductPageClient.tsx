'use client';

// ProductPage Client Component - Handles client-side interactivity
// Wraps the ProductPage container from the template system

import { useEffect } from 'react';
import { getComponent } from '@/components/templates/registry';
import { useStore } from '@/providers/StoreProvider';
import { useInterest } from '@/providers/InterestProvider';

interface ProductPageClientProps {
    product: any;
    layout?: any;
    initialReviews?: any;
}

export default function ProductPageClient({ product, layout, initialReviews }: ProductPageClientProps) {
    const { store } = useStore();
    const { trackProductView } = useInterest();
    const templateId = store?.theme?.templateId || 'modern-clean';

    // Track product view for personalized recommendations
    useEffect(() => {
        if (product?._id) {
            const categoryIds = product.categoryIds?.map((c: any) => c._id || c) || [];
            const tags = product.tags || [];
            trackProductView(product._id, categoryIds, tags);
        }
    }, [product?._id, product?.categoryIds, product?.tags, trackProductView]);

    // Get the ProductPage container component
    const ProductPage = getComponent('ProductPage', templateId);

    return <ProductPage product={product} layout={layout} initialReviews={initialReviews} />;
}

