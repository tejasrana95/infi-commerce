'use client';

import React from 'react';
import * as FaIcons from 'react-icons/fa';

export default function FaIcon({ name, ...props }: { name: string;[key: string]: any }) {
    const Icon = (FaIcons as any)[name];
    if (!Icon) return null;
    return <Icon {...props} />;
}
