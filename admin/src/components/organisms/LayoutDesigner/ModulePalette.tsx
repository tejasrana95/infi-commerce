'use client';

import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, Tooltip, TextField, InputAdornment } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SearchIcon from '@mui/icons-material/Search';
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
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import ArticleIcon from '@mui/icons-material/Article';
import RecommendIcon from '@mui/icons-material/Recommend';
import HistoryIcon from '@mui/icons-material/History';
import SmartButtonIcon from '@mui/icons-material/SmartButton';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ExtensionIcon from '@mui/icons-material/Extension';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useState, useMemo } from 'react';
import { ModuleDefinition, AVAILABLE_MODULES, MODULE_CATEGORIES, getModulesByCategory } from './types';
import { LayoutType, ModuleType } from '@/types';

// Map icon names to components
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
    SmartButton: SmartButtonIcon,
    ViewStream: ViewStreamIcon,
    ViewModule: ViewModuleIcon,
    MonetizationOn: MonetizationOnIcon,
    Extension: ExtensionIcon,
    TableChart: ViewModuleIcon,
};

interface DraggableModuleItemProps {
    module: ModuleDefinition;
}

function DraggableModuleItem({ module }: DraggableModuleItemProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `palette-${module.type}`,
        data: {
            type: 'palette-module',
            moduleType: module.type,
        },
    });

    const style = {
        opacity: isDragging ? 0.4 : 1,
    };

    const IconComponent = iconMap[module.icon] || ImageIcon;

    return (
        <Tooltip title={module.description} placement="right" arrow>
            <Paper
                ref={setNodeRef}
                style={style}
                {...listeners}
                {...attributes}
                elevation={0}
                sx={{
                    p: 1.25,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    touchAction: 'none',
                    bgcolor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: 1,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        bgcolor: '#F3F4F6',
                        borderColor: '#3B82F6',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)',
                        transform: 'translateX(4px)',
                    },
                    '&:active': {
                        cursor: 'grabbing',
                    },
                }}
            >
                <DragIndicatorIcon sx={{ fontSize: 18, color: '#9CA3AF', flexShrink: 0 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flex: 1, minWidth: 0 }}>
                    <IconComponent sx={{ fontSize: 18, color: '#3B82F6', flexShrink: 0 }} />
                    <Typography 
                        variant="body2" 
                        noWrap 
                        sx={{ 
                            fontWeight: 500, 
                            color: '#1F2937',
                            fontSize: '0.875rem'
                        }}
                    >
                        {module.label}
                    </Typography>
                </Box>
            </Paper>
        </Tooltip>
    );
}

interface ModulePaletteProps {
    layoutType: LayoutType;
}

export default function ModulePalette({ layoutType }: ModulePaletteProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<string>('standard');

    const filterModulesForLayout = (modules: ModuleDefinition[]) => {
        return modules.filter(m => {
            if (!m.allowedLayoutTypes) return true;
            return m.allowedLayoutTypes.includes(layoutType);
        });
    };

    const filteredCategories = useMemo(() => {
        const categories = {} as Record<string, ModuleDefinition[]>;
        
        (Object.keys(MODULE_CATEGORIES) as Array<keyof typeof MODULE_CATEGORIES>).forEach((category) => {
            const modules = filterModulesForLayout(getModulesByCategory(category));
            const filtered = modules.filter(m =>
                m.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
            if (filtered.length > 0) {
                categories[category] = filtered;
            }
        });

        return categories;
    }, [searchTerm, layoutType]);

    return (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Search Input */}
            <Box sx={{ p: 1.5, pb: 1 }}>
                <TextField
                    size="small"
                    placeholder="Search modules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    fullWidth
                    variant="outlined"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: 18, color: '#9CA3AF' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                            bgcolor: '#F9FAFB',
                            fontSize: '0.875rem',
                            '&:hover fieldset': {
                                borderColor: '#D1D5DB',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#3B82F6',
                            },
                        },
                    }}
                />
            </Box>

            {/* Modules List */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 1, pb: 1 }}>
                {Object.keys(filteredCategories).length === 0 ? (
                    <Box sx={{ p: 2, textAlign: 'center', color: '#9CA3AF' }}>
                        <Typography variant="body2">No modules found</Typography>
                    </Box>
                ) : (
                    (Object.keys(filteredCategories) as Array<keyof typeof MODULE_CATEGORIES>).map((category) => {
                        const modules = filteredCategories[category];
                        return (
                            <Accordion
                                key={category}
                                expanded={expandedCategory === category}
                                onChange={() => setExpandedCategory(expandedCategory === category ? '' : category)}
                                disableGutters
                                elevation={0}
                                sx={{
                                    bgcolor: 'transparent',
                                    border: 'none',
                                    '&.MuiAccordion-root': {
                                        boxShadow: 'none',
                                    },
                                    '&.MuiAccordion-root:before': {
                                        display: 'none',
                                    },
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon sx={{ fontSize: 18, color: '#6B7280' }} />}
                                    sx={{
                                        minHeight: 36,
                                        px: 0.5,
                                        py: 0.5,
                                        '& .MuiAccordionSummary-content': { my: 0.5 },
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            bgcolor: '#F9FAFB',
                                        },
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontWeight: 700,
                                            color: '#374151',
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                        }}
                                    >
                                        {MODULE_CATEGORIES[category]}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            ml: 'auto',
                                            color: '#9CA3AF',
                                            fontSize: '0.7rem',
                                        }}
                                    >
                                        {modules.length}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ p: 0.75, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                    {modules.map((module) => (
                                        <DraggableModuleItem key={module.type} module={module} />
                                    ))}
                                </AccordionDetails>
                            </Accordion>
                        );
                    })
                )}
            </Box>
        </Box>
    );
}
