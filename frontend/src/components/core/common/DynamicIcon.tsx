'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

import IconSkeleton from './icons/IconSkeleton';

// Dynamically load icon set wrappers to split them into separate chunks
const FaIconSet = dynamic(() => import('./icons/FaIcon'), { ssr: false });
const MdIconSet = dynamic(() => import('./icons/MdIcon'), { ssr: false });
const BiIconSet = dynamic(() => import('./icons/BiIcon'), { ssr: false });
const IoIconSet = dynamic(() => import('./icons/IoIcon'), { ssr: false });
const AiIconSet = dynamic(() => import('./icons/AiIcon'), { ssr: false });
const BsIconSet = dynamic(() => import('./icons/BsIcon'), { ssr: false });
const HiIconSet = dynamic(() => import('./icons/HiIcon'), { ssr: false });
const RiIconSet = dynamic(() => import('./icons/RiIcon'), { ssr: false });

interface DynamicIconProps {
    name: string;
    className?: string;
    size?: number;
}

const MATERIAL_ICON_ALIASES: Record<string, string> = {
    MdClose: 'X',
    MdCheck: 'Check',
    MdOutlineCookie: 'Cookie',
    MdOutlineSwapHoriz: 'ArrowRightLeft',
    MdOutlineKeyboardReturn: 'Undo2',
};

export default function DynamicIcon({ name, className, size = 24 }: DynamicIconProps) {
    if (!name) return null;

    const aliasedName = MATERIAL_ICON_ALIASES[name] || name;

    // Normalize name: Some icons might come as LucideGithub or just Github
    // Also remove 'Icon' suffix if it exists (e.g., ArrowDown01Icon -> ArrowDown01)
    let normalizedName = aliasedName;
    if (aliasedName.startsWith('Lucide')) {
        normalizedName = aliasedName.replace('Lucide', '');
    }
    if (normalizedName.endsWith('Icon') && Object.keys(dynamicIconImports).includes(normalizedName.toLowerCase() as any) === false) {
        // Only strip 'Icon' if the version WITH 'Icon' isn't actually a valid key
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

    const getIconComponent = () => {
        if (dynamicIconImports[lucideName]) {
            const LucideIcon = dynamic(dynamicIconImports[lucideName], {
                loading: () => <IconSkeleton size={size} className={className} />,
                ssr: false
            });
            return <LucideIcon className={className} size={size} />;
        }

        // 2. Handle Material Design (Md)
        if (name.startsWith('Md')) {
            return <MdIconSet name={name} className={className} size={size} />;
        }

        // 3. Handle Bootstrap/BoxIcons (Bi)
        if (name.startsWith('Bi')) {
            return <BiIconSet name={name} className={className} size={size} />;
        }

        // 4. Handle Ionicons (Io)
        if (name.startsWith('Io')) {
            return <IoIconSet name={name} className={className} size={size} />;
        }

        // 5. Handle Ant Design (Ai)
        if (name.startsWith('Ai')) {
            return <AiIconSet name={name} className={className} size={size} />;
        }

        // 6. Handle Bootstrap (Bs)
        if (name.startsWith('Bs')) {
            return <BsIconSet name={name} className={className} size={size} />;
        }

        // 7. Handle Heroicons (Hi)
        if (name.startsWith('Hi')) {
            return <HiIconSet name={name} className={className} size={size} />;
        }

        // 8. Handle Remix Icon (Ri)
        if (name.startsWith('Ri')) {
            return <RiIconSet name={name} className={className} size={size} />;
        }

        // 9. Handle FontAwesome (Fa)
        if (name.startsWith('Fa')) {
            return <FaIconSet name={name} className={className} size={size} />;
        }

        // Fallback: Try Fa if no prefix ( legacy behavior )
        const faName = name.startsWith('Fa') ? name : `Fa${name}`;
        return <FaIconSet name={faName} className={className} size={size} />;
    };

    return (
        <span
            className={`inline-flex items-center justify-center empty:animate-pulse empty:bg-current empty:opacity-10 empty:rounded-md ${className || ''}`}
            style={{ width: size, height: size, minWidth: size, minHeight: size }}
        >
            {getIconComponent()}
        </span>
    );
}
