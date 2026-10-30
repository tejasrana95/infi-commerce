'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import dynamic from 'next/dynamic';

const FaIconSet = dynamic(() => import('./icons/FaIcon'), { ssr: false });

interface DynamicIconProps {
    name: string;
    className?: string;
    size?: number;
    color?: string;
}

const ICON_ALIASES: Record<string, string> = {
    // Material Design aliases
    MdClose: 'X',
    MdCheck: 'Check',
    MdOutlineCookie: 'Cookie',
    MdOutlineSwapHoriz: 'ArrowRightLeft',
    MdOutlineKeyboardReturn: 'Undo2',
    MdOutlineAddShoppingCart: 'ShoppingCart',
    MdShoppingCartCheckout: 'ShoppingBag',
    MdPhotoSizeSelectSmall: 'Maximize',

    // BoxIcons aliases
    BiCheckShield: 'ShieldCheck',
    BiSupport: 'Headset',

    // FontAwesome aliases
    FaShippingFast: 'Truck',
    FaTools: 'Wrench',
    FaHeadset: 'Headset',
    FaRegStar: 'Star',
    FaRegHeart: 'Heart',
    FaEnvelope: 'Mail',
    FaMapMarkerAlt: 'MapPin',
    FaShieldAlt: 'Shield',
    FaPhoneAlt: 'Phone',
};

/** Normalize icon name to PascalCase for Lucide matching */
function normalizeIconName(raw: string): string {
    let name = raw.trim();
    if (name.startsWith('Lucide')) {
        name = name.slice(6);
    }
    if (name.endsWith('Icon') && name.length > 4) {
        name = name.slice(0, -4);
    }
    return name;
}

export default function DynamicIcon({ name, className, size = 24, color }: DynamicIconProps) {
    if (!name) return null;

    // 1. Check direct aliases first
    const aliased = ICON_ALIASES[name] || name;
    const normalized = normalizeIconName(aliased);

    // 2. Try Lucide icon directly with exact name (e.g. "Truck", "Star", "PackageCheck")
    const LucideDirect = (LucideIcons as any)[normalized];
    if (LucideDirect) {
        const Component = LucideDirect;
        return (
            <span
                className={`inline-flex items-center justify-center ${className || ''}`}
                style={{ width: size, height: size, minWidth: size, minHeight: size }}
            >
                <Component size={size} color={color} />
            </span>
        );
    }

    // 3. If prefixed with "Fa", strip "Fa" and check if Lucide has it (e.g. "FaTruck" -> "Truck", "FaHeart" -> "Heart")
    if (normalized.startsWith('Fa') && normalized.length > 2) {
        const strippedFa = normalized.slice(2);
        const LucideStripped = (LucideIcons as any)[strippedFa];
        if (LucideStripped) {
            const Component = LucideStripped;
            return (
                <span
                    className={`inline-flex items-center justify-center ${className || ''}`}
                    style={{ width: size, height: size, minWidth: size, minHeight: size }}
                >
                    <Component size={size} color={color} />
                </span>
            );
        }
    }

    // 4. Last-resort fallback: Use curated tree-shaked FontAwesome set (e.g. WhatsApp, Telegram, PayPal, etc.)
    const faName = normalized.startsWith('Fa') ? normalized : `Fa${normalized}`;
    return (
        <span
            className={`inline-flex items-center justify-center ${className || ''}`}
            style={{ width: size, height: size, minWidth: size, minHeight: size }}
        >
            <FaIconSet name={faName} className={className} size={size} style={{ color }} />
        </span>
    );
}
