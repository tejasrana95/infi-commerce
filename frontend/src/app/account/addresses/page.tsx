
import React from 'react';
import { Metadata } from 'next';
import AccountPageContainer from '@/components/templates/core/AccountPage/Container';
import { getServerStore } from "@/lib/api/server-store";
import { getLayoutByType } from "@/lib/api/layouts";
import { Section } from '@/types/layout';

export const metadata: Metadata = {
    title: 'My Addresses',
    description: 'Manage your shipping addresses.',
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
                        id: 'account-detail',
                        type: 'account-addresses',
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

export default async function AddressesPage() {
    const store = await getServerStore();
    let layoutSections = fallbackAccountLayout;

    if (store?._id) {
        const layout = await getLayoutByType('account', store._id);
        if (layout?.sections && layout.sections.length > 0) {
            layoutSections = layout.sections;
        }
    }

    return <AccountPageContainer initialLayout={layoutSections} />;
}
