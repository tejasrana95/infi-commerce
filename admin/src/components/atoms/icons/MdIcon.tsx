'use client';

import React from 'react';
import * as MdIcons from 'react-icons/md';

export default function MdIcon({ name, ...props }: { name: string;[key: string]: any }) {
    const Icon = (MdIcons as any)[name];
    if (!Icon) return null;
    return <Icon {...props} />;
}
