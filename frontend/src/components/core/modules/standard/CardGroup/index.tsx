import React from 'react';
import CardGroup from '@/components/organisms/CardGroup';
import { ModuleProps } from '../../index';

const CardGroupModule: React.FC<ModuleProps> = ({ config }) => {
    return (
        <CardGroup
            title={config.title}
            layout={config.layout}
            columns={config.columns}
            cards={config.cards}
        />
    );
};

export default CardGroupModule;
