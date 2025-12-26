import React from 'react';
import StripBanner from '@/components/organisms/StripBanner';
import { ModuleProps } from '../../index';

const StripBannerModule: React.FC<ModuleProps> = ({ config }) => {
    return (
        <StripBanner
            content={config.content}
            backgroundImage={config.backgroundImage}
            backgroundColor={config.backgroundColor}
            textColor={config.textColor}
            ctaText={config.ctaText}
            ctaLink={config.ctaLink}
            ctaPosition={config.ctaPosition}
            height={config.height}
            overlayColor={config.overlayColor}
            overlayOpacity={config.overlayOpacity}
            ctaBackgroundColor={config.ctaBackgroundColor}
            ctaTextColor={config.ctaTextColor}
        />
    );
};

export default StripBannerModule;
