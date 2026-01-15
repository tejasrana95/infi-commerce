'use client';

import React from 'react';
import * as IoIcons from 'react-icons/io5';

export default function IoIcon({ name, ...props }: { name: string;[key: string]: any }) {
    const Icon = (IoIcons as any)[name];
    if (!Icon) return null;
    return <Icon {...props} />;
}
