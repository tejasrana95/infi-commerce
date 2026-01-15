'use client';

import React from 'react';
import * as BiIcons from 'react-icons/bi';

export default function BiIcon({ name, ...props }: { name: string;[key: string]: any }) {
    const Icon = (BiIcons as any)[name];
    if (!Icon) return null;
    return <Icon {...props} />;
}
