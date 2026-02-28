'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/providers/StoreProvider';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
    const { store } = useStore();
    const [isVisible, setIsVisible] = useState(false);

    const config = store?.theme?.scrollToTop;

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);

        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    if (!config?.enabled) {
        return null;
    }

    // Default styles if not provided
    const styles = {
        position: 'fixed' as const,
        zIndex: 9999,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        transition: 'all 0.3s ease-in-out',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none' as 'auto' | 'none',
        transform: isVisible ? 'scale(1)' : 'scale(0.8)',

        // Configurable styles
        backgroundColor: config.colors?.background || '#000000',
        color: config.colors?.icon || '#ffffff',
        borderRadius: config.borderRadius ? `${config.borderRadius}px` : '50px',

        // Positioning
        bottom: `${config.yAxis || 20}px`,
        ...(() => {
            switch (config.position) {
                case 'bottom-left':
                    return { left: `${config.xAxis || 20}px` };
                case 'bottom-center':
                    return { left: '50%', transform: `translateX(-50%) ${isVisible ? 'scale(1)' : 'scale(0.8)'}` };
                case 'bottom-right':
                default:
                    return { right: `${config.xAxis || 20}px` };
            }
        })(),
    };

    return (
        <button
            onClick={scrollToTop}
            style={styles}
            aria-label="Scroll to top"
            type="button"
        >
            <ArrowUp size={18} aria-hidden="true" />
        </button>
    );
}
