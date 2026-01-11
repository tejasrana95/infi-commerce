// Core Header Container - Processes API config into template-ready props
// Server Component for SSR

import { HeaderConfig, Store, HeaderSection, HeaderElement } from '@/types';
import { Menu } from '@/types/menu';
import { getComponent } from '@/components/templates/registry';
import ClientHeaderWrapper from './ClientWrapper';
import api from '@/lib/api';
import {
    HeaderTemplateProps,
    NavLink,
    SocialLink,
    DEFAULT_NAV_LINKS,
    DEFAULT_SECONDARY_LINKS,
    DEFAULT_LABELS,
} from './types';

interface HeaderContainerProps {
    config?: HeaderConfig;
    store?: Store | null;
    templateId?: string;
}

// Fetch menu by ID
async function fetchMenuById(menuId: string): Promise<Menu | null> {
    try {
        const data = await api.get<{ menu: Menu }>(`menus/${menuId}`);
        return data.menu;
    } catch (error) {
        console.error('Failed to fetch menu:', error);
        return null;
    }
}

// Fetch menus for store (by location)
async function fetchMenus(storeId: string): Promise<Menu[]> {
    try {
        const menus = await api.get<{ menus: Menu[] }>(`menus?storeId=${storeId}&isActive=true`);
        return menus.menus;
    } catch (error) {
        console.error('Failed to fetch menus:', error);
        return [];
    }
}

// Process header config into template-ready data
async function processHeaderConfig(
    config?: HeaderConfig,
    store?: Store | null
): Promise<HeaderTemplateProps> {
    const storeName = store?.name || 'Store';
    const logo = store?.logo;
    const currency = store?.currency || 'USD';

    // Get all theme colors from store config
    const themeColors = {
        primary: store?.theme?.colors?.primary || '#334155',
        secondary: store?.theme?.colors?.secondary || '#94a3b8',
        accent: store?.theme?.colors?.accent || '#d97706',
        background: store?.theme?.colors?.background || '#f8fafc',
        text: store?.theme?.colors?.text || '#1e293b',
    };

    const accentColor = themeColors.accent;

    // Process navigation - use from menu or fallback to defaults
    const navLinks: NavLink[] = DEFAULT_NAV_LINKS;
    const secondaryLinks: NavLink[] = DEFAULT_SECONDARY_LINKS;

    // Process top bar
    const topBarItems = {
        left: [] as any[],
        center: [] as any[],
        right: [] as any[],
    };
    const socialLinks: SocialLink[] = [];

    if (config?.topBar?.items) {
        config.topBar.items.forEach(item => {
            if (item.type === 'social' && item.url) {
                socialLinks.push({
                    platform: (item.icon || 'facebook') as SocialLink['platform'],
                    url: item.url,
                });
            } else {
                topBarItems[item.position].push({
                    id: item.id,
                    type: item.type,
                    content: item.content || item.label,
                    label: item.label,
                    url: item.url,
                });
            }
        });
    }

    // Process main header sections to determine what elements to show
    const headerElements = {
        showSearch: false,
        showLogo: true,
        showCart: false,
        showAccount: false,
        showWishlist: false,
        layout: config?.main?.layout || 'default',
        sections: config?.main?.sections || [],
    };

    // Find menu element and fetch menu
    let headerMenu: Menu | null = null;
    if (config?.main?.sections) {
        for (const section of config.main.sections) {
            for (const item of section.items) {
                if (item.type === 'search') headerElements.showSearch = true;
                if (item.type === 'cart') headerElements.showCart = true;
                if (item.type === 'account') headerElements.showAccount = true;
                if (item.type === 'wishlist') headerElements.showWishlist = true;

                // Fetch menu if menuId is specified
                if (item.type === 'menu' && (item.settings?.menuId || (item as any).menuId)) {
                    const menuId = (item.settings?.menuId || (item as any).menuId) as string;
                    headerMenu = await fetchMenuById(menuId);
                }
            }
        }
    } else {
        // Default: show all
        headerElements.showSearch = true;
        headerElements.showCart = true;
        headerElements.showAccount = true;
    }

    // Collect all menu IDs to fetch
    const menuIds = new Set<string>();

    // Add header menus
    if (config?.main?.sections) {
        config.main.sections.forEach(section => {
            section.items.forEach(item => {
                if (item.type === 'menu' && (item.settings?.menuId || (item as any).menuId)) {
                    menuIds.add((item.settings?.menuId || (item as any).menuId) as string);
                }
            });
        });
    }

    // Add mobile menu
    let mobileMenuId: string | undefined;
    if (config?.mobileMenu?.enabled && config.mobileMenu.menuId) {
        mobileMenuId = config.mobileMenu.menuId;
        menuIds.add(mobileMenuId);
    }

    // Menus are now accessed via StoreProvider context in MenuBuilder
    // No need to fetch or pass them here

    // Determine mobile menu object (for breakpoint calculation only)
    let mobileMenu: Menu | undefined;
    // Mobile menu will be accessed via context in MenuBuilder

    // Determine mobile breakpoint
    let mobileBreakpoint = 768;
    if (headerMenu?.settings?.mobileBreakpoint && headerMenu.settings.mobileBreakpoint > 300) {
        mobileBreakpoint = headerMenu.settings.mobileBreakpoint;
    } else if (mobileMenu?.settings?.mobileBreakpoint && mobileMenu.settings.mobileBreakpoint > 300) {
        mobileBreakpoint = mobileMenu.settings.mobileBreakpoint;
    }

    // Menus accessed via context, not passed as props
    const props: HeaderTemplateProps = {
        storeName,
        logo,
        currency,
        navLinks,
        secondaryLinks,
        topBar: {
            enabled: config?.topBar?.enabled ?? false,
            backgroundColor: config?.topBar?.backgroundColor || accentColor,
            textColor: config?.topBar?.textColor || '#ffffff',
            items: topBarItems,
            socialLinks,
        },
        search: {
            enabled: headerElements.showSearch,
            placeholder: DEFAULT_LABELS.search,
            categories: [], // Will come from categories API
        },
        isSticky: config?.main?.sticky,
        isTransparent: config?.main?.transparent,
        backgroundColor: config?.main?.backgroundColor,
        // State values - would come from context in real app
        cartCount: 0,
        cartTotal: '0.00',
        wishlistCount: 0,
        isLoggedIn: false,
        labels: DEFAULT_LABELS,
        // Pass theme colors
        accentColor,
        themeColors,
        // Pass header elements config
        headerElements,
        // headerMenu and mobileMenu deprecated - use context
        headerMenu: headerMenu || undefined,
        mobileMenu: mobileMenu || undefined,
        // Layout Config
        mobileBreakpoint,
    };

    return props;
}

// The Container component - Server Component
export default async function HeaderContainer({
    config,
    store,
    templateId = 'modern-clean',
}: HeaderContainerProps) {
    // Process all the data from config
    const templateProps = await processHeaderConfig(config, store);

    // Get the template-specific presenter component
    const HeaderTemplate = getComponent('HeaderTemplate', templateId);

    // Wrap with client component to inject cart count from context
    return (
        <ClientHeaderWrapper
            TemplateComponent={HeaderTemplate}
            templateProps={templateProps}
        />
    );
}
