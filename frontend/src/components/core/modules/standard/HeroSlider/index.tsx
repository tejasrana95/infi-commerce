'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ModuleProps } from '../../index';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchHeroSlider } from '@/lib/api';
import { useStore } from '@/providers/StoreProvider';
import { track } from '@/lib/ga';
import styles from './HeroSlider.module.css';
import DynamicIcon from '../../../common/DynamicIcon';
import { formatFontFamily } from '@/lib/fonts';
import { useDynamicFonts } from '@/hooks/useDynamicFonts';

// Viewport breakpoints - MUST match admin SlideCanvas.tsx VIEWPORT_DIMENSIONS exactly
const VIEWPORT_BREAKPOINTS = {
    desktop: 1200, // >= 1200px
    tablet: 768,   // >= 768px && < 1200px
    mobile: 0      // < 768px
} as const;

// Helper to render icon by name
const renderIcon = (iconName: string, fontSize: any) => {
    const size = parseInt(fontSize) || 24;
    return <DynamicIcon name={iconName} size={size} />;
};

// Section layout configuration
interface SectionLayout {
    columns: number; // 1-6 columns
    gap: number; // Gap in pixels
    alignment: 'start' | 'center' | 'end' | 'stretch';
    justify: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
    wrap: boolean; // Enable wrapping
    direction: 'row' | 'column';
    padding?: { top?: number; right?: number; bottom?: number; left?: number };
    // Responsive overrides
    tabletColumns?: number;
    mobileColumns?: number;
    tabletGap?: number;
    mobileGap?: number;
    tabletDirection?: 'row' | 'column';
    mobileDirection?: 'row' | 'column';
}

