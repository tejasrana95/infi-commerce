'use client';

import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, Tooltip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
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
import SmartButtonIcon from '@mui/icons-material/SmartButton';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ExtensionIcon from '@mui/icons-material/Extension';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
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
    TableChart: ViewModuleIcon, // Reuse ViewModuleIcon for now or import TableChart if available. I'll stick to ViewModule for simplicity as it's already there.
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
        // transform: CSS.Translate.toString(transform), // Disable transform to prevent clipping in overflow container
        opacity: isDragging ? 0.4 : 1,
    };

    const IconComponent = iconMap[module.icon] || ImageIcon;

    return (
        <Tooltip title={module.description} placement="right">
            <Paper
                ref={setNodeRef}
                style={style}
                {...listeners}
                {...attributes}
                variant="outlined"
                sx={{
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'grab',
                    touchAction: 'none',
                    '&:hover': {
                        bgcolor: 'action.hover',
                        borderColor: 'primary.main',
                    },
                    '&:active': {
                        cursor: 'grabbing',
                    },
                }}
            >
                <DragIndicatorIcon fontSize="small" color="action" />
                <IconComponent fontSize="small" color="primary" />
                <Typography variant="body2" noWrap>
                    {module.label}
                </Typography>
            </Paper>
        </Tooltip>
    );
}

interface ModulePaletteProps {
    layoutType: LayoutType;
}

export default function ModulePalette({ layoutType }: ModulePaletteProps) {
    const filterModulesForLayout = (modules: ModuleDefinition[]) => {
        return modules.filter(m => {
            if (!m.allowedLayoutTypes) return true;
            return m.allowedLayoutTypes.includes(layoutType);
        });
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, px: 1 }}>
                Add Modules
            </Typography>

            {(Object.keys(MODULE_CATEGORIES) as Array<keyof typeof MODULE_CATEGORIES>).map((category) => {
                const modules = filterModulesForLayout(getModulesByCategory(category));
                if (modules.length === 0) return null;

                return (
                    <Accordion key={category} defaultExpanded={category === 'standard'} disableGutters elevation={0}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0 } }}
                        >
                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                                {MODULE_CATEGORIES[category]}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {modules.map((module) => (
                                <DraggableModuleItem key={module.type} module={module} />
                            ))}
                        </AccordionDetails>
                    </Accordion>
                );
            })}
        </Box>
    );
}
