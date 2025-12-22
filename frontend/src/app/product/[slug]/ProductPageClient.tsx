'use client';

// ProductPage Client Component - Handles client-side interactivity
// Wraps the ProductPage container from the template system

import { getComponent } from '@/components/templates/registry';
import { useStore } from '@/providers/StoreProvider';

interface ProductPageClientProps {
    product: any;
    layout?: any;
}

export default function ProductPageClient({ product, layout }: ProductPageClientProps) {
    const { store } = useStore();
    const templateId = store?.theme?.templateId || 'modern-clean';

    // Get the ProductPage container component
    const ProductPage = getComponent('ProductPage', templateId);

    return <ProductPage product={product} layout={layout} />;
}
