
import React from 'react';
import { Metadata } from 'next';
import AccountPageContainer from '@/components/templates/core/AccountPage/Container';
import { getServerStore } from "@/lib/api/server-store";
import { getLayoutByType } from "@/lib/api/layouts";
import { Section } from '@/types/layout';

export const metadata: Metadata = {
    title: 'Returns & Refunds',
    description: 'Track your return requests.',
};

const fallbackAccountLayout: Section[] = [
    {
        id: 'account-section',
        type: 'container',
        order: 0,
        settings: {
            paddingTop: 32,
            paddingBottom: 32,
        },
        visibility: {
            desktop: true,
            tablet: true,
            mobile: true,
        },
        columns: [
            {
                id: 'sidebar-col',
                width: 3,
                modules: [
                    {
                        id: 'account-sidebar',
                        type: 'account-sidebar',
                        order: 0,
                        isPlaceholder: false,
                        isRemovable: true,
                        config: {},
                        styling: {},
                        visibility: {
                            desktop: true,
                            tablet: true,
                            mobile: false,
                        },
                    },
                ],
            },
            {
                id: 'content-col',
                width: 9,
                modules: [
                    {
                        id: 'account-returns',
                        type: 'account-returns',
                        order: 0,
                        isPlaceholder: false,
                        isRemovable: true,
                        config: {},
                        styling: {},
                        visibility: {
                            desktop: true,
                            tablet: true,
                            mobile: true,
                        },
                    },
                ],
            },
        ],
        modules: [],
    },
];

export default async function ReturnsPage() {
    const store = await getServerStore();
    let layoutSections = fallbackAccountLayout;

    if (store?._id) {
        // Fetch the generic 'account' layout, which contains the 'account-dashboard' (Account Detail) module
        const layout = await getLayoutByType('account', store._id);
        if (layout?.sections && layout.sections.length > 0) {
            layoutSections = layout.sections;
        }
    }

    return <AccountPageContainer initialLayout={layoutSections} />;
}