// Types matching backend/admin
interface HeroSliderLayer {
    id: string;
    type: 'text' | 'image' | 'button' | 'icon' | 'rte' | 'section';
    content: any;
    style: any;
    position: { x: number; y: number };
    tabletPosition?: { x: number; y: number };
    mobilePosition?: { x: number; y: number };
    animation: {
        in: string;
        out: string;
        delay: number;
        duration: number;
    };
    border?: {
        color?: string;
        width?: number;
        radius?: number;
        style?: 'solid' | 'dashed' | 'dotted' | 'none';
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
    shadow?: {
        x?: number;
        y?: number;
        blur?: number;
        spread?: number;
        color?: string;
    };
    visible?: boolean;
    tabletStyle?: any;
    mobileStyle?: any;
    tabletVisible?: boolean;
    mobileVisible?: boolean;
    // Section/Container features
    parentId?: string; // Parent section ID (null for root layers)
    children?: string[]; // Child layer IDs (for section type)
    sectionLayout?: SectionLayout; // Section-specific layout config
}

interface HeroSliderSlide {
    id: string;
    background: {
        type: 'image' | 'color' | 'video';
        value: string;
        overlay?: string;
        overlayOpacity?: number;
    };
    layers: HeroSliderLayer[];
    settings: {
        duration: number;
    };
}

interface HeroSliderData {
    _id: string;
    name: string;
    slides: HeroSliderSlide[];
    settings: {
        width: number;
        height: number | { desktop: number; tablet: number; mobile: number };
        responsive: boolean;
        autoPlay: boolean;
        delay: number;
        effect: 'fade' | 'slide' | 'cube' | 'coverflow' | 'flip';
        showBullets?: boolean;
        bulletColor?: string;
        showArrows?: boolean;
        arrowColor?: string;
        showProgress?: boolean;
        progressPosition?: 'top' | 'bottom';
    };
    isActive: boolean;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';

// Hook to detect current viewport
const useViewport = (): ViewportMode => {
    const [viewport, setViewport] = useState<ViewportMode>('desktop');

    useEffect(() => {
        const updateViewport = () => {
            const width = window.innerWidth;
            if (width >= VIEWPORT_BREAKPOINTS.desktop) {
                setViewport('desktop');
            } else if (width >= VIEWPORT_BREAKPOINTS.tablet) {
                setViewport('tablet');
            } else {
                setViewport('mobile');
            }
        };

        updateViewport();
        window.addEventListener('resize', updateViewport);
        return () => window.removeEventListener('resize', updateViewport);
    }, []);

    return viewport;
};

/**
 * Get position for a specific viewport with proper fallback chain
 * Desktop -> Tablet (inherits from Desktop) -> Mobile (inherits from Tablet)
 */
const getPositionForViewport = (
    layer: HeroSliderLayer,
    viewport: ViewportMode
): { x: number; y: number } => {
    const desktopPos = layer.position || { x: 0, y: 0 };
    const tabletPos = layer.tabletPosition || desktopPos;
    const mobilePos = layer.mobilePosition || tabletPos;

    if (viewport === 'mobile') return mobilePos;
    if (viewport === 'tablet') return tabletPos;
    return desktopPos;
};

/**
 * Get style for a specific viewport with proper inheritance
 * Desktop -> Tablet (merges with Desktop) -> Mobile (merges with Tablet)
 */
const getStyleForViewport = (
    layer: HeroSliderLayer,
    viewport: ViewportMode
): any => {
    const desktopStyle = layer.style || {};
    const tabletStyle = layer.tabletStyle ? { ...desktopStyle, ...layer.tabletStyle } : desktopStyle;
    const mobileStyle = layer.mobileStyle ? { ...tabletStyle, ...layer.mobileStyle } : tabletStyle;

    const rawStyle = viewport === 'mobile' ? mobileStyle : (viewport === 'tablet' ? tabletStyle : desktopStyle);

    // Format font family if it exists
    if (rawStyle.fontFamily) {
        return {
            ...rawStyle,
            fontFamily: formatFontFamily(rawStyle.fontFamily)
        };
    }

    return rawStyle;
};

/**
 * Get visibility for a specific viewport with proper inheritance
 */
const getVisibilityForViewport = (
    layer: HeroSliderLayer,
    viewport: ViewportMode
): boolean => {
    const desktopVisible = layer.visible !== false;
    const tabletVisible = layer.tabletVisible ?? desktopVisible;
    const mobileVisible = layer.mobileVisible ?? tabletVisible;

    if (viewport === 'mobile') return mobileVisible;
    if (viewport === 'tablet') return tabletVisible;
    return desktopVisible;
};

interface LayerProps {
    layer: HeroSliderLayer;
    isActive: boolean;
    viewport: ViewportMode;
    allLayers: HeroSliderLayer[];
}

/**
 * Get section columns for a specific viewport with fallback chain
 */
const getSectionColumnsForViewport = (
    sectionLayout: SectionLayout,
    viewport: ViewportMode
): number => {
    if (viewport === 'mobile') {
        return sectionLayout.mobileColumns ?? sectionLayout.tabletColumns ?? sectionLayout.columns ?? 1;
    }
    if (viewport === 'tablet') {
        return sectionLayout.tabletColumns ?? sectionLayout.columns ?? 2;
    }
    return sectionLayout.columns ?? 3;
};

/**
 * Get section gap for a specific viewport with fallback chain
 */
const getSectionGapForViewport = (
    sectionLayout: SectionLayout,
    viewport: ViewportMode
): number => {
    if (viewport === 'mobile') {
        return sectionLayout.mobileGap ?? sectionLayout.tabletGap ?? sectionLayout.gap ?? 16;
    }
    if (viewport === 'tablet') {
        return sectionLayout.tabletGap ?? sectionLayout.gap ?? 16;
    }
    return sectionLayout.gap ?? 16;
};

/**
 * Get section direction for a specific viewport with fallback chain
 */
const getSectionDirectionForViewport = (
    sectionLayout: SectionLayout,
    viewport: ViewportMode
): 'row' | 'column' => {
    if (viewport === 'mobile') {
        return sectionLayout.mobileDirection ?? sectionLayout.tabletDirection ?? sectionLayout.direction ?? 'row';
    }
    if (viewport === 'tablet') {
        return sectionLayout.tabletDirection ?? sectionLayout.direction ?? 'row';
    }
    return sectionLayout.direction ?? 'row';
};

// Render layer content (shared between regular and section child layers)
const LayerContent: React.FC<{
    layer: HeroSliderLayer;
    effectiveStyle: any;
}> = ({ layer, effectiveStyle }) => {
    if (layer.type === 'text') return <>{layer.content}</>;
    if (layer.type === 'rte') return <div dangerouslySetInnerHTML={{ __html: layer.content }} />;
    if (layer.type === 'button') {
        return (
            <a
                href={layer.style?.href || '#!'}
                style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'block',
                    width: '100%',
                    height: '100%'
                }}
                onClick={(e) => {
                    if (!layer.style?.href || layer.style.href === '#' || layer.style.href === '#!') {
                        e.preventDefault();
                    }
                }}
                data-track="hero_slider_cta_click"
                data-cta-text={layer.content}
                data-cta-link={layer.style?.href}
            >
                {layer.content}
            </a>
        );
    }
    if (layer.type === 'image') {
        return (
            <img
                src={layer.content}
                alt="Layer"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                }}
            />
        );
    }
    if (layer.type === 'icon') {
        return <>{renderIcon(layer.content, effectiveStyle?.fontSize)}</>;
    }
    return null;
};

