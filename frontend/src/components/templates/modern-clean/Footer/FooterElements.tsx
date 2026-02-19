// Footer Element Renderers
// Individual components for each footer element type

import React from 'react';
import { FooterElement } from '@/types/store';
import MenuBuilder from '@/components/core/MenuBuilder';
import styles from './Footer.module.scss';
import NewsletterForm from './NewsletterForm';
import DynamicIcon from '@/components/core/common/DynamicIcon';

// Social Media Icon Components
const FacebookIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
    </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
);

const LinkedInIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

const YouTubeIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
    </svg>
);

const PinterestIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
    </svg>
);

// ============================================
// Menu Element
// ============================================
interface FooterMenuElementProps {
    element: FooterElement;
}

export function FooterMenuElement({ element }: FooterMenuElementProps) {
    if (!element.menuId) return null;

    return (
        <div className={styles.elementMenu}>
            <MenuBuilder
                menuId={element.menuId}
                className="footer-menu"
            />
        </div>
    );
}

// ============================================
// Text Element
// ============================================
interface FooterTextElementProps {
    element: FooterElement;
}

export function FooterTextElement({ element }: FooterTextElementProps) {
    return (
        <div className={styles.elementText} dangerouslySetInnerHTML={{ __html: element.content || '' }} />
    );
}

// ============================================
// HTML Element
// ============================================
interface FooterHtmlElementProps {
    element: FooterElement;
}

export function FooterHtmlElement({ element }: FooterHtmlElementProps) {
    return (
        <div
            className="footer-html-element"
            dangerouslySetInnerHTML={{ __html: element.content || '' }}
        />
    );
}

// ============================================
// Newsletter Element
// ============================================


interface FooterNewsletterElementProps {
    element: FooterElement;
}

export function FooterNewsletterElement({ element }: FooterNewsletterElementProps) {
    return (
        <div className={styles.elementNewsletter}>
            <NewsletterForm settings={element.settings} />
        </div>
    );
}

// ============================================
// Social Element
// ============================================
interface FooterSocialElementProps {
    element: FooterElement;
}

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    facebook: FacebookIcon,
    twitter: TwitterIcon,
    instagram: InstagramIcon,
    linkedin: LinkedInIcon,
    youtube: YouTubeIcon,
    pinterest: PinterestIcon,
};

export function FooterSocialElement({ element }: FooterSocialElementProps) {
    const socialLinks = element.settings?.socialLinks || [];

    if (socialLinks.length === 0) return null;

    const heading = element.settings?.socialTitle;

    return (
        <div className={styles.elementSocial}>
            {heading && <h4>{heading}</h4>}
            <div className={styles.socialLinks}>
                {socialLinks.map((link) => {
                    const Icon = socialIcons[link.platform];
                    return (
                        <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="no opener noreferrer"
                            aria-label={link.platform}
                        >
                            {Icon ? <Icon /> : <span>{link.platform[0].toUpperCase()}</span>}
                        </a>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================
// Contact Element
// ============================================
interface FooterContactElementProps {
    element: FooterElement;
}

export function FooterContactElement({ element }: FooterContactElementProps) {
    const contactInfo = element.settings?.contactInfo;

    if (!contactInfo) return null;

    return (
        <div className={styles.elementContact}>
            {contactInfo.title && <h4>{contactInfo.title}</h4>}

            <div>
                {contactInfo.address && (
                    <p>{contactInfo.address}</p>
                )}
                {contactInfo.phone && (
                    <p>
                        <a href={`tel:${contactInfo.phone}`}>
                            {contactInfo.phone}
                        </a>
                    </p>
                )}
                {contactInfo.email && (
                    <p>
                        <a href={`mailto:${contactInfo.email}`}>
                            {contactInfo.email}
                        </a>
                    </p>
                )}
                {contactInfo.workingHours && (
                    <p className={styles.workingHours}>{contactInfo.workingHours}</p>
                )}
            </div>
        </div>
    );
}

// ============================================
// Payment Methods Element
// ============================================
interface FooterPaymentMethodsElementProps {
    element: FooterElement;
}

export function FooterPaymentMethodsElement({ element }: FooterPaymentMethodsElementProps) {
    const paymentMethods = element.settings?.paymentMethods || [];
    const paymentMethodsTitle = element.settings?.paymentMethodsTitle;

    // Default payment methods if none configured
    const defaultMethods = [
        { id: '1', name: 'Visa', icon: '' },
        { id: '2', name: 'Mastercard', icon: '' },
        { id: '3', name: 'Amex', icon: '' },
        { id: '4', name: 'PayPal', icon: '' },
    ];

    const methods = paymentMethods.length > 0 ? paymentMethods : defaultMethods;

    return (
        <div className={styles.elementPayment}>
            {paymentMethodsTitle?.trim() ? <h4>{paymentMethodsTitle}</h4> : null}
            <div className={styles.paymentMethods}>
                {methods.map((method) => (
                    <div key={method.id} className={styles.method}>
                        {method.icon && /^(https?:\/\/|\/|data:image)/i.test(method.icon) ? (
                            <img
                                src={method.icon}
                                alt={method.name}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.textContent = method.name;
                                }}
                            />
                        ) : method.icon ? (
                            <DynamicIcon name={method.icon} size={18} />
                        ) : (
                            method.name
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================
// Main Element Renderer
// ============================================
interface FooterElementRendererProps {
    element: FooterElement;
}

export function FooterElementRenderer({ element }: FooterElementRendererProps) {
    switch (element.type) {
        case 'menu':
            return <FooterMenuElement element={element} />;
        case 'text':
            return <FooterTextElement element={element} />;
        case 'html':
            return <FooterHtmlElement element={element} />;
        case 'newsletter':
            return <FooterNewsletterElement element={element} />;
        case 'social':
            return <FooterSocialElement element={element} />;
        case 'contact':
            return <FooterContactElement element={element} />;
        case 'payment-methods':
            return <FooterPaymentMethodsElement element={element} />;
        default:
            return null;
    }
}
