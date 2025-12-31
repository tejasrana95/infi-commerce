'use client';

import React from 'react';
import AccountTemplate from './Template';
import { Section } from '@/types/layout';

interface AccountPageContainerProps {
    initialLayout: Section[];
}

const AccountPageContainer: React.FC<AccountPageContainerProps> = ({ initialLayout }) => {
    return <AccountTemplate layout={initialLayout} />;
};

export default AccountPageContainer;
