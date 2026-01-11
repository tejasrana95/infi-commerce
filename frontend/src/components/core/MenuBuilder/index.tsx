// Core MenuBuilder Component
// Fetches menu by ID and renders based on settings.style (horizontal, vertical, mega, flyout, accordion)
// Can be reused across all templates

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
    initialData?: Menu; // Optional - for backwards compatibility
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

export default function MenuBuilder({
    menuId,
    initialData,
    className = '',
    themeColors,
    onItemClick,
}: MenuBuilderProps) {
    // Get menus from StoreProvider context
    const { menus } = useStore();

    // Use menu from context or fallback to initialData prop
    const menu = menus?.[menuId] || initialData;

    // Don't render if no menu data, menu is inactive, or empty
    if (!menu || !menu.isActive || !menu.items || menu.items.length === 0) {
        return null;
    }

    // Select the appropriate renderer based on menu style
    const renderMenu = () => {
        const commonProps = {
            items: menu.items,
            className,
            themeColors,
            settings: menu.settings,
            onItemClick,
        };

        switch (menu.settings.style) {
            case 'horizontal':
                return <HorizontalMenu {...commonProps} />;

            case 'vertical':
                return <VerticalMenu {...commonProps} />;

            case 'mega':
                return <MegaMenu {...commonProps} />;

            case 'flyout':
                return <FlyoutMenu {...commonProps} />;

            case 'accordion':
                return <AccordionMenu {...commonProps} />;

            default:
                return <HorizontalMenu {...commonProps} />;
        }
    };

    // Dynamic visibility logic based on breakpoint
    const breakpoint = menu.settings.mobileBreakpoint || 0;
    const isMobileLocation = menu.location === 'mobile';
    const menuUniqueId = `menu-${menu._id}`;

    const visibilityStyles = breakpoint > 0 ? (
        <style>{`
            @media (${isMobileLocation ? 'min-width' : 'max-width'}: ${isMobileLocation ? breakpoint + 1 : breakpoint - 1}px) {
                .${menuUniqueId} { 
                    display: none !important; 
                }
            }
        `}</style>
    ) : null;

    return (
        <div className={`menu-builder menu-location-${menu.location} ${menuUniqueId}`}>
            {visibilityStyles}
            {renderMenu()}
        </div>
    );
}
