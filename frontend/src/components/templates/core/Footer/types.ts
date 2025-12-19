// Footer Types - Shared between Core and Templates

export interface FooterLink {
    label: string;
    url: string;
}

export interface FooterColumn {
    title: string;
    links: FooterLink[];
}

export interface FooterSocialLink {
    platform: 'facebook' | 'twitter' | 'instagram' | 'youtube' | 'linkedin' | 'pinterest';
    url: string;
}

export interface FooterContactInfo {
    email?: string;
    phone?: string;
    address?: string;
}

export interface FooterNewsletterConfig {
    enabled: boolean;
    title?: string;
    description?: string;
    placeholder?: string;
    buttonText?: string;
}

// Props that Template components receive (pure presentation data)
export interface FooterTemplateProps {
    // Store Info
    storeName: string;

    // Columns with links
    columns: FooterColumn[];

    // Social links
    socialLinks: FooterSocialLink[];

    // Contact info
    contact: FooterContactInfo;

    // Newsletter config
    newsletter: FooterNewsletterConfig;

    // Copyright
    copyrightText: string;

    // Style settings (from theme)
    backgroundColor?: string;
    textColor?: string;

    // Year (computed)
    currentYear: number;

    // Actions (for client interactivity)
    onNewsletterSubmit?: (email: string) => void;
}

// Default footer data
export const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
    {
        title: 'Quick Links',
        links: [
            { label: 'Home', url: '/' },
            { label: 'Shop', url: '/shop' },
            { label: 'About Us', url: '/about' },
            { label: 'Contact', url: '/contact' },
        ],
    },
    {
        title: 'Customer Service',
        links: [
            { label: 'FAQ', url: '/faq' },
            { label: 'Shipping Info', url: '/shipping' },
            { label: 'Returns', url: '/returns' },
            { label: 'Privacy Policy', url: '/privacy' },
        ],
    },
];

export const DEFAULT_SOCIAL_LINKS: FooterSocialLink[] = [
    { platform: 'facebook', url: '#' },
    { platform: 'twitter', url: '#' },
    { platform: 'instagram', url: '#' },
];

export const DEFAULT_CONTACT: FooterContactInfo = {
    email: 'support@store.com',
    phone: '+1 (555) 123-4567',
    address: '123 Commerce St',
};
