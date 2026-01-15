'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

// Dynamically load icon set wrappers to split them into separate chunks
const FaIconSet = dynamic(() => import('./icons/FaIcon'), { ssr: false });
const MdIconSet = dynamic(() => import('./icons/MdIcon'), { ssr: false });
const BiIconSet = dynamic(() => import('./icons/BiIcon'), { ssr: false });
const IoIconSet = dynamic(() => import('./icons/IoIcon'), { ssr: false });

interface DynamicIconProps {
    name: string;
    className?: string;
    size?: number;
    color?: string;
}

export default function DynamicIcon({ name, className, size = 24, color }: DynamicIconProps) {
    if (!name) return null;

    // Normalize name: Some icons might come as LucideGithub or just Github
    // Also remove 'Icon' suffix if it exists (e.g., ArrowDown01Icon -> ArrowDown01)
    let normalizedName = name;
    if (name.startsWith('Lucide')) {
        normalizedName = name.replace('Lucide', '');
    }
    if (normalizedName.endsWith('Icon') && Object.keys(dynamicIconImports).includes(normalizedName.toLowerCase() as any) === false) {
        // Only strip 'Icon' if the version WITH 'Icon' isn't actually a valid key
        // Most Lucide icons don't end in 'Icon', but some might? (unlikely in standard lib)
        const stripped = normalizedName.slice(0, -4);
        if (stripped.length > 0) {
            normalizedName = stripped;
        }
    }

    // 1. Handle Lucide Icons (Granular dynamic loading)
    // Convert PascalCase to kebab-case (e.g., AlertCircle -> alert-circle, ArrowDown01 -> arrow-down-01)
    const lucideName = normalizedName
        .replace(/([a-z])([A-Z0-9])/g, '$1-$2')
        .replace(/([0-9])([a-zA-Z])/g, '$1-$2')
        .toLowerCase() as keyof typeof dynamicIconImports;

    if (dynamicIconImports[lucideName]) {
        const LucideIcon = dynamic(dynamicIconImports[lucideName], {
            loading: () => <div style={{ width: size, height: size }} />,
            ssr: false
        });
        return <LucideIcon className={className} size={size} color={color} />;
    }

    // 2. Handle Material Design (Md)
    if (name.startsWith('Md')) {
        return <MdIconSet name={name} className={className} size={size} style={{ color }} />;
    }

    // 3. Handle Bootstrap/BoxIcons (Bi)
    if (name.startsWith('Bi')) {
        return <BiIconSet name={name} className={className} size={size} style={{ color }} />;
    }

    // 4. Handle Ionicons (Io)
    if (name.startsWith('Io')) {
        return <IoIconSet name={name} className={className} size={size} style={{ color }} />;
    }

    // 5. Handle FontAwesome (Fa)
    if (name.startsWith('Fa')) {
        return <FaIconSet name={name} className={className} size={size} style={{ color }} />;
    }

    // Fallback: Try Fa if no prefix ( legacy behavior )
    const faName = name.startsWith('Fa') ? name : `Fa${name}`;
    return <FaIconSet name={faName} className={className} size={size} style={{ color }} />;
}
