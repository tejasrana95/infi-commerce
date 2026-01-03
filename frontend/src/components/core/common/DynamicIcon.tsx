'use client';

import React from 'react';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import * as BiIcons from 'react-icons/bi';
import * as IoIcons from 'react-icons/io5';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
    name: string;
    className?: string;
    size?: number;
}

export default function DynamicIcon({ name, className, size = 24 }: DynamicIconProps) {
    if (!name) return null;

    // 1. Check for Lucide
    // Lucide Icons are exported as individual components.
    // Lucide renamed 'icons' to PascalCase in some versions, but standard export works.
    const LucideIcon = (LucideIcons as any)[name];
    if (LucideIcon) {
        return <LucideIcon className={className} size={size} />;
    }

    // 3. Check for Material Design (Md)
    if (name.startsWith('Md')) {
        const MdIcon = (MdIcons as any)[name];
        if (MdIcon) return <MdIcon className={className} size={size} />;
    }

    // 4. Check for Bootstrap (Bi)
    if (name.startsWith('Bi')) {
        const BiIcon = (BiIcons as any)[name];
        if (BiIcon) return <BiIcon className={className} size={size} />;
    }

    // 5. Check for Ionicons (Io)
    if (name.startsWith('Io')) {
        const IoIcon = (IoIcons as any)[name];
        if (IoIcon) return <IoIcon className={className} size={size} />;
    }

    // 2. Check for FontAwesome (Fa)
    if (name.startsWith('Fa')) {
        const FaIcon = (FaIcons as any)[name];
        if (FaIcon) return <FaIcon className={className} size={size} />;
    }

    // Try prepending 'Fa' as a fallback if no prefix
    const faName = `Fa${name}`;
    const FaIconFallback = (FaIcons as any)[faName];
    if (FaIconFallback) {
        return <FaIconFallback className={className} size={size} />;
    }

    // Fallback or warning
    if (process.env.NODE_ENV === 'development') {
        console.warn(`Icon "${name}" not found in any supported icon sets.`);
    }

    return null;
}
