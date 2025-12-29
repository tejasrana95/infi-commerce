// Checkout Page (Server Component)
// Defines the layout for checkout and renders the container

import { getServerStore } from "@/lib/api/server-store";
import { getLayoutByType } from "@/lib/api/layouts";
import CheckoutPageContainer from '@/components/templates/core/CheckoutPage/Container';
import { Section } from '@/types/layout';

// Default fallback layout in case backend layout is missing
const fallbackCheckoutLayout: Section[] = [
    {
        id: 'checkout-section',
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
                id: 'checkout-module',
                type: 'checkout-content',
                styling: {},
                visibility: {
                    desktop: true,
                    tablet: true,
                    mobile: true
                },
                isPlaceholder: false,
                isRemovable: false,
                order: 0,
                config: {
                    mode: 'stepper',
                    address: {
                        displayStyle: 'cards',
                        showBillingToggle: true
                    },
                    shipping: {
                        showEstimatedDates: true
                    },
                    payment: {
                        layout: 'list',
                        showIcons: true
                    },
                    summary: {
                        sticky: true,
                        showCoupon: true,
                        showCartItems: true
                    }
                }
            }
        ]
    }
];

export default async function CheckoutPage() {
    const store = await getServerStore();

    let layoutSections = fallbackCheckoutLayout;

    if (store?._id) {
        const layout = await getLayoutByType('checkout', store._id);
        if (layout?.sections && layout.sections.length > 0) {
            layoutSections = layout.sections;
        }
    }

    return (
        <CheckoutPageContainer initialLayout={layoutSections} />
    );
}
