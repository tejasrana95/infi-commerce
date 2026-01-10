import React from 'react';
import StripBanner from '@/components/organisms/StripBanner';
import { ModuleProps } from '../../index';

const StripBannerModule: React.FC<ModuleProps> = ({ config }) => {
    return (
        <StripBanner
            {...config}
        />
    );
};

export default StripBannerModule;
