'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Button,
    Avatar,
    Rating,
    LinearProgress,
    CircularProgress,
    Skeleton,
    IconButton,
} from '@mui/material';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import CollectionsIcon from '@mui/icons-material/Collections';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import SpaceBarIcon from '@mui/icons-material/SpaceBar';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import CodeIcon from '@mui/icons-material/Code';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import GridViewIcon from '@mui/icons-material/GridView';
import CategoryIcon from '@mui/icons-material/Category';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import SearchIcon from '@mui/icons-material/Search';
import ArticleIcon from '@mui/icons-material/Article';
import RecommendIcon from '@mui/icons-material/Recommend';
import HistoryIcon from '@mui/icons-material/History';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ExtensionIcon from '@mui/icons-material/Extension';
import StarIcon from '@mui/icons-material/Star';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DiscountIcon from '@mui/icons-material/Discount';
import CampaignIcon from '@mui/icons-material/Campaign';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LockIcon from '@mui/icons-material/Lock';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LayersIcon from '@mui/icons-material/Layers';
import SmartButtonIcon from '@mui/icons-material/SmartButton';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import TableChartIcon from '@mui/icons-material/TableChart';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import StorageIcon from '@mui/icons-material/Storage';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

import { LayoutModule } from '@/types';
import { getModuleDefinition } from './types';
import api from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import DynamicIcon from '@/components/atoms/DynamicIcon';

const iconMap: Record<string, React.ElementType> = {
    ViewCarousel: ViewCarouselIcon,
    TextFields: TextFieldsIcon,
    Image: ImageIcon,
    Collections: CollectionsIcon,
    PlayCircle: PlayCircleIcon,
    SpaceBar: SpaceBarIcon,
    HorizontalRule: HorizontalRuleIcon,
    Code: CodeIcon,
    FormatQuote: FormatQuoteIcon,
    BusinessCenter: BusinessCenterIcon,
    GridView: GridViewIcon,
    Category: CategoryIcon,
    Inventory2: Inventory2Icon,
    ShoppingBag: ShoppingBagIcon,
    Search: SearchIcon,
    Article: ArticleIcon,
    Recommend: RecommendIcon,
    History: HistoryIcon,
    FormatListBulleted: FormatListBulletedIcon,
    Extension: ExtensionIcon,
    SmartButton: SmartButtonIcon,
    ViewStream: ViewStreamIcon,
    ViewModule: ViewModuleIcon,
    MonetizationOn: MonetizationOnIcon,
    TableChart: TableChartIcon,
};

// Global in-memory cache for API real data preview
const previewDataCache: Record<string, any> = {};

// Helper to safely extract string text from string, number, or object fields
const extractString = (val: any, fallback: string = ''): string => {
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (val && typeof val === 'object') {
        if (typeof val.name === 'string') return val.name;
        if (typeof val.title === 'string') return val.title;
        if (typeof val.label === 'string') return val.label;
        if (typeof val.text === 'string') return val.text;
    }
    return fallback;
};

interface ModuleRendererProps {
    module: LayoutModule;
    isSelected: boolean;
    onClick: () => void;
    storeId?: string;
}

