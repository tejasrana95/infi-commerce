
import React from 'react';
import { Metadata } from 'next';
import AccountPageContainer from '@/components/templates/core/AccountPage/Container';
import { Section } from '@/types/layout';

export const metadata: Metadata = {
    title: 'Return Details',
    description: 'View details of your return request.',
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
                        id: 'account-return-details',
                        type: 'account-return-details',
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

export default async function ReturnDetailsPage() {
    return <AccountPageContainer initialLayout={fallbackAccountLayout} />;
}
