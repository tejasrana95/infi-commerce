'use client';

import {
    Box,
    Typography,
    Paper,
    TextField,
    InputAdornment,
    Tooltip,
    Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
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
import { useState, useMemo } from 'react';
import { ModuleDefinition, AVAILABLE_MODULES, MODULE_CATEGORIES, getModulesByCategory } from './types';
import { LayoutType } from '@/types';

// Icon map
const iconMap: Record<string, React.ElementType> = {
    ViewCarousel: ViewCarouselIcon, TextFields: TextFieldsIcon,
    Image: ImageIcon, Collections: CollectionsIcon,
    PlayCircle: PlayCircleIcon, SpaceBar: SpaceBarIcon,
    HorizontalRule: HorizontalRuleIcon, Code: CodeIcon,
    FormatQuote: FormatQuoteIcon, BusinessCenter: BusinessCenterIcon,
    GridView: GridViewIcon, Category: CategoryIcon,
    Inventory2: Inventory2Icon, ShoppingBag: ShoppingBagIcon,
    Search: SearchIcon, Article: ArticleIcon,
    Recommend: RecommendIcon, History: HistoryIcon,
    SmartButton: SmartButtonIcon, ViewStream: ViewStreamIcon,
    ViewModule: ViewModuleIcon, MonetizationOn: MonetizationOnIcon,
    Extension: ExtensionIcon, TableChart: ViewModuleIcon,
};

// Category chip colors
const categoryColors: Record<string, string> = {
    standard: '#3B82F6',
    product: '#10B981',
    placeholder: '#8B5CF6',
    account: '#F59E0B',
};

// ======================================================================
// DraggableModuleItem
// ======================================================================
function DraggableModuleItem({ module }: { module: ModuleDefinition }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: 'palette-' + module.type,
        data: { type: 'palette-module', moduleType: module.type },
    });

    const IconComponent = iconMap[module.icon] || ExtensionIcon;

    return (
        <Paper
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            elevation={0}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                p: 1.25,
                mb: 0.75,
                bgcolor: '#FFFFFF',
                border: '1px solid',
                borderColor: isDragging ? '#3B82F6' : '#E5E7EB',
                borderRadius: 1.5,
                cursor: isDragging ? 'grabbing' : 'grab',
                opacity: isDragging ? 0.4 : 1,
                boxShadow: isDragging ? '0 4px 12px rgba(59,130,246,0.15)' : 'none',
                transition: 'all 0.15s',
                '&:hover': {
                    borderColor: '#3B82F6',
                    boxShadow: '0 2px 8px rgba(59,130,246,0.1)',
                    transform: 'translateX(2px)',
                },
            }}
        >
            <DragIndicatorIcon sx={{ fontSize: '1rem', color: '#D1D5DB', flexShrink: 0 }} />
            <Box sx={{
                width: 32, height: 32, borderRadius: 1,
                bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                <IconComponent sx={{ fontSize: '1rem', color: '#3B82F6' }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1F2937' }}>
                    {module.label}
                </Typography>
                <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.65rem' }}>
                    {module.description}
                </Typography>
            </Box>
        </Paper>
    );
}

// ======================================================================
// ModulePalette
// ======================================================================
interface ModulePaletteProps {
    layoutType: LayoutType;
}

export default function ModulePalette({ layoutType }: ModulePaletteProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filterModulesForLayout = (modules: ModuleDefinition[]) => {
        return modules.filter(m => !m.allowedLayoutTypes || m.allowedLayoutTypes.includes(layoutType));
    };

    // Group modules by category, filtered by search & layout type
    const groupedModules = useMemo(() => {
        const result: { category: string; label: string; color: string; modules: ModuleDefinition[] }[] = [];
        const cats = Object.keys(MODULE_CATEGORIES) as Array<keyof typeof MODULE_CATEGORIES>;

        cats.forEach(cat => {
            const modules = filterModulesForLayout(getModulesByCategory(cat));
            const filtered = modules.filter(m =>
                m.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
            if (filtered.length > 0) {
                result.push({
                    category: cat,
                    label: MODULE_CATEGORIES[cat],
                    color: categoryColors[cat] || '#6B7280',
                    modules: filtered,
                });
            }
        });
        return result;
    }, [searchTerm, layoutType]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1F2937', fontSize: '0.8rem', mb: 1 }}>
                    Blocks
                </Typography>
                <TextField
                    size="small"
                    placeholder="Search blocks..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    fullWidth
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: '1rem', color: '#9CA3AF' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            bgcolor: '#F9FAFB',
                            fontSize: '0.8rem',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '1.5px' },
                        },
                    }}
                />
            </Box>

            {/* Module list */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, pb: 2 }}>
                {groupedModules.length === 0 ? (
                    <Typography variant="body2" sx={{ color: '#9CA3AF', textAlign: 'center', py: 4, fontSize: '0.8rem' }}>
                        {searchTerm ? 'No blocks match your search' : 'No blocks available'}
                    </Typography>
                ) : (
                    groupedModules.map(group => (
                        <Box key={group.category} sx={{ mb: 2 }}>
                            {/* Category header */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, px: 0.5 }}>
                                <Box sx={{ width: 3, height: 14, borderRadius: 2, bgcolor: group.color }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B7280', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    {group.label}
                                </Typography>
                                <Chip
                                    label={group.modules.length}
                                    size="small"
                                    sx={{
                                        ml: 'auto', height: 18, fontSize: '0.6rem', fontWeight: 600,
                                        bgcolor: '#F3F4F6', color: '#9CA3AF',
                                        '& .MuiChip-label': { px: 0.75 },
                                    }}
                                />
                            </Box>
                            {/* Module cards */}
                            {group.modules.map(mod => (
                                <DraggableModuleItem key={mod.type} module={mod} />
                            ))}
                        </Box>
                    ))
                )}
            </Box>
        </Box>
    );
}