export default function ModuleRenderer({ module, isSelected, onClick, storeId }: ModuleRendererProps) {
    const definition = getModuleDefinition(module.type);
    const IconComponent = definition ? iconMap[definition.icon] || ImageIcon : ImageIcon;
    const { formatPrice } = useCurrency();

    // Real API Data State
    const [realData, setRealData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [fetchError, setFetchError] = useState<boolean>(false);

    const cfg = module.config || {};

    // Fetch Real Data from API based on module type and configuration
    useEffect(() => {
        let isMounted = true;
        const cacheKey = `${module.type}_${module.id}_${JSON.stringify(cfg)}_${storeId || ''}`;

        if (previewDataCache[cacheKey]) {
            setRealData(previewDataCache[cacheKey]);
            return;
        }

        const fetchRealData = async () => {
            try {
                setLoading(true);
                setFetchError(false);

                let endpoint = '';
                const params: Record<string, any> = {};
                if (storeId) params.storeId = storeId;

                switch (module.type) {
                    case 'product-grid':
                    case 'product-carousel':
                    case 'related-products':
                    case 'recently-viewed':
                    case 'personalized-products':
                        endpoint = '/products';
                        params.limit = cfg.limit || 4;
                        if (cfg.categoryIds && cfg.categoryIds.length > 0) {
                            params.categoryIds = cfg.categoryIds.join(',');
                        }
                        if (cfg.productIds && cfg.productIds.length > 0) {
                            params.ids = cfg.productIds.join(',');
                        }
                        break;

                    case 'category-showcase':
                        endpoint = '/categories';
                        params.limit = cfg.limit || 6;
                        break;

                    case 'banner':
                    case 'hero-banner':
                        if (cfg.bannerId) {
                            endpoint = `/hero-banners/${cfg.bannerId}`;
                        } else {
                            endpoint = '/hero-banners';
                        }
                        break;

                    case 'banner-slider':
                    case 'hero-slider':
                        if (cfg.sliderId) {
                            endpoint = `/hero-sliders/${cfg.sliderId}`;
                        } else {
                            endpoint = '/hero-sliders';
                        }
                        break;

                    case 'brand-logos':
                        if (cfg.showcaseId) {
                            endpoint = `/brand-showcases/${cfg.showcaseId}`;
                        } else {
                            endpoint = '/brands';
                        }
                        break;

                    case 'testimonials':
                        endpoint = '/testimonials';
                        break;

                    case 'blog-grid':
                    case 'blog-listing':
                    case 'blog-hero':
                    case 'recent-posts':
                    case 'popular-posts':
                    case 'related-blogs':
                        endpoint = '/blog/posts';
                        params.limit = cfg.numberOfPosts || cfg.limit || 4;
                        break;

                    case 'content-card-grid':
                        endpoint = '/content-cards/cards';
                        params.limit = cfg.limit || 6;
                        break;

                    case 'form':
                        if (cfg.formId) {
                            endpoint = `/forms/${cfg.formId}`;
                        }
                        break;

                    default:
                        break;
                }

                if (!endpoint) {
                    setLoading(false);
                    return;
                }

                const res = await api.get(endpoint, { params });
                let payload = res.data;

                // Handle nested structure normalization
                if (payload && payload.data) payload = payload.data;
                if (payload && payload.products) payload = payload.products;
                if (payload && payload.categories) payload = payload.categories;
                if (payload && payload.posts) payload = payload.posts;
                if (payload && payload.cards) payload = payload.cards;

                if (isMounted && payload) {
                    previewDataCache[cacheKey] = payload;
                    setRealData(payload);
                }
            } catch (err) {
                console.warn(`[ModuleRenderer] Could not fetch real data for ${module.type}:`, err);
                if (isMounted) setFetchError(true);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchRealData();

        return () => {
            isMounted = false;
        };
    }, [module.type, module.id, JSON.stringify(cfg), storeId]);

    // Render real or formatted preview
    const renderPreview = () => {
        switch (module.type) {
            // ======================================================================
            // HERO & BANNERS (REAL DATA)
            // ======================================================================
            case 'banner':
            case 'hero-banner':
            case 'page-hero': {
                const singleBanner = Array.isArray(realData) ? realData[0] : realData;
                const title = extractString(singleBanner?.title || cfg.title || cfg.heading, module.type === 'page-hero' ? 'Page Header Title' : 'Elevate Your Shopping Experience');
                const subtitle = extractString(singleBanner?.subtitle || cfg.subtitle || cfg.subheading, 'Discover curated collections with premium quality and exclusive deals.');
                const bgImage = extractString(singleBanner?.image || singleBanner?.imageUrl || cfg.image || cfg.backgroundImage || cfg.src, '');
                const buttonText = extractString(singleBanner?.buttonText || cfg.buttonText || cfg.ctaText, 'Shop Collection');

                return (
                    <Box
                        sx={{
                            position: 'relative',
                            minHeight: 140,
                            borderRadius: 1.5,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            p: 2.5,
                            background: bgImage
                                ? `linear-gradient(rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.75)), url(${bgImage}) center/cover no-repeat`
                                : 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                            color: '#FFFFFF',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Chip
                                label={module.type === 'hero-banner' ? 'HERO PROMO' : module.type === 'page-hero' ? 'PAGE HEADER' : 'FEATURED BANNER'}
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(59, 130, 246, 0.3)',
                                    color: '#93C5FD',
                                    fontWeight: 700,
                                    fontSize: '0.65rem',
                                    letterSpacing: 1,
                                    height: 20,
                                }}
                            />
                            {singleBanner && (
                                <Chip
                                    icon={<StorageIcon sx={{ fontSize: '0.75rem !important', color: '#10B981 !important' }} />}
                                    label="LIVE API DATA"
                                    size="small"
                                    sx={{ bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7', fontSize: '0.6rem', fontWeight: 800, height: 18 }}
                                />
                            )}
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2, mb: 0.5 }}>
                            {title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.75rem', mb: 1.5, maxWidth: '85%' }}>
                            {subtitle}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                size="small"
                                variant="contained"
                                endIcon={<ArrowForwardIcon sx={{ fontSize: '0.8rem' }} />}
                                sx={{
                                    bgcolor: '#3B82F6',
                                    '&:hover': { bgcolor: '#2563EB' },
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    px: 2,
                                    py: 0.5,
                                    borderRadius: 1,
                                }}
                            >
                                {buttonText}
                            </Button>
                        </Box>
                    </Box>
                );
            }

            case 'banner-slider':
            case 'hero-slider': {
                const singleSlider = Array.isArray(realData) ? realData[0] : realData;
                const slidesList = singleSlider?.slides || cfg.slides || [];
                const activeSlide = slidesList[0] || {};
                const title = extractString(activeSlide.title || singleSlider?.title || cfg.title, 'Spring/Summer Collection 2026');
                const subtitle = extractString(activeSlide.subtitle, 'Up to 50% Off • Free Express Delivery');
                const bgImage = extractString(activeSlide.image || activeSlide.bgImage || singleSlider?.bgImage, '');

                return (
                    <Box
                        sx={{
                            position: 'relative',
                            minHeight: 150,
                            borderRadius: 1.5,
                            overflow: 'hidden',
                            background: bgImage
                                ? `linear-gradient(rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.8)), url(${bgImage}) center/cover no-repeat`
                                : 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
                            color: '#FFFFFF',
                            p: 2.5,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip
                                icon={<ViewCarouselIcon sx={{ fontSize: '0.8rem !important', color: '#A78BFA !important' }} />}
                                label="SLIDER CAROUSEL"
                                size="small"
                                sx={{ bgcolor: 'rgba(167, 139, 250, 0.2)', color: '#C4B5FD', fontSize: '0.65rem', fontWeight: 700, height: 20 }}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {singleSlider && (
                                    <Chip label="LIVE API DATA" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7', fontSize: '0.55rem', fontWeight: 800, height: 16 }} />
                                )}
                                <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem' }}>
                                    Slide 1 of {slidesList.length || 3}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ my: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '1rem', color: '#F8FAFC' }}>
                                {title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#CBD5E1', fontSize: '0.75rem', display: 'block', mt: 0.25 }}>
                                {subtitle}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button size="small" variant="contained" sx={{ bgcolor: '#8B5CF6', fontSize: '0.7rem', fontWeight: 700, textTransform: 'none', height: 26, px: 2 }}>
                                {extractString(activeSlide.buttonText, 'Explore Slide')}
                            </Button>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {(slidesList.length > 0 ? slidesList : [0, 1, 2]).slice(0, 5).map((_: any, i: number) => (
                                    <Box key={i} sx={{ width: i === 0 ? 16 : 6, height: 6, borderRadius: 3, bgcolor: i === 0 ? '#8B5CF6' : 'rgba(255,255,255,0.3)' }} />
                                ))}
                            </Box>
                        </Box>
                    </Box>
                );
            }

            case 'strip-banner': {
                const content = extractString(cfg.content, `Special Offer: Free shipping on orders over ${formatPrice(50, undefined, storeId)}! Use code INFI50`);
                return (
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            background: 'linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1.5,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DiscountIcon sx={{ fontSize: '1.2rem', color: '#FDE047' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                                {content}
                            </Typography>
                        </Box>
                        <Chip
                            label={extractString(cfg.ctaText, 'Claim Now')}
                            size="small"
                            clickable
                            sx={{ bgcolor: '#FFFFFF', color: '#1D4ED8', fontWeight: 800, fontSize: '0.65rem', height: 22 }}
                        />
                    </Box>
                );
            }

            // ======================================================================
            // REDESIGNED ELEGANT PRODUCT CARDS & CAROUSELS
            // ======================================================================
            case 'product-grid':
            case 'product-carousel':
            case 'related-products':
            case 'recently-viewed':
            case 'personalized-products': {
                const title = extractString(cfg.title, (
                    module.type === 'related-products' ? 'Related Products' :
                    module.type === 'recently-viewed' ? 'Recently Viewed' :
                    module.type === 'personalized-products' ? 'Recommended For You' :
                    'Featured Products'
                ));

                const productsList = Array.isArray(realData) ? realData : (realData?.products || []);
                const hasRealProducts = productsList && productsList.length > 0;
                const displayCount = Math.min(cfg.limit || 4, hasRealProducts ? productsList.length : 4);
                const configuredCols = cfg.columns || 4;

                return (
                    <Box sx={{ p: 2, bgcolor: '#FAFAFA', borderRadius: 2, border: '1px solid #F1F5F9' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ShoppingBagIcon sx={{ fontSize: '1.1rem', color: '#2563EB' }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', letterSpacing: -0.2 }}>
                                    {title}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                {hasRealProducts && (
                                    <Chip label="LIVE PRODUCTS API" size="small" sx={{ fontSize: '0.55rem', height: 18, bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800 }} />
                                )}
                                <Chip label={`${module.type === 'product-carousel' ? 'Carousel' : 'Grid'} (${configuredCols} cols)`} size="small" sx={{ fontSize: '0.6rem', height: 18, bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 700 }} />
                            </Box>
                        </Box>

                        {loading ? (
                            <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(160px, 1fr))`, gap: 1.5 }}>
                                {[1, 2, 3, 4].slice(0, configuredCols).map((i) => (
                                    <Skeleton key={i} variant="rounded" height={230} sx={{ borderRadius: 2 }} />
                                ))}
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(auto-fill, minmax(160px, 1fr))`,
                                    gap: 1.5,
                                    maxWidth: '100%',
                                }}
                            >
                                {(hasRealProducts ? productsList.slice(0, displayCount) : [1, 2, 3, 4].slice(0, displayCount)).map((item: any, idx: number) => {
                                    const isReal = typeof item === 'object';
                                    const pName = isReal ? extractString(item.name || item.title, `Product #${idx + 1}`) : `Product #${item}`;
                                    
                                    // Extract category safely as string (never render object)
                                    const pCategory = isReal
                                        ? extractString(item.category, extractString(item.brand, 'COLLECTION'))
                                        : 'MARBLE MURTI';
                                    
                                    const priceVal = isReal ? item.price : 89.99;
                                    const compareVal = isReal ? (item.compareAtPrice || item.originalPrice) : null;
                                    const hasDiscount = compareVal && compareVal > priceVal;
                                    const discountPercent = hasDiscount ? Math.round(((compareVal - priceVal) / compareVal) * 100) : 0;

                                    const pPrice = isReal
                                        ? formatPrice(priceVal ?? 0, item.currency || item.currencyCode, storeId)
                                        : formatPrice(89.99, undefined, storeId);

                                    const pComparePrice = hasDiscount
                                        ? formatPrice(compareVal, item.currency || item.currencyCode, storeId)
                                        : null;

                                    const pImg = isReal ? extractString(item.images?.[0] || item.featuredImage || item.image, '') : null;
                                    const pRating = isReal ? (item.averageRating || item.rating || 4.9) : 4.8;
                                    const pReviews = isReal ? (item.reviewCount || item.numReviews || 24) : 12;

                                    return (
                                        <Paper
                                            key={isReal ? item._id || idx : item}
                                            elevation={0}
                                            sx={{
                                                bgcolor: '#FFFFFF',
                                                border: '1px solid #E2E8F0',
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                                '&:hover': {
                                                    borderColor: '#93C5FD',
                                                    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.12)',
                                                    transform: 'translateY(-2px)',
                                                },
                                            }}
                                        >
                                            {/* Image Box */}
                                            <Box
                                                sx={{
                                                    position: 'relative',
                                                    height: 130,
                                                    width: '100%',
                                                    bgcolor: '#F8FAFC',
                                                    p: 1.25,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden',
                                                    borderBottom: '1px solid #F1F5F9',
                                                }}
                                            >
                                                {pImg ? (
                                                    <Box
                                                        component="img"
                                                        src={pImg}
                                                        alt={pName}
                                                        sx={{
                                                            maxWidth: '100%',
                                                            maxHeight: '100%',
                                                            width: 'auto',
                                                            height: 'auto',
                                                            objectFit: 'contain',
                                                            transition: 'transform 0.3s ease',
                                                            '&:hover': { transform: 'scale(1.06)' },
                                                        }}
                                                    />
                                                ) : (
                                                    <ShoppingBagIcon sx={{ color: '#CBD5E1', fontSize: '2.2rem' }} />
                                                )}

                                                {/* Sale / Discount Pill */}
                                                {hasDiscount ? (
                                                    <Chip
                                                        label={`${discountPercent}% OFF`}
                                                        size="small"
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 6,
                                                            left: 6,
                                                            height: 18,
                                                            fontSize: '0.55rem',
                                                            fontWeight: 800,
                                                            bgcolor: '#EF4444',
                                                            color: '#FFFFFF',
                                                            borderRadius: 1,
                                                            '& .MuiChip-label': { px: 0.6 },
                                                        }}
                                                    />
                                                ) : isReal && item.isOnSale ? (
                                                    <Chip
                                                        label="SALE"
                                                        size="small"
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 6,
                                                            left: 6,
                                                            height: 18,
                                                            fontSize: '0.55rem',
                                                            fontWeight: 800,
                                                            bgcolor: '#EF4444',
                                                            color: '#FFFFFF',
                                                            borderRadius: 1,
                                                            '& .MuiChip-label': { px: 0.6 },
                                                        }}
                                                    />
                                                ) : null}

                                                {/* Quick Wishlist Icon */}
                                                <IconButton
                                                    size="small"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 6,
                                                        right: 6,
                                                        width: 24,
                                                        height: 24,
                                                        bgcolor: 'rgba(255, 255, 255, 0.85)',
                                                        backdropFilter: 'blur(4px)',
                                                        color: '#64748B',
                                                        '&:hover': { color: '#EF4444', bgcolor: '#FFFFFF' },
                                                    }}
                                                >
                                                    <FavoriteBorderIcon sx={{ fontSize: '0.85rem' }} />
                                                </IconButton>
                                            </Box>

                                            {/* Card Body */}
                                            <Box sx={{ p: 1.25, display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                                                <Box>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            fontWeight: 800,
                                                            fontSize: '0.58rem',
                                                            color: '#64748B',
                                                            letterSpacing: 0.5,
                                                            textTransform: 'uppercase',
                                                            display: 'block',
                                                            mb: 0.25,
                                                        }}
                                                    >
                                                        {pCategory}
                                                    </Typography>

                                                    <Typography
                                                        variant="body2"
                                                        title={pName}
                                                        sx={{
                                                            fontWeight: 700,
                                                            fontSize: '0.76rem',
                                                            color: '#0F172A',
                                                            lineHeight: 1.3,
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            minHeight: '2.5em',
                                                            mb: 0.75,
                                                        }}
                                                    >
                                                        {pName}
                                                    </Typography>
                                                </Box>

                                                <Box>
                                                    {/* Rating Row */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#FEF3C7', px: 0.5, py: 0.1, borderRadius: 0.5 }}>
                                                            <StarIcon sx={{ fontSize: '0.7rem', color: '#D97706', mr: 0.25 }} />
                                                            <Typography variant="caption" sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#92400E' }}>
                                                                {pRating}
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#94A3B8' }}>
                                                            ({pReviews})
                                                        </Typography>
                                                    </Box>

                                                    {/* Price & Add to Cart Row */}
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                                        <Box>
                                                            {pComparePrice && (
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        fontSize: '0.62rem',
                                                                        color: '#94A3B8',
                                                                        textDecoration: 'line-through',
                                                                        display: 'block',
                                                                        lineHeight: 1,
                                                                        mb: 0.25,
                                                                    }}
                                                                >
                                                                    {pComparePrice}
                                                                </Typography>
                                                            )}
                                                            <Typography
                                                                variant="subtitle2"
                                                                sx={{
                                                                    fontWeight: 900,
                                                                    fontSize: '0.85rem',
                                                                    color: '#1D4ED8',
                                                                    lineHeight: 1,
                                                                }}
                                                            >
                                                                {pPrice}
                                                            </Typography>
                                                        </Box>

                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            sx={{
                                                                minWidth: 26,
                                                                width: 26,
                                                                height: 26,
                                                                p: 0,
                                                                borderRadius: 1,
                                                                bgcolor: '#EFF6FF',
                                                                color: '#2563EB',
                                                                boxShadow: 'none',
                                                                '&:hover': { bgcolor: '#2563EB', color: '#FFFFFF', boxShadow: '0 2px 6px rgba(37,99,235,0.25)' },
                                                            }}
                                                        >
                                                            <ShoppingCartIcon sx={{ fontSize: '0.85rem' }} />
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Paper>
                                    );
                                })}
                            </Box>
                        )}
                    </Box>
                );
            }

            case 'category-showcase': {
                const title = extractString(cfg.title, 'Shop By Category');
                const categoriesList = Array.isArray(realData) ? realData : (realData?.categories || []);
                const hasRealCategories = categoriesList && categoriesList.length > 0;

                return (
                    <Box sx={{ p: 1.5, bgcolor: '#FAFAFA', borderRadius: 1.5, border: '1px solid #F3F4F6' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1F2937' }}>
                                {title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {hasRealCategories && (
                                    <Chip label="LIVE CATEGORIES" size="small" sx={{ fontSize: '0.55rem', height: 16, bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800 }} />
                                )}
                                <Chip label="Categories" size="small" sx={{ fontSize: '0.6rem', height: 18, bgcolor: '#DCFCE7', color: '#15803D' }} />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                            {(hasRealCategories ? categoriesList.slice(0, 3) : ['Electronics', 'Fashion', 'Home & Living']).map((cat: any, idx: number) => {
                                const isReal = typeof cat === 'object';
                                const cName = isReal ? extractString(cat.title || cat.name || cat, 'Category') : String(cat);
                                const cImg = isReal ? extractString(cat.image, '') : null;

                                return (
                                    <Box key={isReal ? cat._id || idx : cat} sx={{ p: 1.25, borderRadius: 1, bgcolor: idx === 0 ? '#EFF6FF' : idx === 1 ? '#F0FDF4' : '#FEF3C7', border: '1px solid #E5E7EB', textAlign: 'center', overflow: 'hidden' }}>
                                        {cImg ? (
                                            <Box component="img" src={cImg} alt={cName} sx={{ width: '100%', height: 40, objectFit: 'contain', borderRadius: 0.75, mb: 0.5 }} />
                                        ) : (
                                            <CategoryIcon sx={{ fontSize: '1.2rem', color: idx === 0 ? '#3B82F6' : idx === 1 ? '#22C55E' : '#F59E0B', mb: 0.5 }} />
                                        )}
                                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', display: 'block', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {cName}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#6B7280' }}>
                                            {isReal ? (cat.productCount ? `${cat.productCount} Items` : 'Active Category') : '120+ Items'}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                );
            }

            // ======================================================================
            // CONTENT, TYPOGRAPHY & MEDIA
            // ======================================================================
            case 'heading': {
                const headingText = extractString(cfg.heading, 'Section Title Heading');
                const subheadingText = extractString(cfg.subheading, '');
                const align = cfg.align || 'center';

                return (
                    <Box sx={{ py: 1.5, px: 2, textAlign: align, bgcolor: '#FFFFFF', borderRadius: 1.5, border: '1px dashed #E5E7EB' }}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: cfg.styles?.fontWeight || 800,
                                color: cfg.styles?.color || '#111827',
                                fontSize: '1.1rem',
                                letterSpacing: -0.3,
                            }}
                        >
                            {headingText}
                        </Typography>
                        {subheadingText && (
                            <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.75rem', display: 'block', mt: 0.25 }}>
                                {subheadingText}
                            </Typography>
                        )}
                    </Box>
                );
            }

            case 'text-block': {
                const content = extractString(cfg.content, 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Experience premium product design and effortless shopping.');
                return (
                    <Box sx={{ p: 1.5, bgcolor: '#FAFAFA', borderRadius: 1.5, border: '1px solid #E5E7EB' }}>
                        <Typography
                            variant="body2"
                            sx={{ fontSize: '0.75rem', color: '#374151', lineHeight: 1.5 }}
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    </Box>
                );
            }

            case 'cta-button': {
                const text = extractString(cfg.text, 'Call to Action Button');
                const align = cfg.alignment || 'center';
                return (
                    <Box sx={{ py: 1.5, display: 'flex', justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }}>
                        <Button
                            variant={cfg.variant === 'outlined' ? 'outlined' : 'contained'}
                            sx={{
                                bgcolor: cfg.variant === 'outlined' ? 'transparent' : (cfg.buttonColor || '#3B82F6'),
                                color: cfg.variant === 'outlined' ? (cfg.buttonColor || '#3B82F6') : '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                px: 3,
                                py: 0.75,
                                borderRadius: 1.5,
                                textTransform: 'none',
                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
                            }}
                        >
                            {text}
                        </Button>
                    </Box>
                );
            }

            case 'image': {
                const src = extractString(cfg.src, '');
                const alt = extractString(cfg.alt, 'Banner image preview');
                return src ? (
                    <Box sx={{ borderRadius: 1.5, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                        <Box component="img" src={src} alt={alt} sx={{ width: '100%', height: 100, objectFit: 'cover' }} />
                    </Box>
                ) : (
                    <Box sx={{ height: 90, bgcolor: '#F3F4F6', borderRadius: 1.5, border: '1px dashed #D1D5DB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                        <ImageIcon sx={{ fontSize: 28, mb: 0.5 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Image Component (No source set)</Typography>
                    </Box>
                );
            }

            case 'image-gallery': {
                return (
                    <Box sx={{ p: 1.5, bgcolor: '#FAFAFA', borderRadius: 1.5, border: '1px solid #F3F4F6' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', fontSize: '0.75rem' }}>Image Gallery ({cfg.images?.length || 4} photos)</Typography>
                            <Chip label={`${cfg.columns || 3} Columns`} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${cfg.columns || 3}, 1fr)`, gap: 0.75 }}>
                            {[1, 2, 3].map((i) => (
                                <Box key={i} sx={{ height: 50, bgcolor: '#E5E7EB', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ImageIcon sx={{ color: '#9CA3AF', fontSize: 18 }} />
                                </Box>
                            ))}
                        </Box>
                    </Box>
                );
            }

            case 'video': {
                return (
                    <Box sx={{ position: 'relative', height: 100, bgcolor: '#0F172A', borderRadius: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', p: 2 }}>
                        <PlayCircleIcon sx={{ fontSize: 36, color: '#EF4444', mb: 0.5 }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                            {extractString(cfg.title, 'Video Player Preview')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem' }}>
                            Source: {extractString(cfg.source, 'YouTube')} • {extractString(cfg.aspectRatio, '16:9')}
                        </Typography>
                    </Box>
                );
            }

            case 'spacer': {
                const height = cfg.height || 40;
                return (
                    <Box sx={{ height: Math.min(height, 50), border: '1px dashed #CBD5E1', borderRadius: 1, bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.65rem' }}>
                            Spacer: {height}px
                        </Typography>
                    </Box>
                );
            }

            case 'divider': {
                return (
                    <Box sx={{ py: 1.5, display: 'flex', justifyContent: 'center' }}>
                        <Box sx={{ width: cfg.width || '100%', borderTop: `${cfg.thickness || 1}px ${cfg.style || 'solid'} ${cfg.color || '#E2E8F0'}` }} />
                    </Box>
                );
            }

            case 'html': {
                return (
                    <Box sx={{ p: 1.5, bgcolor: '#1E293B', color: '#38BDF8', borderRadius: 1.5, fontFamily: 'monospace' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                            <CodeIcon sx={{ fontSize: '0.9rem', color: '#38BDF8' }} />
                            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#F1F5F9' }}>Custom HTML Block</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', display: 'block', color: '#94A3B8' }}>
                            {cfg.content ? `${extractString(cfg.content).substring(0, 60)}...` : '<div>Custom code widget</div>'}
                        </Typography>
                    </Box>
                );
            }

            // ======================================================================
            // FEATURES, TESTIMONIALS & BRANDS (REAL API DATA)
            // ======================================================================
            case 'testimonials': {
                const testimonialsList = Array.isArray(realData) ? realData : (realData?.testimonials || []);
                const hasRealTestimonials = testimonialsList && testimonialsList.length > 0;
                const firstTestimonial = hasRealTestimonials ? testimonialsList[0] : null;

                const authorName = extractString(firstTestimonial?.name || firstTestimonial?.author, 'Sophia C.');
                const quoteText = extractString(firstTestimonial?.content || firstTestimonial?.text || firstTestimonial?.quote, 'Exceptional quality and lightning fast delivery. Highly recommended store!');
                const roleText = extractString(firstTestimonial?.role, 'Verified Customer');
                const ratingVal = firstTestimonial?.rating || 5;

                return (
                    <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Rating value={ratingVal} readOnly size="small" sx={{ fontSize: '0.8rem' }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#0F172A' }}>Testimonials</Typography>
                            </Box>
                            {hasRealTestimonials && (
                                <Chip label="LIVE TESTIMONIALS API" size="small" sx={{ fontSize: '0.55rem', height: 16, bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800 }} />
                            )}
                        </Box>
                        <Paper elevation={0} sx={{ p: 1.25, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ fontStyle: 'italic', fontSize: '0.7rem', color: '#334155', display: 'block', mb: 0.75 }}>
                                "{quoteText}"
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar src={extractString(firstTestimonial?.avatar || firstTestimonial?.image, '')} sx={{ width: 20, height: 20, bgcolor: '#3B82F6', fontSize: '0.6rem' }}>
                                    {authorName.substring(0, 2).toUpperCase()}
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', display: 'block', lineHeight: 1 }}>{authorName}</Typography>
                                    <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#64748B' }}>
                                        {roleText}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                );
            }

            case 'brand-logos': {
                const brandsList = Array.isArray(realData) ? realData : (realData?.brands || realData?.items || []);
                const hasRealBrands = brandsList && brandsList.length > 0;

                return (
                    <Box sx={{ p: 1.5, bgcolor: '#FAFAFA', borderRadius: 1.5, border: '1px solid #E5E7EB' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B7280', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                Featured Brands
                            </Typography>
                            {hasRealBrands && (
                                <Chip label="LIVE BRANDS API" size="small" sx={{ fontSize: '0.55rem', height: 16, bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800 }} />
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                            {(hasRealBrands ? brandsList.slice(0, 5) : [{ name: 'NIKE' }, { name: 'ADIDAS' }, { name: 'PUMA' }, { name: 'ZARA' }]).map((b: any, idx: number) => {
                                const bName = typeof b === 'object' ? extractString(b.name || b.title || b, 'Brand') : String(b);
                                return (
                                    <Chip key={typeof b === 'object' ? b._id || idx : b} label={bName} size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.65rem', color: '#4B5563', borderColor: '#D1D5DB' }} />
                                );
                            })}
                        </Box>
                    </Box>
                );
            }

            case 'pricing-table': {
                return (
                    <Box sx={{ p: 1.5, bgcolor: '#FAFAFA', borderRadius: 1.5, border: '1px solid #E5E7EB' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#111827', mb: 1, textAlign: 'center' }}>
                            Pricing Plans Preview
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75 }}>
                            {[
                                { name: 'Starter', price: formatPrice(29, undefined, storeId) },
                                { name: 'Pro', price: formatPrice(79, undefined, storeId), popular: true },
                                { name: 'Enterprise', price: formatPrice(199, undefined, storeId) },
                            ].map((plan) => (
                                <Paper key={plan.name} elevation={0} sx={{ p: 1, border: plan.popular ? '2px solid #3B82F6' : '1px solid #E5E7EB', borderRadius: 1, bgcolor: plan.popular ? '#EFF6FF' : '#FFFFFF', textAlign: 'center' }}>
                                    {plan.popular && <Chip label="POPULAR" size="small" sx={{ height: 14, fontSize: '0.5rem', fontWeight: 800, bgcolor: '#3B82F6', color: '#FFF', mb: 0.5 }} />}
                                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', display: 'block' }}>{plan.name}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#1D4ED8' }}>{plan.price}</Typography>
                                </Paper>
                            ))}
                        </Box>
                    </Box>
                );
            }

            case 'accordion': {
                return (
                    <Box sx={{ p: 1.5, bgcolor: '#FAFAFA', borderRadius: 1.5, border: '1px solid #E5E7EB' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', fontSize: '0.75rem', display: 'block', mb: 1 }}>
                            {extractString(cfg.title, 'Frequently Asked Questions')}
                        </Typography>
                        {[1, 2].map((i) => (
                            <Box key={i} sx={{ p: 1, mb: 0.5, bgcolor: '#FFFFFF', borderRadius: 1, border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#1F2937' }}>
                                    {i === 1 ? 'What is your shipping policy?' : 'How do I track my order?'}
                                </Typography>
                                <ChevronRightIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
                            </Box>
                        ))}
                    </Box>
                );
            }

            case 'icon-box':
            case 'icon-group':
            case 'icon-list': {
                const rawItems = cfg.items && Array.isArray(cfg.items) && cfg.items.length > 0 ? cfg.items : [
                    { title: 'Free Delivery', description: 'On all orders over $50', icon: 'FaTruck' },
                    { title: 'Secure Payment', description: '100% encrypted & safe', icon: 'FaShieldAlt' },
                    { title: '24/7 Support', description: 'Dedicated customer care', icon: 'FaHeadset' },
                ];

                const hasConfiguredItems = Boolean(cfg.items && Array.isArray(cfg.items) && cfg.items.length > 0);
                const layout = cfg.layout || 'icon-top';
                const isHorizontal = layout === 'icon-left' || layout === 'icon-right' || module.type === 'icon-list';

                // Cap preview icon background size to avoid exploding cards in designer canvas
                const rawBgSize = cfg.styles?.iconBgSize;
                const iconBgBoxSize = rawBgSize ? Math.min(Number(rawBgSize), isHorizontal ? 44 : 52) : 40;
                
                const iconSize = cfg.styles?.iconSize ? Math.min(Number(cfg.styles.iconSize), 26) : 22;
                const cardRadius = Math.min(cfg.styles?.borderRadius ?? 12, 16);
                const iconBgRadius = Math.min(cfg.styles?.iconBgRadius ?? 8, 24);

                return (
                    <Box sx={{ p: 2, bgcolor: '#FAFAFA', borderRadius: 2, border: '1px solid #F1F5F9' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {extractString(cfg.title, module.type === 'icon-list' ? 'Feature Icon List' : 'Feature Icon Boxes')} ({rawItems.length} items)
                            </Typography>
                            {hasConfiguredItems && (
                                <Chip label="REAL CONFIG DATA" size="small" sx={{ fontSize: '0.55rem', height: 16, bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800 }} />
                            )}
                        </Box>

                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(auto-fill, minmax(${isHorizontal ? 220 : 150}px, 1fr))`,
                                gap: 1.5,
                            }}
                        >
                            {rawItems.map((item: any, idx: number) => {
                                const itemTitle = extractString(item.title, `Feature #${idx + 1}`);
                                const itemDesc = extractString(item.description, '');
                                const itemIcon = extractString(item.icon, '');
                                const itemImg = extractString(item.image, '');
                                const itemCta = extractString(item.ctaText, '');

                                return (
                                    <Paper
                                        key={item.id || idx}
                                        elevation={0}
                                        sx={{
                                            p: 1.5,
                                            bgcolor: cfg.styles?.bgColor || '#FFFFFF',
                                            border: '1px solid',
                                            borderColor: cfg.styles?.borderColor || '#E2E8F0',
                                            borderRadius: `${cardRadius}px`,
                                            display: 'flex',
                                            flexDirection: isHorizontal ? 'row' : 'column',
                                            alignItems: isHorizontal ? 'flex-start' : (cfg.textAlign === 'left' ? 'flex-start' : 'center'),
                                            gap: 1.25,
                                            textAlign: cfg.textAlign || (isHorizontal ? 'left' : 'center'),
                                            overflow: 'hidden',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                borderColor: '#93C5FD',
                                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)',
                                            },
                                        }}
                                    >
                                        {/* Icon or Custom Image Box */}
                                        <Box
                                            sx={{
                                                width: iconBgBoxSize,
                                                height: iconBgBoxSize,
                                                minWidth: iconBgBoxSize,
                                                minHeight: iconBgBoxSize,
                                                borderRadius: `${iconBgRadius}px`,
                                                bgcolor: cfg.styles?.iconBgColor || '#FEF3C7',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: cfg.styles?.iconColor || '#D97706',
                                                p: 0.5,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {itemImg ? (
                                                <Box component="img" src={itemImg} alt={itemTitle} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                            ) : itemIcon ? (
                                                <DynamicIcon name={itemIcon} size={iconSize} color={cfg.styles?.iconColor || '#D97706'} />
                                            ) : (
                                                <StarIcon sx={{ fontSize: iconSize, color: cfg.styles?.iconColor || '#D97706' }} />
                                            )}
                                        </Box>

                                        {/* Content Details */}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography
                                                variant="subtitle2"
                                                sx={{
                                                    fontWeight: cfg.styles?.titleFontWeight || 700,
                                                    fontSize: cfg.styles?.titleFontSize ? `${Math.min(Number(cfg.styles.titleFontSize), 15)}px` : '0.8rem',
                                                    color: cfg.styles?.titleColor || '#0F172A',
                                                    lineHeight: 1.3,
                                                    mb: itemDesc ? 0.25 : 0,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {itemTitle}
                                            </Typography>

                                            {itemDesc && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontSize: cfg.styles?.descFontSize ? `${Math.min(Number(cfg.styles.descFontSize), 13)}px` : '0.68rem',
                                                        color: cfg.styles?.descColor || '#64748B',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        lineHeight: 1.35,
                                                    }}
                                                >
                                                    {itemDesc}
                                                </Typography>
                                            )}

                                            {itemCta && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontWeight: 800,
                                                        fontSize: '0.65rem',
                                                        color: cfg.styles?.ctaColor || '#2563EB',
                                                        display: 'inline-block',
                                                        mt: 0.5,
                                                        cursor: 'pointer',
                                                        '&:hover': { textDecoration: 'underline' },
                                                    }}
                                                >
                                                    {itemCta} →
                                                </Typography>
                                            )}
                                        </Box>
                                    </Paper>
                                );
                            })}
                        </Box>
                    </Box>
                );
            }

            case 'number-box':
            case 'flip-box':
            case 'progress-bar':
            case 'marquee': {
                if (module.type === 'progress-bar') {
                    return (
                        <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderRadius: 1.5, border: '1px solid #E5E7EB' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>{extractString(cfg.title, 'Goal Progress')}</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#2563EB', fontSize: '0.7rem' }}>85%</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={85} sx={{ height: 8, borderRadius: 4, bgcolor: '#EFF6FF', '& .MuiLinearProgress-bar': { bgcolor: '#2563EB' } }} />
                        </Box>
                    );
                }

                if (module.type === 'marquee') {
                    return (
                        <Box sx={{ p: 1, bgcolor: '#1E293B', color: '#FDE047', borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CampaignIcon sx={{ fontSize: 18 }} />
                            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                🔥 FLASH SALE: Up to 70% Off Everything • Free Express Delivery Over {formatPrice(100, undefined, storeId)}!
                            </Typography>
                        </Box>
                    );
                }

                return (
                    <Box sx={{ p: 1.5, bgcolor: '#EFF6FF', borderRadius: 1.5, border: '1px solid #BFDBFE', textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#1D4ED8', fontSize: '1.2rem' }}>
                            {extractString(cfg.number, '99.9%')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 600, fontSize: '0.7rem' }}>
                            {extractString(cfg.title || definition?.label, '')}
                        </Typography>
                    </Box>
                );
            }

            // ======================================================================
            // BLOG & CMS MODULES (REAL BLOG & CONTENT CARDS API DATA)
            // ======================================================================
            case 'blog-grid':
            case 'blog-listing':
            case 'blog-hero':
            case 'recent-posts':
            case 'popular-posts':
            case 'related-blogs':
            case 'content-card-grid': {
                const title = extractString(cfg.title, module.type.includes('blog') ? 'Latest Blog Articles' : 'Featured Content Cards');
                const postsList = Array.isArray(realData) ? realData : (realData?.posts || realData?.cards || []);
                const hasRealPosts = postsList && postsList.length > 0;

                return (
                    <Box sx={{ p: 1.5, bgcolor: '#FAFAFA', borderRadius: 1.5, border: '1px solid #E5E7EB' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <ArticleIcon sx={{ fontSize: '1rem', color: '#10B981' }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>{title}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {hasRealPosts && (
                                    <Chip label="LIVE BLOG API" size="small" sx={{ fontSize: '0.55rem', height: 16, bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800 }} />
                                )}
                                <Chip label="Blog & Articles" size="small" sx={{ fontSize: '0.6rem', height: 18, bgcolor: '#D1FAE5', color: '#047857' }} />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                            {(hasRealPosts ? postsList.slice(0, 2) : [1, 2]).map((item: any, idx: number) => {
                                const isReal = typeof item === 'object';
                                const postTitle = isReal ? extractString(item.title || item.name, `Article Post #${idx + 1}`) : `Article Post #${item}`;
                                const postImage = isReal ? extractString(item.featuredImage || item.coverImage || item.image, '') : null;
                                const categoryTag = isReal ? extractString(item.category, 'NEWS') : 'NEWS';

                                return (
                                    <Paper key={isReal ? item._id || idx : item} elevation={0} sx={{ p: 1, bgcolor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 1 }}>
                                        <Box sx={{ height: 50, bgcolor: '#E5E7EB', borderRadius: 0.75, mb: 0.75, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {postImage ? (
                                                <Box component="img" src={postImage} alt={postTitle} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <ArticleIcon sx={{ color: '#9CA3AF', fontSize: 18 }} />
                                            )}
                                        </Box>
                                        <Chip label={categoryTag} size="small" sx={{ height: 14, fontSize: '0.5rem', fontWeight: 800, bgcolor: '#EFF6FF', color: '#2563EB', mb: 0.25 }} />
                                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.68rem', display: 'block', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {postTitle}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#9CA3AF' }}>Jul 28, 2026 • 4 min read</Typography>
                                    </Paper>
                                );
                            })}
                        </Box>
                    </Box>
                );
            }

            case 'author-card': {
                return (
                    <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderRadius: 1.5, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 42, height: 42, bgcolor: '#10B981' }}>AT</Avatar>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#111827' }}>
                                {extractString(cfg.authorName, 'Alex Turner')}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.65rem', display: 'block' }}>
                                Senior Commerce Specialist & Editor
                            </Typography>
                        </Box>
                    </Box>
                );
            }

            case 'tags-cloud': {
                return (
                    <Box sx={{ p: 1.5, bgcolor: '#FAFAFA', borderRadius: 1.5, border: '1px solid #E5E7EB' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.75rem', display: 'block', mb: 1 }}>Popular Tags Cloud</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {['#ecommerce', '#fashion', '#summer2026', '#deals', '#gadgets'].map((tag) => (
                                <Chip key={tag} label={tag} size="small" sx={{ fontSize: '0.6rem', height: 20, bgcolor: '#FFFFFF', border: '1px solid #E5E7EB' }} />
                            ))}
                        </Box>
                    </Box>
                );
            }

            case 'newsletter-signup': {
                return (
                    <Box sx={{ p: 2, bgcolor: '#1E1B4B', color: '#FFFFFF', borderRadius: 1.5, textAlign: 'center' }}>
                        <EmailIcon sx={{ fontSize: 24, color: '#A78BFA', mb: 0.5 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.85rem' }}>
                            {extractString(cfg.title, 'Subscribe to Newsletter')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#C4B5FD', fontSize: '0.65rem', display: 'block', mb: 1.25 }}>
                            Get weekly deals & fashion trends directly to your inbox
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, maxWidth: 280, mx: 'auto' }}>
                            <Box sx={{ flex: 1, bgcolor: '#FFFFFF', borderRadius: 1, px: 1, py: 0.5 }}>
                                <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem' }}>your.email@domain.com</Typography>
                            </Box>
                            <Button size="small" variant="contained" sx={{ bgcolor: '#8B5CF6', fontSize: '0.65rem', fontWeight: 700, textTransform: 'none', px: 1.5 }}>
                                Subscribe
                            </Button>
                        </Box>
                    </Box>
                );
            }

            // ======================================================================
            // FORMS, CART, CHECKOUT & ACCOUNT MODULES (REAL FORMS DATA)
            // ======================================================================
            case 'form': {
                const formData = realData;
                const formFields = formData?.fields || [];
                const hasRealFields = formFields && formFields.length > 0;

                return (
                    <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderRadius: 1.5, border: '1px solid #E5E7EB' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justify: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ContactMailIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                                    {extractString(formData?.title || cfg.title, 'Custom Dynamic Form')}
                                </Typography>
                            </Box>
                            {hasRealFields && (
                                <Chip label="LIVE FORM API" size="small" sx={{ fontSize: '0.55rem', height: 16, bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800 }} />
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                            {(hasRealFields ? formFields.slice(0, 3) : [{ label: 'Full Name *' }, { label: 'Email Address *' }]).map((field: any, idx: number) => {
                                const fLabel = typeof field === 'object' ? extractString(field.label || field.name || field, `Field #${idx + 1}`) : String(field);
                                return (
                                    <Box key={idx} sx={{ height: 26, bgcolor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 1, px: 1, display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.65rem' }}>{fLabel}</Typography>
                                    </Box>
                                );
                            })}
                            <Button size="small" variant="contained" sx={{ bgcolor: '#3B82F6', fontSize: '0.65rem', textTransform: 'none', py: 0.25 }}>
                                {extractString(formData?.submitButtonText || cfg.submitButtonText, 'Submit Form')}
                            </Button>
                        </Box>
                    </Box>
                );
            }

            case 'cart-details':
            case 'checkout-content': {
                return (
                    <Box sx={{ p: 1.5, bgcolor: '#FAFAFA', borderRadius: 1.5, border: '1px solid #E5E7EB' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <ShoppingCartIcon sx={{ color: '#F59E0B', fontSize: 20 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                                {module.type === 'cart-details' ? 'Cart Items Breakdown' : 'Checkout Payment & Delivery'}
                            </Typography>
                        </Box>
                        <Box sx={{ p: 1, bgcolor: '#FFFFFF', borderRadius: 1, border: '1px solid #E5E7EB', mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Subtotal (2 items)</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                                    {formatPrice(179.98, undefined, storeId)}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.65rem' }}>Shipping</Typography>
                                <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 700, fontSize: '0.65rem' }}>FREE</Typography>
                            </Box>
                        </Box>
                        <Button fullWidth size="small" variant="contained" sx={{ bgcolor: '#10B981', fontSize: '0.7rem', fontWeight: 700, textTransform: 'none' }}>
                            Proceed to Checkout
                        </Button>
                    </Box>
                );
            }

            case 'account-sidebar':
            case 'account-dashboard':
            case 'account-orders':
            case 'account-profile':
            case 'account-addresses': {
                return (
                    <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PersonIcon sx={{ color: '#6366F1', fontSize: 20 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#0F172A' }}>
                                User Account Portal ({definition?.label})
                            </Typography>
                        </Box>
                        <Box sx={{ p: 1, bgcolor: '#FFFFFF', borderRadius: 1, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', display: 'block' }}>Welcome back, John Doe</Typography>
                                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#64748B' }}>Order #INF-9842 • Delivered</Typography>
                            </Box>
                            <Chip label="Active Account" size="small" sx={{ fontSize: '0.55rem', height: 16, bgcolor: '#EEF2FF', color: '#4F46E5' }} />
                        </Box>
                    </Box>
                );
            }

            // ======================================================================
            // SECTION LAYOUT CONTAINER (NESTED RECURSIVE PREVIEW)
            // ======================================================================
            case 'section-layout': {
                const nestedModules = (cfg.modules || []) as LayoutModule[];
                return (
                    <Box
                        sx={{
                            p: `${cfg.paddingTop ?? 16}px ${cfg.paddingRight ?? 16}px ${cfg.paddingBottom ?? 16}px ${cfg.paddingLeft ?? 16}px`,
                            backgroundColor: cfg.backgroundColor || 'transparent',
                            border: `${cfg.borderWidth ?? 1}px ${cfg.borderStyle || 'dashed'} ${cfg.borderColor || '#3B82F6'}`,
                            borderRadius: `${cfg.borderRadius ?? 8}px`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: cfg.gap !== undefined ? `${cfg.gap}px` : '1rem',
                            minHeight: 80,
                            boxSizing: 'border-box',
                            width: '100%',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 0.5, borderBottom: '1px dashed #CBD5E1' }}>
                            <LayersIcon sx={{ fontSize: 18, color: '#3B82F6' }} />
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E40AF', fontSize: '0.7rem' }}>
                                Section Container ({nestedModules.length} nested modules)
                            </Typography>
                        </Box>

                        {nestedModules.length === 0 ? (
                            <Box sx={{ p: 2, textAlign: 'center', border: '1px dashed #E2E8F0', borderRadius: 1, bgcolor: '#F8FAFC' }}>
                                <Typography variant="caption" color="text.secondary">
                                    Empty Section Layout. Open configuration to add modules.
                                </Typography>
                            </Box>
                        ) : (
                            nestedModules.map((nestedMod) => (
                                <Box key={nestedMod.id} sx={{ pointerEvents: 'none' }}>
                                    <ModuleRenderer
                                        module={nestedMod}
                                        isSelected={false}
                                        onClick={() => {}}
                                        storeId={storeId}
                                    />
                                </Box>
                            ))
                        )}
                    </Box>
                );
            }

            // DEFAULT FALLBACK PREVIEW
            default: {
                return (
                    <Box
                        sx={{
                            p: 1.5,
                            bgcolor: module.isPlaceholder ? '#EFF6FF' : '#F9FAFB',
                            borderRadius: 1.5,
                            border: '1px solid #E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                        }}
                    >
                        <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: '#FFFFFF', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconComponent sx={{ fontSize: 18, color: '#3B82F6' }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#1F2937' }}>
                                {definition?.label || module.type}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.65rem' }}>
                                {definition?.description || 'Custom Module Block'}
                            </Typography>
                        </Box>
                        {module.isPlaceholder && (
                            <Chip label="Required" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.6rem' }} />
                        )}
                    </Box>
                );
            }
        }
    };

    return (
        <Paper
            variant="outlined"
            onClick={onClick}
            sx={{
                p: 1,
                cursor: 'pointer',
                border: isSelected ? '2px solid' : '1px solid',
                borderColor: isSelected ? '#3B82F6' : '#E5E7EB',
                bgcolor: isSelected ? '#F0F9FF' : '#FFFFFF',
                borderRadius: 2,
                boxShadow: isSelected ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.15s ease-in-out',
                '&:hover': {
                    borderColor: '#60A5FA',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.12)',
                },
            }}
        >
            {renderPreview()}
        </Paper>
    );
}
