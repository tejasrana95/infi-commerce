'use client';

interface FontLoaderProps {
    href: string;
}

/**
 * Renders a Google Fonts stylesheet using the non-blocking preload + onLoad swap pattern.
 * This must be a Client Component because onLoad requires a function reference in JSX.
 */
export default function FontLoader({ href }: FontLoaderProps) {
    return (
        <>
            <link
                rel="preload"
                href={href}
                as="style"
                onLoad={(e) => {
                    const el = e.currentTarget as HTMLLinkElement;
                    el.onload = null;
                    el.rel = 'stylesheet';
                }}
            />
            <noscript>
                {/* Fallback for browsers with JS disabled */}
                <link rel="stylesheet" href={href} />
            </noscript>
        </>
    );
}
