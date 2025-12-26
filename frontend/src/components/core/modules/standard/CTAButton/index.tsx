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
            size={config.size}
            className={config.className}
        />
    );
};

export default CTAButtonModule;
