// Core Footer Container - Handles business logic and data processing
// This component fetches data, processes configs, and passes to Template

import { FooterConfig, Store } from '@/types';
import { getComponent } from '@/components/templates/registry';
import {
    FooterTemplateProps,
    FooterColumn,
    FooterSocialLink,
    FooterContactInfo,
    DEFAULT_FOOTER_COLUMNS,
    DEFAULT_SOCIAL_LINKS,
    DEFAULT_CONTACT,
} from './types';

interface FooterContainerProps {
    config?: FooterConfig;
    store?: Store | null;
    templateId?: string;
}

// Process footer config into template-ready data
function processFooterConfig(config?: FooterConfig, store?: Store | null): Omit<FooterTemplateProps, 'onNewsletterSubmit'> {
    const currentYear = new Date().getFullYear();
    const storeName = store?.name || 'Store';

    // Process columns from config or use defaults
    let columns: FooterColumn[] = DEFAULT_FOOTER_COLUMNS;
    if (config?.columns && config.columns.length > 0) {
        columns = config.columns.map(col => ({
            title: col.title || 'Links',
            links: col.items
                ?.filter(item => item.type === 'menu')
                .flatMap(item => item.settings?.links as any[] || []) || [],
        }));
    }

    // Process social links from config
    let socialLinks: FooterSocialLink[] = DEFAULT_SOCIAL_LINKS;
    const socialItem = config?.columns?.flatMap(c => c.items).find(i => i.type === 'social');
    if (socialItem?.settings?.links) {
        socialLinks = (socialItem.settings.links as any[]).map(link => ({
            platform: link.platform || 'facebook',
            url: link.url || '#',
        }));
    }

    // Process contact info
    let contact: FooterContactInfo = DEFAULT_CONTACT;
    const contactItem = config?.columns?.flatMap(c => c.items).find(i => i.type === 'contact');
    if (contactItem?.settings) {
        contact = {
            email: (contactItem.settings as any).email || DEFAULT_CONTACT.email,
            phone: (contactItem.settings as any).phone || DEFAULT_CONTACT.phone,
            address: (contactItem.settings as any).address || DEFAULT_CONTACT.address,
        };
    }

    // Newsletter config
    const newsletterItem = config?.columns?.flatMap(c => c.items).find(i => i.type === 'newsletter');
    const newsletter = {
        enabled: !!newsletterItem,
        title: (newsletterItem?.settings as any)?.title || 'Join Our Newsletter',
        description: (newsletterItem?.settings as any)?.description || 'Be the first to know about new collections and exclusive offers.',
        placeholder: (newsletterItem?.settings as any)?.placeholder || 'Enter your email',
        buttonText: (newsletterItem?.settings as any)?.buttonText || 'Subscribe',
    };

    // Copyright text
    const copyrightText = config?.bottomBar?.copyright || `© ${currentYear} ${storeName}. All rights reserved.`;

    return {
        storeName,
        columns,
        socialLinks,
        contact,
        newsletter,
        copyrightText,
        backgroundColor: config?.backgroundColor,
        textColor: config?.textColor,
        currentYear,
    };
}

// The Container component - Server Component
export default function FooterContainer({ config, store, templateId = 'modern-clean' }: FooterContainerProps) {
    // Process all the data
    const templateProps = processFooterConfig(config, store);

    // Get the template-specific presenter component
    const FooterTemplate = getComponent('FooterTemplate', templateId);

    // Render the template with processed data
    return <FooterTemplate {...templateProps} />;
}
