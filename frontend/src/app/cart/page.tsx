// Cart Page (Server Component)
// Defines the layout for cart and renders the container

import { getServerStore } from "@/lib/api/server-store";
import { getLayoutByType } from "@/lib/api/layouts";
import CartPageContainer from '@/components/templates/core/CartPage/Container';
import { Section } from '@/types/layout';

// Default fallback layout in case backend layout is missing
const fallbackCartLayout: Section[] = [
    {
        id: 'cart-section',
        type: 'container',
        settings: {
            paddingTop: 4,
            paddingBottom: 4
        },
        visibility: {
            desktop: true,
            tablet: true,
            mobile: true
        },
        order: 0,
        modules: [
            {
                id: 'cart-module',
                type: 'cart-details',
                styling: {},
                visibility: {
                    desktop: true,
                    tablet: true,
                    mobile: true
                },
                isPlaceholder: false,
                isRemovable: false,
                order: 0,
                config: {}
            }
        ]
    }
];

export default async function CartPage() {
    const store = await getServerStore();

    let layoutSections = fallbackCartLayout;

    if (store?._id) {
        // We might want to use a specific layout type for cart if 'cart' is not available yet in backend types
        // Assuming 'cart' is or will be a valid layout type
        const layout = await getLayoutByType('cart', store._id);
        if (layout?.sections && layout.sections.length > 0) {
            layoutSections = layout.sections;
        }
    }

    return (
        <CartPageContainer initialLayout={layoutSections} />
    );
}
