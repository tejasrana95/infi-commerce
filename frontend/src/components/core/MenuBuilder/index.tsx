// Core MenuBuilder Component
// Fetches menu by ID and renders based on settings.style (horizontal, vertical, mega, flyout, accordion)
// Can be reused across all templates

'use client';

import React from 'react';
import useSWR from 'swr';
import { Menu } from '@/types/menu';
import api from '@/lib/api';
import HorizontalMenu from './renderers/HorizontalMenu';
import VerticalMenu from './renderers/VerticalMenu';
import MegaMenu from './renderers/MegaMenu';
import FlyoutMenu from './renderers/FlyoutMenu';
import AccordionMenu from './renderers/AccordionMenu';


interface MenuBuilderProps {
    menuId: string;
    initialData?: Menu; // New prop for SSR data
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
    // Use SWR for data fetching with automatic caching and revalidation
    // If initialData is provided, it acts as the fallback data
    const { data, error, isLoading } = useSWR<{ menu: Menu }>(
        menuId ? `menus/${menuId}` : null,
        (url: string) => api.get<{ menu: Menu }>(url),
        {
            fallbackData: initialData ? { menu: initialData } : undefined,
            revalidateOnMount: !initialData,
            revalidateIfStale: !initialData,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    );

    const menu = data?.menu;

    // Don't render if loading (and no data), error, or menu is inactive/empty
    if (isLoading && !menu) return null;
    if (error || !menu) return null;
    if (!menu.isActive || !menu.items || menu.items.length === 0) {
        return null; // Empty menu
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
