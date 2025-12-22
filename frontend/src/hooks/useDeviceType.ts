import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Hook to detect current device type based on viewport width
 * Mobile: < 768px
 * Tablet: 768px - 1024px
 * Desktop: > 1024px
 */
export function useDeviceType(): DeviceType {
    const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

    useEffect(() => {
        const checkDeviceType = () => {
            const width = window.innerWidth;

            if (width < 768) {
                setDeviceType('mobile');
            } else if (width < 1024) {
                setDeviceType('tablet');
            } else {
                setDeviceType('desktop');
            }
        };

        // Check on mount
        checkDeviceType();

        // Add resize listener
        window.addEventListener('resize', checkDeviceType);

        return () => window.removeEventListener('resize', checkDeviceType);
    }, []);

    return deviceType;
}

/**
 * Helper function to check if element should be visible based on device type
 */
export function checkVisibility(
    visibility: { desktop?: boolean; tablet?: boolean; mobile?: boolean } | undefined,
    deviceType: DeviceType
): boolean {
    if (!visibility) return true; // Default to visible if no visibility settings

    switch (deviceType) {
        case 'mobile':
            return visibility.mobile !== false;
        case 'tablet':
            return visibility.tablet !== false;
        case 'desktop':
            return visibility.desktop !== false;
        default:
            return true;
    }
}
