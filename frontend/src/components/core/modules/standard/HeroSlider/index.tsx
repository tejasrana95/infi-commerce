'use client';

import React, { useEffect, useState } from 'react';
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
import styles from './HeroSlider.module.css'; // We might need to create this for specific hacks or just use inline styles
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import * as BiIcons from 'react-icons/bi';
import * as IoIcons from 'react-icons/io5';
import * as LucideIcons from 'lucide-react';

// Helper to render icon by name (duplicated from admin side logic for consistency)
const renderIcon = (iconName: string, fontSize: any) => {
    try {
        const size = parseInt(fontSize) || 24;
        if (iconName.startsWith('Fa')) {
            const Icon = (FaIcons as any)[iconName];
            return Icon ? <Icon size={size} /> : null;
        }
        if (iconName.startsWith('Md')) {
            const Icon = (MdIcons as any)[iconName];
            return Icon ? <Icon size={size} /> : null;
        }
        if (iconName.startsWith('Bi')) {
            const Icon = (BiIcons as any)[iconName];
            return Icon ? <Icon size={size} /> : null;
        }
        if (iconName.startsWith('Io')) {
            const Icon = (IoIcons as any)[iconName];
            return Icon ? <Icon size={size} /> : null;
        }
        // Fallback to Lucide
        const Icon = (LucideIcons as any)[iconName];
        return Icon ? <Icon size={size} /> : null;
    } catch (e) {
        console.warn(`Failed to render icon: ${iconName}`, e);
        return null;
    }
};

// Types (should match backend/admin)
interface HeroSliderLayer {
    id: string;
    type: 'text' | 'image' | 'button' | 'icon';
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
}

// ... existing HeroSliderSlide interface ...

interface HeroSliderSlide {
    id: string;
    background: {
        type: 'image' | 'color' | 'video';
        value: string;
        overlay?: string;
    };
    layers: HeroSliderLayer[];
    settings: {
        duration: number;
    };
}

// ... existing HeroSliderData interface ...

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
    };
    isActive: boolean;
}

