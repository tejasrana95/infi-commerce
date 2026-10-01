'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

import IconSkeleton from './icons/IconSkeleton';

// ---------------------------------------------------------------------------
// Prefix-based icon sets (loaded lazily, one chunk each).
// ---------------------------------------------------------------------------
const FaIconSet = dynamic(() => import('./icons/FaIcon'), { ssr: false });
const MdIconSet = dynamic(() => import('./icons/MdIcon'), { ssr: false });
const BiIconSet = dynamic(() => import('./icons/BiIcon'), { ssr: false });
const IoIconSet = dynamic(() => import('./icons/IoIcon'), { ssr: false });
const AiIconSet = dynamic(() => import('./icons/AiIcon'), { ssr: false });
const BsIconSet = dynamic(() => import('./icons/BsIcon'), { ssr: false });
const HiIconSet = dynamic(() => import('./icons/HiIcon'), { ssr: false });
const RiIconSet = dynamic(() => import('./icons/RiIcon'), { ssr: false });

// ---------------------------------------------------------------------------
// Lucide icon map — LAZY, and this matters a lot.
//
// `lucide-react/dynamicIconImports` is a static map of EVERY lucide icon
// (~3,200 inline SVG paths ≈ 2 MB). Importing it at module scope put all of
// that on the critical path of every page that renders a <DynamicIcon>.
//
// We now fetch it only after mount, so it lands in its own async chunk and is
// never part of the initial/shared bundle.
// ---------------------------------------------------------------------------
type LucideIconModule = { default: React.ComponentType<any> };
type LucideIconMap = Record<string, () => Promise<LucideIconModule>>;

let lucideIconMapPromise: Promise<LucideIconMap> | null = null;

function loadLucideIconMap(): Promise<LucideIconMap> {
    if (!lucideIconMapPromise) {
        lucideIconMapPromise = import('lucide-react/dynamicIconImports').then(
            (mod: any) => (mod.default ?? mod) as LucideIconMap
        );
    }
    return lucideIconMapPromise;
}

interface DynamicIconProps {
    name: string;
    className?: string;
    size?: number;
}

const ICON_ALIASES: Record<string, string> = {
    MdClose: 'X',
    MdCheck: 'Check',
    MdOutlineCookie: 'Cookie',
    MdOutlineSwapHoriz: 'ArrowRightLeft',
    MdOutlineKeyboardReturn: 'Undo2',
    FaStar: 'Star',
    FaArrowRight: 'ArrowRight',
    FaArrowLeft: 'ArrowLeft',
    FaChevronLeft: 'ChevronLeft',
    FaChevronRight: 'ChevronRight',
    FaFacebook: 'Facebook',
    FaFacebookF: 'Facebook',
    FaTwitter: 'Twitter',
    FaInstagram: 'Instagram',
    FaLinkedin: 'Linkedin',
    FaLinkedinIn: 'Linkedin',
    FaYoutube: 'Youtube',
    FaPhone: 'Phone',
    FaPhoneAlt: 'Phone',
    FaEnvelope: 'Mail',
    FaMapMarkerAlt: 'MapPin',
    FaSearch: 'Search',
    FaShoppingCart: 'ShoppingCart',
    FaUser: 'User',
};

/** `LucideGithub` -> `Github`, `ArrowDown01Icon` -> `ArrowDown01` */
function normalizeIconName(name: string): string {
    let normalized = name.startsWith('Lucide') ? name.slice('Lucide'.length) : name;
    if (normalized.endsWith('Icon') && normalized.length > 4) {
        normalized = normalized.slice(0, -4);
    }
    return normalized;
}

/** PascalCase -> kebab-case: `AlertCircle` -> `alert-circle`, `ArrowDown01` -> `arrow-down-01` */
function toKebabCase(name: string): string {
    return name
        .replace(/([a-z])([A-Z0-9])/g, '$1-$2')
        .replace(/([0-9])([a-zA-Z])/g, '$1-$2')
        .toLowerCase();
}

export default function DynamicIcon({ name, className, size = 24 }: DynamicIconProps) {
    const [iconMap, setIconMap] = useState<LucideIconMap | null>(null);

    useEffect(() => {
        let alive = true;
        loadLucideIconMap()
            .then((map) => {
                if (alive) setIconMap(map);
            })
            .catch(() => {
                /* fall back to the prefixed sets */
            });
        return () => {
            alive = false;
        };
    }, []);

    const aliasedName = name ? ICON_ALIASES[name] || name : '';
    const normalizedName = useMemo(() => (aliasedName ? normalizeIconName(aliasedName) : ''), [aliasedName]);
    const lucideName = useMemo(() => (normalizedName ? toKebabCase(normalizedName) : ''), [normalizedName]);

    // Resolve the concrete lucide component once per icon, not per render.
    const LucideIcon = useMemo(() => {
        const importer = iconMap?.[lucideName];
        if (!importer) return null;
        return dynamic(importer, {
            ssr: false,
            loading: () => <IconSkeleton size={size} />,
        });
    }, [iconMap, lucideName, size]);

    const wrap = (node: React.ReactNode) => (
        <span
            className={`inline-flex items-center justify-center empty:animate-pulse empty:bg-current empty:opacity-10 empty:rounded-md ${className || ''}`}
            style={{ width: size, height: size, minWidth: size, minHeight: size }}
        >
            {node}
        </span>
    );

    if (!name) return null;

    // 1. Prefixed icon sets (unambiguous, so resolve them immediately).
    if (normalizedName.startsWith('Md')) return wrap(<MdIconSet name={name} className={className} size={size} />);
    if (normalizedName.startsWith('Bi')) return wrap(<BiIconSet name={name} className={className} size={size} />);
    if (normalizedName.startsWith('Io')) return wrap(<IoIconSet name={name} className={className} size={size} />);
    if (normalizedName.startsWith('Ai')) return wrap(<AiIconSet name={name} className={className} size={size} />);
    if (normalizedName.startsWith('Bs')) return wrap(<BsIconSet name={name} className={className} size={size} />);
    if (normalizedName.startsWith('Hi')) return wrap(<HiIconSet name={name} className={className} size={size} />);
    if (normalizedName.startsWith('Ri')) return wrap(<RiIconSet name={name} className={className} size={size} />);
    if (normalizedName.startsWith('Fa')) return wrap(<FaIconSet name={name} className={className} size={size} />);

    // 2. Lucide (once the name map has arrived).
    if (LucideIcon) return wrap(<LucideIcon className={className} size={size} />);

    // 3. Still waiting for the map — show a sized placeholder instead of
    //    eagerly pulling in a whole FontAwesome set.
    if (!iconMap) return wrap(<IconSkeleton size={size} />);

    // 4. Legacy fallback: assume FontAwesome.
    return wrap(<FaIconSet name={`Fa${name}`} className={className} size={size} />);
}
