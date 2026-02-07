export const DEVICE_BREAKPOINTS = {
    MOBILE: 768,
    TABLET: 1024,
};

/**
 * Checks if the current viewport width corresponds to a mobile device (< 768px)
 */
export const isMobile = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < DEVICE_BREAKPOINTS.MOBILE;
};

/**
 * Checks if the current viewport width corresponds to a tablet device (>= 768px and < 1024px)
 */
export const isTablet = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= DEVICE_BREAKPOINTS.MOBILE && window.innerWidth < DEVICE_BREAKPOINTS.TABLET;
};

/**
 * Checks if the current viewport width corresponds to a desktop device (>= 1024px)
 */
export const isDesktop = (): boolean => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= DEVICE_BREAKPOINTS.TABLET;
};

/**
 * Checks if the user agent indicates a mobile device
 */
export const isMobileDevice = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Checks if the user agent indicates a tablet device (iPad or Android tablet)
 */
export const isTabletDevice = (): boolean => {
    if (typeof window === 'undefined') return false;
    const userAgent = navigator.userAgent.toLowerCase();
    return /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);
};
