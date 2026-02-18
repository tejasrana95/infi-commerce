// MenuBuilder — Rewritten
// Selects renderer based on menu settings.style

'use client';

import React from 'react';
import { Menu } from '@/types/menu';
import { useStore } from '@/providers/StoreProvider';
import HorizontalMenu from './renderers/HorizontalMenu';
import VerticalMenu from './renderers/VerticalMenu';
import MegaMenu from './renderers/MegaMenu';
import FlyoutMenu from './renderers/FlyoutMenu';
import AccordionMenu from './renderers/AccordionMenu';

interface MenuBuilderProps {
    menuId: string;
    initialData?: Menu;
    className?: string;
    themeColors?: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
    };
    onItemClick?: (item: any) => void;
}

const RENDERERS = {
    horizontal: HorizontalMenu,
    vertical: VerticalMenu,
    mega: MegaMenu,
    flyout: FlyoutMenu,
    accordion: AccordionMenu,
} as const;

export default function MenuBuilder({
    menuId,
    initialData,
    className = '',
    themeColors,
    onItemClick,
}: MenuBuilderProps) {
    const { menus } = useStore();
    const menu = menus?.[menuId] || initialData;

    if (!menu?.isActive || !menu.items?.length) return null;

    const Renderer = RENDERERS[menu.settings.style] || HorizontalMenu;

    const breakpoint = menu.settings.mobileBreakpoint || 0;
    const isMobileLocation = menu.location === 'mobile';
    const uid = `menu-${menu._id}`;

    return (
        <div className={`menu-builder menu-location-${menu.location} ${uid}`}>
            {breakpoint > 0 && (
                <style>{`
                    @media (${isMobileLocation ? 'min-width' : 'max-width'}: ${isMobileLocation ? breakpoint + 1 : breakpoint - 1}px) {
                        .${uid} { display: none !important; }
                    }
                `}</style>
            )}
            <Renderer
                items={menu.items}
                className={className}
                themeColors={themeColors}
                settings={menu.settings}
                onItemClick={onItemClick}
            />
        </div>
    );
}
