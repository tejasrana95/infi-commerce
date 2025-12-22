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