const Layer = ({ layer, isActive }: { layer: HeroSliderLayer; isActive: boolean }) => {
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

    // Calculate Position Variables
    const styleVariables = {
        '--layer-x-desktop': `${layer.position.x}%`,
        '--layer-y-desktop': `${layer.position.y}%`,
        '--layer-x-tablet': `${layer.tabletPosition?.x ?? layer.position.x}%`,
        '--layer-y-tablet': `${layer.tabletPosition?.y ?? layer.position.y}%`,
        '--layer-x-mobile': `${layer.mobilePosition?.x ?? layer.position.x}%`,
        '--layer-y-mobile': `${layer.mobilePosition?.y ?? layer.position.y}%`,
    } as React.CSSProperties;

    // Construct extended styles (Border & Shadow)
    const extendedStyle: React.CSSProperties = {};

    // Apply border styling
    if (layer.border && layer.border.style !== 'none') {
        const defaultWidth = layer.border.width ?? 1;
        extendedStyle.borderWidth = `${layer.border.top ?? defaultWidth}px ${layer.border.right ?? defaultWidth}px ${layer.border.bottom ?? defaultWidth}px ${layer.border.left ?? defaultWidth}px`;
        extendedStyle.borderStyle = layer.border.style || 'solid';
        extendedStyle.borderColor = layer.border.color || '#000000';
        if (layer.border.radius !== undefined) {
            extendedStyle.borderRadius = `${layer.border.radius}px`;
        }
    }

    // Apply shadow
    if (layer.shadow) {
        const { x = 0, y = 0, blur = 0, spread = 0, color = 'rgba(0,0,0,0.5)' } = layer.shadow;
        extendedStyle.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
    }

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={initial}
                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }} // Reset transform for position, let CSS handle top/left
                    // Note: Framer motion might fight with CSS top/left if we animate x/y. 
                    // Better to keep simple fade/scale for now, or ensure layout animations don't conflict.
                    exit={{ opacity: 0 }}
                    transition={{
                        duration: layer.animation.duration / 1000,
                        delay: layer.animation.delay / 1000,
                        ease: 'easeOut'
                    }}
                    className={styles.heroLayer}
                    style={{
                        ...styleVariables,
                        ...(({ left, top, right, bottom, position, ...rest }) => rest)(layer.style || {}), // Sanitize user styles to prevent position overrides
                        ...extendedStyle,
                        zIndex: 10,
                        position: 'absolute',
                    }}
                >
                    {layer.type === 'text' && layer.content}
                    {layer.type === 'button' && (
                        <a
                            href={layer.style.href || '#'}
                            style={{
                                textDecoration: 'none',
                                color: 'inherit',
                                display: 'block',
                                width: '100%',
                                height: '100%'
                            }}
                        >
                            {layer.content}
                        </a>
                    )}
                    {layer.type === 'image' && (
                        <img
                            src={layer.content}
                            alt="Layer"
                            style={{
                                width: layer.style.width || 'auto',
                                height: layer.style.height || 'auto',
                                maxWidth: '100%'
                            }}
                        />
                    )}
                    {layer.type === 'icon' && renderIcon(layer.content, layer.style.fontSize)}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const HeroSliderModule: React.FC<ModuleProps> = ({ config }) => {
    const { store } = useStore();
    const [sliderData, setSliderData] = useState<HeroSliderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (store?._id && config.sliderId) {
            setLoading(true);
            fetchHeroSlider(store._id, config.sliderId).then((data: any) => {
                if (data) setSliderData(data as HeroSliderData);
                setLoading(false);
            });
        }
    }, [store?._id, config.sliderId]);

    // CSS Variable calculation
    const getCssVariables = (data: HeroSliderData | null, moduleConfig: any) => {
        const cssVars: any = {};
        // Prioritize fetch data, fallback to module config
        const heightSettings = data?.settings?.height || moduleConfig?.settings?.height || moduleConfig?.height;

        // Check for config override
        if (typeof heightSettings === 'number') {
            cssVars['--hero-height-mobile'] = `${heightSettings}px`;
            cssVars['--hero-height-tablet'] = `${heightSettings}px`;
            cssVars['--hero-height-desktop'] = `${heightSettings}px`;
        } else if (heightSettings) {
            // Responsive object
            cssVars['--hero-height-mobile'] = heightSettings.mobile ? `${heightSettings.mobile}px` : '600px';
            cssVars['--hero-height-tablet'] = heightSettings.tablet ? `${heightSettings.tablet}px` : '600px';
            cssVars['--hero-height-desktop'] = heightSettings.desktop ? `${heightSettings.desktop}px` : '600px';
        } else {
            // Fallback
            cssVars['--hero-height-mobile'] = '600px';
            cssVars['--hero-height-tablet'] = '600px';
            cssVars['--hero-height-desktop'] = '600px';
        }

        return cssVars;
    };

    const containerStyle = getCssVariables(sliderData, config);

    if (loading) {
        return <div className={styles.skeletonContainer} style={containerStyle} />;
    }

    if (!sliderData || !sliderData.slides.length || !sliderData.isActive) return null;

    return (
        <div
            className={styles.heroSliderContainer}
            style={{
                ...containerStyle,
                width: '100%',
                // Removed fixed height prop
            }}
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
                navigation
                pagination={{ clickable: true }}
                onSlideChange={(swiper: any) => setActiveIndex(swiper.realIndex)}
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
                            {/* Background */}
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
                                    }}
                                />
                            )}

                            {/* Layers Container - Relative for positioning */}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                maxWidth: sliderData.settings.width || 1200, // Constrain content if needed, but layers are % based
                                margin: '0 auto',
                                width: '100%'
                            }}>
                                {slide.layers.map(layer => (
                                    <Layer
                                        key={layer.id}
                                        layer={layer}
                                        isActive={index === activeIndex}
                                    />
                                ))}
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default HeroSliderModule;
