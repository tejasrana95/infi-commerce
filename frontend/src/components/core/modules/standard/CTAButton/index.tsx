import React from 'react';
import CTAButton from '@/components/molecules/CTAButton';
import { ModuleProps } from '../../index';

const CTAButtonModule: React.FC<ModuleProps> = ({ config }) => {
    return (
        <CTAButton
            text={config.text}
            link={config.link}
            variant={config.variant}
            color={config.color}
            alignment={config.alignment}
            alignmentTablet={config.alignmentTablet}
            alignmentMobile={config.alignmentMobile}
            size={config.size}
            backgroundColor={config.backgroundColor}
            borderColor={config.borderColor}
            textColor={config.textColor}
            showArrow={config.showArrow}
            className={config.className}
        />
    );
};

export default CTAButtonModule;
