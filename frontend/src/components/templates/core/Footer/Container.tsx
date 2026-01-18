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

    // Find the columns section and bottom-bar section from FooterConfig.sections
    const columnsSection = config?.sections?.find(s => s.type === 'columns');
    const bottomBarSection = config?.sections?.find(s => s.type === 'bottom-bar');
    const footerColumns = columnsSection?.columns;

    // Process columns from config or use defaults
    let columns: FooterColumn[] = DEFAULT_FOOTER_COLUMNS;
    if (footerColumns && footerColumns.length > 0) {
        columns = footerColumns.map(col => ({
            title: col.title || 'Links',
            links: col.items
                ?.filter(item => item.type === 'menu')
                .flatMap(item => item.settings?.links || []) || [],
        }));
    }

    // Process social links from config
    let socialLinks: FooterSocialLink[] = DEFAULT_SOCIAL_LINKS;
    const socialItem = footerColumns?.flatMap(c => c.items).find(i => i.type === 'social');
    if (socialItem?.settings?.socialLinks) {
        socialLinks = socialItem.settings.socialLinks.map(link => ({
            platform: link.platform || 'facebook',
            url: link.url || '#!',
        }));
    }

    // Process contact info
    let contact: FooterContactInfo = DEFAULT_CONTACT;
    const contactItem = footerColumns?.flatMap(c => c.items).find(i => i.type === 'contact');
    if (contactItem?.settings?.contactInfo) {
        contact = {
            email: contactItem.settings.contactInfo.email || DEFAULT_CONTACT.email,
            phone: contactItem.settings.contactInfo.phone || DEFAULT_CONTACT.phone,
            address: contactItem.settings.contactInfo.address || DEFAULT_CONTACT.address,
        };
    }

    // Newsletter config
    const newsletterItem = footerColumns?.flatMap(c => c.items).find(i => i.type === 'newsletter');
    const newsletter = {
        enabled: !!newsletterItem,
        title: newsletterItem?.settings?.newsletterTitle || 'Join Our Newsletter',
        description: newsletterItem?.settings?.newsletterDescription || 'Be the first to know about new collections and exclusive offers.',
        placeholder: newsletterItem?.settings?.newsletterPlaceholder || 'Enter your email',
        buttonText: newsletterItem?.settings?.newsletterButtonText || 'Subscribe',
    };

    // Copyright text
    const copyrightText = bottomBarSection?.bottomBarContent || `© ${currentYear} ${storeName}. All rights reserved.`;

    return {
        storeName,
        columns,
        socialLinks,
        contact,
        newsletter,
        copyrightText,
        backgroundColor: columnsSection?.backgroundColor,
        textColor: columnsSection?.textColor,
        currentYear,
    };
}

// The Container component - Server Component
export default function FooterContainer({ config, store, templateId = 'modern-clean' }: FooterContainerProps) {
    // Process all the data
    const templateProps = processFooterConfig(config, store);

    // Get the template-specific presenter component
    const FooterTemplate = getComponent('FooterTemplate', templateId);

    // Render the template with processed data AND raw config for templates that need it
    return <FooterTemplate {...templateProps} config={config} store={store} />;
}