// Recursive nested section rendering component
const NestedSectionContent: React.FC<{
    layer: HeroSliderLayer;
    viewport: ViewportMode;
    allLayers: HeroSliderLayer[];
    isActive: boolean;
}> = ({ layer, viewport, allLayers, isActive }) => {
    const sectionLayout = layer.sectionLayout || {
        columns: 2,
        gap: 16,
        alignment: 'stretch' as const,
        justify: 'start' as const,
        wrap: true,
        direction: 'row' as const
    };

    const columns = getSectionColumnsForViewport(sectionLayout, viewport);
    const gap = getSectionGapForViewport(sectionLayout, viewport);

    // Get child layers
    const childLayers = layer.children && layer.children.length > 0
        ? allLayers.filter(l => layer.children!.includes(l.id))
        : [];

    const nestedSectionStyles: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
        // For grid: alignItems = vertical alignment, justifyItems = horizontal alignment
        alignItems: sectionLayout.alignment || 'stretch',
        justifyItems: sectionLayout.justify || 'start',
        padding: sectionLayout.padding
            ? `${sectionLayout.padding.top || 0}px ${sectionLayout.padding.right || 0}px ${sectionLayout.padding.bottom || 0}px ${sectionLayout.padding.left || 0}px`
            : undefined,
        width: '100%',
    };

    return (
        <div style={nestedSectionStyles}>
            {childLayers.map((childLayer, index) => {
                const childVisible = getVisibilityForViewport(childLayer, viewport);
                if (!childVisible) return null;

                const childStyle = getStyleForViewport(childLayer, viewport);
                const childBorderStyles: React.CSSProperties = {};
                if (childLayer.border && childLayer.border.style !== 'none') {
                    const defaultWidth = childLayer.border.width ?? 1;
                    childBorderStyles.borderWidth = `${childLayer.border.top ?? defaultWidth}px ${childLayer.border.right ?? defaultWidth}px ${childLayer.border.bottom ?? defaultWidth}px ${childLayer.border.left ?? defaultWidth}px`;
                    childBorderStyles.borderStyle = childLayer.border.style || 'solid';
                    childBorderStyles.borderColor = childLayer.border.color || '#000000';
                    if (childLayer.border.radius !== undefined) {
                        childBorderStyles.borderRadius = `${childLayer.border.radius}px`;
                    }
                }

                const childShadowStyles: React.CSSProperties = {};
                if (childLayer.shadow) {
                    const { x = 0, y = 0, blur = 0, spread = 0, color = 'rgba(0,0,0,0.5)' } = childLayer.shadow;
                    childShadowStyles.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
                }

                // Remove position properties for grid items
                const { left: _l, top: _t, right: _r, bottom: _b, position: _p, ...childRestStyle } = childStyle || {};

                return (
                    <motion.div
                        key={childLayer.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: childLayer.animation.duration / 1000,
                            delay: (childLayer.animation.delay / 1000) + (index * 0.1),
                            ease: 'easeOut'
                        }}
                        style={{
                            ...childRestStyle,
                            ...childBorderStyles,
                            ...childShadowStyles,
                        }}
                    >
                        {/* Recursive nested section */}
                        {childLayer.type === 'section' ? (
                            <NestedSectionContent
                                layer={childLayer}
                                viewport={viewport}
                                allLayers={allLayers}
                                isActive={isActive}
                            />
                        ) : (
                            <LayerContent layer={childLayer} effectiveStyle={childStyle} />
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
};

const Layer: React.FC<LayerProps> = ({ layer, isActive, viewport, allLayers }) => {
    // Map animation names to framer-motion variants
    const getAnimation = (name: string) => {
        switch (name) {
            case 'fadeIn': return { opacity: 0, scale: 1, x: 0, y: 0 };
            case 'fadeInUp': return { opacity: 0, y: 50 };
            case 'fadeInDown': return { opacity: 0, y: -50 };
            case 'fadeInLeft': return { opacity: 0, x: -50 };
            case 'fadeInRight': return { opacity: 0, x: 50 };
            case 'zoomIn': return { opacity: 0, scale: 0.5 };
            case 'bounceIn': return { opacity: 0, scale: 0.3 };
            default: return { opacity: 0 };
        }
    };

    const initial = getAnimation(layer.animation.in);

    // Get effective values for current viewport
    const effectivePosition = getPositionForViewport(layer, viewport);
    const effectiveStyle = getStyleForViewport(layer, viewport);
    const effectiveVisible = getVisibilityForViewport(layer, viewport);

    // Build border styles
    const borderStyles: React.CSSProperties = {};
    if (layer.border && layer.border.style !== 'none') {
        const defaultWidth = layer.border.width ?? 1;
        borderStyles.borderWidth = `${layer.border.top ?? defaultWidth}px ${layer.border.right ?? defaultWidth}px ${layer.border.bottom ?? defaultWidth}px ${layer.border.left ?? defaultWidth}px`;
        borderStyles.borderStyle = layer.border.style || 'solid';
        borderStyles.borderColor = layer.border.color || '#000000';
        if (layer.border.radius !== undefined) {
            borderStyles.borderRadius = `${layer.border.radius}px`;
        }
    }

    // Build shadow styles
    const shadowStyles: React.CSSProperties = {};
    if (layer.shadow) {
        const { x = 0, y = 0, blur = 0, spread = 0, color = 'rgba(0,0,0,0.5)' } = layer.shadow;
        shadowStyles.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
    }

    // Extract non-position styles from effectiveStyle
    const { left, top, right, bottom, position, ...restStyle } = effectiveStyle || {};

    // Combined styles for regular layers (positioned absolutely)
    const layerStyles: React.CSSProperties = {
        ...restStyle,
        ...borderStyles,
        ...shadowStyles,
        position: 'absolute',
        left: `${effectivePosition.x}%`,
        top: `${effectivePosition.y}%`,
        zIndex: 10,
        textAlign: effectiveStyle?.textAlign || 'left',
    };

    if (!effectiveVisible) {
        return null;
    }

    // Handle Section type with grid layout
    if (layer.type === 'section') {
        // Default section layout if not provided
        const sectionLayout: SectionLayout = layer.sectionLayout || {
            columns: 4,
            gap: 16,
            alignment: 'stretch',
            justify: 'start',
            wrap: true,
            direction: 'row'
        };
        const columns = getSectionColumnsForViewport(sectionLayout, viewport);
        const gap = getSectionGapForViewport(sectionLayout, viewport);
        const direction = getSectionDirectionForViewport(sectionLayout, viewport);

        // Get child layers
        const childLayers = layer.children && layer.children.length > 0
            ? allLayers.filter(l => layer.children!.includes(l.id))
            : [];

        const sectionStyles: React.CSSProperties = {
            ...borderStyles,
            ...shadowStyles,
            position: 'absolute',
            left: `${effectivePosition.x}%`,
            top: `${effectivePosition.y}%`,
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: `${gap}px`,
            // For grid: alignItems = vertical alignment, justifyItems = horizontal alignment
            alignItems: sectionLayout.alignment || 'stretch',
            justifyItems: sectionLayout.justify || 'start',
            padding: sectionLayout.padding
                ? `${sectionLayout.padding.top || 0}px ${sectionLayout.padding.right || 0}px ${sectionLayout.padding.bottom || 0}px ${sectionLayout.padding.left || 0}px`
                : undefined,
            zIndex: 10,
            width: effectiveStyle?.width || 'auto',
            minHeight: effectiveStyle?.minHeight || 'auto',
        };

        return (
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={initial}
                        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: layer.animation.duration / 1000,
                            delay: layer.animation.delay / 1000,
                            ease: 'easeOut'
                        }}
                        style={sectionStyles}
                    >
                        {childLayers.map((childLayer, index) => {
                            const childVisible = getVisibilityForViewport(childLayer, viewport);
                            if (!childVisible) return null;

                            const childStyle = getStyleForViewport(childLayer, viewport);
                            const childBorderStyles: React.CSSProperties = {};
                            if (childLayer.border && childLayer.border.style !== 'none') {
                                const defaultWidth = childLayer.border.width ?? 1;
                                childBorderStyles.borderWidth = `${childLayer.border.top ?? defaultWidth}px ${childLayer.border.right ?? defaultWidth}px ${childLayer.border.bottom ?? defaultWidth}px ${childLayer.border.left ?? defaultWidth}px`;
                                childBorderStyles.borderStyle = childLayer.border.style || 'solid';
                                childBorderStyles.borderColor = childLayer.border.color || '#000000';
                                if (childLayer.border.radius !== undefined) {
                                    childBorderStyles.borderRadius = `${childLayer.border.radius}px`;
                                }
                            }

                            const childShadowStyles: React.CSSProperties = {};
                            if (childLayer.shadow) {
                                const { x = 0, y = 0, blur = 0, spread = 0, color = 'rgba(0,0,0,0.5)' } = childLayer.shadow;
                                childShadowStyles.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
                            }

                            // Remove position properties for grid items
                            const { left: _l, top: _t, right: _r, bottom: _b, position: _p, ...childRestStyle } = childStyle || {};

                            return (
                                <motion.div
                                    key={childLayer.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: childLayer.animation.duration / 1000,
                                        delay: (childLayer.animation.delay / 1000) + (index * 0.1),
                                        ease: 'easeOut'
                                    }}
                                    style={{
                                        ...childRestStyle,
                                        ...childBorderStyles,
                                        ...childShadowStyles,
                                    }}
                                >
                                    {/* Handle nested sections recursively */}
                                    {childLayer.type === 'section' ? (
                                        <NestedSectionContent
                                            layer={childLayer}
                                            viewport={viewport}
                                            allLayers={allLayers}
                                            isActive={isActive}
                                        />
                                    ) : (
                                        <LayerContent layer={childLayer} effectiveStyle={childStyle} />
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }

    // Regular layer rendering
    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={initial}
                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                        duration: layer.animation.duration / 1000,
                        delay: layer.animation.delay / 1000,
                        ease: 'easeOut'
                    }}
                    style={layerStyles}
                >
                    <LayerContent layer={layer} effectiveStyle={effectiveStyle} />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const HeroSliderModule: React.FC<ModuleProps> = ({ config, initialData }) => {
    const { store } = useStore();
    // Unwrap pre-fetched data if needed (some API responses wrap it in { slider: ... })
    const unwrappedInitialData = initialData?.slider || initialData;

    // Check if we truly have valid data (slider must have ID and slides)
    const hasValidInitialData = !!(unwrappedInitialData?._id && Array.isArray(unwrappedInitialData?.slides));

    const [sliderData, setSliderData] = useState<HeroSliderData | null>(hasValidInitialData ? unwrappedInitialData as HeroSliderData : null);
    const [loading, setLoading] = useState(!hasValidInitialData);
    const [activeIndex, setActiveIndex] = useState(0);
    const viewport = useViewport();

    useEffect(() => {
        // Only skip fetch if we have valid initial data
        if (hasValidInitialData) return;

        if (store?._id && config.sliderId) {
            setLoading(true);
            fetchHeroSlider(store._id, config.sliderId).then((data: any) => {
                // Handle both wrapped and unwrapped API responses
                const finalData = data?.slider || data;
                if (finalData?._id && Array.isArray(finalData?.slides)) {
                    setSliderData(finalData as HeroSliderData);
                }
                setLoading(false);
            });
        }
    }, [store?._id, config.sliderId, hasValidInitialData]);

    // Extract and dynamically load fonts from all Hero Slider layers
    const fontsToLoad = useMemo(() => {
        if (!sliderData) return [];

        const fonts: string[] = [];

        sliderData.slides.forEach(slide => {
            slide.layers.forEach(layer => {
                // Check desktop, tablet, and mobile styles
                [layer.style, layer.tabletStyle, layer.mobileStyle].forEach(style => {
                    if (style?.fontFamily) {
                        fonts.push(style.fontFamily);
                    }
                });
            });
        });

        return fonts;
    }, [sliderData]);

    // Use the hook to load fonts dynamically
    useDynamicFonts(fontsToLoad);

    // CSS Variables for responsive heights and other dynamic styles
    // Use initialData or sliderData to prevent layout shift during loading
    const containerStyle = useMemo(() => {
        // Prioritize sliderData, but fall back to unwrappedInitialData for height settings
        const dataSource = sliderData || unwrappedInitialData;
        const heightSettings = dataSource?.settings?.height;
        let desktopH = 600;
        let tabletH = 600;
        let mobileH = 600;

        if (typeof heightSettings === 'number') {
            desktopH = tabletH = mobileH = heightSettings;
        } else if (heightSettings && typeof heightSettings === 'object') {
            desktopH = heightSettings.desktop || 600;
            tabletH = heightSettings.tablet || desktopH;
            mobileH = heightSettings.mobile || tabletH;
        }

        return {
            '--hero-height-mobile': `${mobileH}px`,
            '--hero-height-tablet': `${tabletH}px`,
            '--hero-height-desktop': `${desktopH}px`,
            '--swiper-navigation-color': dataSource?.settings?.arrowColor || '#ffffff',
            '--swiper-pagination-color': dataSource?.settings?.bulletColor || '#ffffff',
            '--slider-bg-color': (dataSource?.slides?.[0]?.background?.type === 'color' ? dataSource.slides[0].background?.value : 'transparent'),
        } as React.CSSProperties;
    }, [sliderData, unwrappedInitialData]);

    if (loading) {
        return <div className={styles.skeletonContainer} style={containerStyle} />;
    }

    if (!sliderData || !sliderData.slides.length || !sliderData.isActive) return null;

    return (
        <div
            className={styles.heroSliderContainer}
            style={containerStyle}
        >
            <Swiper
                modules={[Autoplay, EffectFade, Navigation, Pagination]}
                effect={sliderData.settings.effect === 'fade' ? 'fade' : 'slide'}
                fadeEffect={{ crossFade: true }}
                autoplay={sliderData.settings.autoPlay ? {
                    delay: sliderData.settings.delay,
                    disableOnInteraction: false,
                } : false}
                loop={true}
                navigation={sliderData.settings.showArrows ?? true}
                pagination={(sliderData.settings.showBullets && sliderData.slides.length > 1) ? { clickable: true } : false}
                onAutoplayTimeLeft={(s: any, time: number, progress: number) => {
                    const progressBar = document.getElementById(`progress-bar-${sliderData._id}`);
                    if (progressBar) {
                        progressBar.style.setProperty('--progress', `${(1 - progress) * 100}%`);
                    }
                }}
                onSlideChange={(swiper: any) => {
                    const newIndex = swiper.realIndex;
                    setActiveIndex(newIndex);

                    // Track slide change event
                    if (sliderData) {
                        track('hero_slider_slide_change', {
                            slide_index: newIndex,
                            total_slides: sliderData.slides.length,
                            slider_id: sliderData._id,
                            slider_name: sliderData.name,
                            path: typeof window !== 'undefined' ? window.location.pathname : '',
                        });
                    }
                }}
                style={{ width: '100%', height: '100%' }}
            >
                {sliderData.slides.map((slide, index) => (
                    <SwiperSlide key={slide.id}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Background Image */}
                            {slide.background.type === 'image' && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundImage: `url(${slide.background.value})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                />
                            )}

                            {/* Background Color */}
                            {slide.background.type === 'color' && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: slide.background.value,
                                    }}
                                />
                            )}

                            {/* Overlay */}
                            {slide.background.overlay && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: slide.background.overlay,
                                        opacity: slide.background.overlayOpacity ?? 0.5,
                                    }}
                                />
                            )}

                            {/* Layers Container - Constrained to max width and centered */}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                maxWidth: sliderData.settings.width || 1200,
                                margin: '0 auto',
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                            }}>
                                <div style={{
                                    position: 'relative',
                                    width: '100%',
                                    height: '100%',
                                    pointerEvents: 'auto',
                                }}>
                                    {/* Only render root layers (not children of sections) */}
                                    {slide.layers
                                        .filter(layer => !layer.parentId)
                                        .map(layer => (
                                            <Layer
                                                key={layer.id}
                                                layer={layer}
                                                isActive={index === activeIndex}
                                                viewport={viewport}
                                                allLayers={slide.layers}
                                            />
                                        ))}
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}

                {/* Progress Bar */}
                {sliderData.settings.showProgress && (
                    <div
                        id={`progress-bar-${sliderData._id}`}
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            [sliderData.settings.progressPosition === 'top' ? 'top' : 'bottom']: 0,
                            height: '4px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            zIndex: 20,
                            pointerEvents: 'none'
                        }}
                    >
                        <div
                            style={{
                                height: '100%',
                                width: 'var(--progress, 0%)',
                                backgroundColor: sliderData.settings.bulletColor || '#ffffff',
                                transition: 'width 10ms linear'
                            }}
                        />
                    </div>
                )}
            </Swiper>
        </div>
    );
};

export default HeroSliderModule;
