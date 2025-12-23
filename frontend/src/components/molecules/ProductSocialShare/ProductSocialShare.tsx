'use client';

import React, { useState } from 'react';
import styles from './ProductSocialShare.module.scss';

interface ProductSocialShareProps {
    productName: string;
    productUrl?: string;
    productImage?: string;
}

export default function ProductSocialShare({
    productName,
    productUrl,
    productImage,
}: ProductSocialShareProps) {
    const [copied, setCopied] = useState(false);

    const url = productUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const encodedUrl = encodeURIComponent(url);
    const encodedName = encodeURIComponent(productName);

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedName}`,
        whatsapp: `https://api.whatsapp.com/send?text=${encodedName}%20${encodedUrl}`,
        pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedName}${productImage ? `&media=${encodeURIComponent(productImage)}` : ''}`,
        email: `mailto:?subject=${encodedName}&body=Check out this product: ${encodedUrl}`,
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleShare = (platform: keyof typeof shareLinks) => {
        window.open(shareLinks[platform], '_blank', 'width=600,height=400');
    };

    return (
        <div className={styles.socialShare}>
            <span className={styles.label}>Share:</span>
            <div className={styles.buttons}>
                <button
                    className={`${styles.shareBtn} ${styles.facebook}`}
                    onClick={() => handleShare('facebook')}
                    title="Share on Facebook"
                    aria-label="Share on Facebook"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                </button>
                <button
                    className={`${styles.shareBtn} ${styles.twitter}`}
                    onClick={() => handleShare('twitter')}
                    title="Share on Twitter"
                    aria-label="Share on Twitter"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                </button>
                <button
                    className={`${styles.shareBtn} ${styles.whatsapp}`}
                    onClick={() => handleShare('whatsapp')}
                    title="Share on WhatsApp"
                    aria-label="Share on WhatsApp"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                </button>
                <button
                    className={`${styles.shareBtn} ${styles.pinterest}`}
                    onClick={() => handleShare('pinterest')}
                    title="Share on Pinterest"
                    aria-label="Share on Pinterest"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
                    </svg>
                </button>
                <button
                    className={`${styles.shareBtn} ${styles.email}`}
                    onClick={() => handleShare('email')}
                    title="Share via Email"
                    aria-label="Share via Email"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                </button>
                <button
                    className={`${styles.shareBtn} ${styles.copy} ${copied ? styles.copied : ''}`}
                    onClick={handleCopyLink}
                    title={copied ? 'Copied!' : 'Copy Link'}
                    aria-label="Copy link"
                >
                    {copied ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}
