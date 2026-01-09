'use client';

import { Box, Typography, Paper, Chip } from '@mui/material';
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
import { LayoutModule, ModuleType } from '@/types';
import { getModuleDefinition } from './types';

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
};

interface ModuleRendererProps {
    module: LayoutModule;
    isSelected: boolean;
    onClick: () => void;
}

export default function ModuleRenderer({ module, isSelected, onClick }: ModuleRendererProps) {
    const definition = getModuleDefinition(module.type);
    const IconComponent = definition ? iconMap[definition.icon] || ImageIcon : ImageIcon;

    // Render a preview based on module type
    const renderPreview = () => {
        switch (module.type) {
            case 'banner':
            case 'banner-slider':
                return (
                    <Box
                        sx={{
                            height: 120,
                            bgcolor: 'grey.200',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                        }}
                    >
                        <IconComponent sx={{ fontSize: 40, color: 'grey.500' }} />
                        <Typography variant="caption" color="text.secondary">
                            {definition?.label}
                        </Typography>
                    </Box>
                );

            case 'text-block':
                return (
                    <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1, minHeight: 40 }}>
                        <Typography variant="caption" color="text.secondary" dangerouslySetInnerHTML={{ __html: module.config.content || 'Text content...' }} />
                    </Box>
                );

            case 'image':
                return module.config.src ? (
                    <Box
                        component="img"
                        src={module.config.src}
                        alt={module.config.alt || ''}
                        sx={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 1 }}
                    />
                ) : (
                    <Box
                        sx={{
                            height: 80,
                            bgcolor: 'grey.200',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <ImageIcon color="disabled" />
                    </Box>
                );

            case 'spacer':
                return (
                    <Box
                        sx={{
                            height: Math.min(module.config.height || 40, 60),
                            border: '1px dashed',
                            borderColor: 'grey.300',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            {module.config.height || 40}px
                        </Typography>
                    </Box>
                );

            case 'divider':
                return (
                    <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                        <Box
                            sx={{
                                width: module.config.width || '100%',
                                borderTop: `${module.config.thickness || 1}px ${module.config.style || 'solid'} ${module.config.color || '#e0e0e0'}`,
                            }}
                        />
                    </Box>
                );

            case 'product-carousel':
            case 'product-grid':
                return (
                    <Box sx={{ display: 'flex', gap: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        {[1, 2, 3, 4].map((i) => (
                            <Box
                                key={i}
                                sx={{
                                    flex: 1,
                                    height: 60,
                                    bgcolor: 'grey.200',
                                    borderRadius: 0.5,
                                }}
                            />
                        ))}
                    </Box>
                );

            case 'heading':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: module.config.styles?.fontWeight || 700,
                                color: module.config.styles?.color || '#000000',
                                textAlign: module.config.align || 'center',
                                fontSize: '1rem',
                            }}
                        >
                            {module.config.heading || 'Your Title'}
                        </Typography>
                        {module.config.subheading && (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'text.secondary',
                                    textAlign: module.config.align || 'center',
                                    mt: 0.5,
                                }}
                            >
                                {module.config.subheading}
                            </Typography>
                        )}
                    </Box>
                );

            case 'form':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconComponent sx={{ fontSize: 32, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="body2" fontWeight={600}>
                                {module.config.formId ? `Form ID: ${module.config.formId}` : 'Custom form with dynamic fields'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {definition?.category}
                            </Typography>
                        </Box>
                    </Box>
                );

            case 'pricing-table':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                Pricing plans comparison
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.plans?.length || 0} plan(s) • {module.config.columns || 3} columns
                        </Typography>
                    </Box>
                );

            case 'accordion':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                {module.config.title || 'Accordion'}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.items?.length || 0} item(s) • {module.config.selectionMode || 'single'} mode
                        </Typography>
                    </Box>
                );

            case 'icon-box':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                Features or services with icons
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.items?.length || 0} item(s) • {module.config.columns || 3} columns
                        </Typography>
                    </Box>
                );

            case 'video':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                {definition?.label || 'Video'}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.source || 'youtube'} • {module.config.aspectRatio || '16:9'}
                        </Typography>
                    </Box>
                );

            case 'image-gallery':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                {definition?.label || 'Image Gallery'}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.images?.length || 0} image(s) • {module.config.layout || 'grid'} • {module.config.columns || 3} columns
                        </Typography>
                    </Box>
                );

            case 'html':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                Custom HTML
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.content ? `${module.config.content.substring(0, 50)}...` : 'Custom HTML code'}
                        </Typography>
                    </Box>
                );

            case 'testimonials':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                Testimonials
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.layout || 'carousel'} • {module.config.autoplay ? 'autoplay' : 'manual'}
                        </Typography>
                    </Box>
                );

            case 'brand-logos':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                Brand Logos
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.showcaseId ? `Showcase ID: ${module.config.showcaseId}` : 'Brand logo showcase'}
                        </Typography>
                    </Box>
                );

            case 'card-group':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                {module.config.title || 'Card Group'}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.cards?.length || 0} card(s) • {module.config.layout || 'grid'} • {module.config.columns?.desktop || 3} columns
                        </Typography>
                    </Box>
                );

            case 'strip-banner':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                Strip Banner
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.content || 'Special Offer'} • CTA: {module.config.ctaPosition || 'right'}
                        </Typography>
                    </Box>
                );

            case 'content-card-grid':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                {module.config.title || 'Content Card Grid'}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.limit || 6} items • {module.config.gridColumns || 3} columns • {module.config.variant || 'default'}
                        </Typography>
                    </Box>
                );

            case 'author-card':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                Author Card
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.authorName || 'Author Name'} • {module.config.layout || 'expanded'}
                        </Typography>
                    </Box>
                );

            case 'tags-cloud':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                {module.config.title || 'Tags Cloud'}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            Max {module.config.maxTags || 20} tags • {module.config.layout || 'cloud'}
                        </Typography>
                    </Box>
                );

            case 'popular-posts':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                {module.config.title || 'Popular Posts'}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.numberOfPosts || 5} posts • {module.config.metric || 'views'} • {module.config.timePeriod || 'month'}
                        </Typography>
                    </Box>
                );

            case 'recent-posts':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                {module.config.title || 'Recent Posts'}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.numberOfPosts || 5} posts • {module.config.layout || 'vertical'}
                        </Typography>
                    </Box>
                );

            case 'blog-grid':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                {module.config.title || 'Blog Grid'}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.numberOfPosts || 6} posts • {module.config.columns || 3} columns
                        </Typography>
                    </Box>
                );

            case 'blog-hero':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                {module.config.title || 'Blog Hero'}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.subtitle || 'Hero section for blog'} • {module.config.height || 'medium'}
                        </Typography>
                    </Box>
                );

            case 'related-blogs':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                {module.config.title || 'Related Blogs'}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.numberOfPosts || 3} posts • {module.config.matchBy || 'category'}
                        </Typography>
                    </Box>
                );

            case 'blog-categories-sidebar':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                {module.config.title || 'Blog Categories'}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.displayStyle || 'list'} • Max {module.config.maxCategories || 10}
                        </Typography>
                    </Box>
                );

            case 'newsletter-signup':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                {module.config.title || 'Newsletter Signup'}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.style || 'card'} • {module.config.buttonText || 'Subscribe'}
                        </Typography>
                    </Box>
                );

            case 'cta-button':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                {module.config.text || 'Click Me'}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.variant || 'contained'} • {module.config.alignment || 'center'}
                        </Typography>
                    </Box>
                );

            case 'category-showcase':
            case 'related-products':
            case 'recently-viewed':
            case 'personalized-products':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                {module.config.title || definition?.label || module.type}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {module.config.limit || 8} items • {module.config.layout || 'grid'} • {typeof module.config.columns === 'object' ? module.config.columns.desktop : module.config.columns || 4} columns
                        </Typography>
                    </Box>
                );

            case 'number-box':
            case 'flip-box':
            case 'progress-bar':
            case 'marquee':
                return (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconComponent sx={{ fontSize: 24, color: 'primary.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                                {definition?.label || module.type}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {definition?.description}
                        </Typography>
                    </Box>
                );

            default:
                return (
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: module.isPlaceholder ? 'primary.50' : 'grey.100',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                        }}
                    >
                        <IconComponent fontSize="small" color={module.isPlaceholder ? 'primary' : 'action'} />
                        <Typography variant="body2" color={module.isPlaceholder ? 'primary' : 'text.secondary'}>
                            {definition?.label || module.type}
                        </Typography>
                        {module.isPlaceholder && (
                            <Chip label="Required" size="small" color="primary" variant="outlined" />
                        )}
                    </Box>
                );
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
                borderColor: isSelected ? 'primary.main' : 'divider',
                bgcolor: isSelected ? 'primary.50' : 'background.paper',
                '&:hover': {
                    borderColor: 'primary.light',
                },
            }}
        >
            {renderPreview()}
        </Paper>
    );
}
