import React, { useState } from 'react';
import { Box, IconButton, Typography, Tooltip, alpha, Menu, MenuItem, ListItemIcon, ListItemText, Collapse } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import SmartButtonIcon from '@mui/icons-material/SmartButton';
import StarIcon from '@mui/icons-material/Star';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { HeroSliderLayer } from '@/services/heroSlider.service';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Theme colors
const colors = {
    bg: '#0d0d1a',
    bgSecondary: '#13132a',
    bgTertiary: '#1a1a3a',
    bgHover: '#252550',
    border: '#2a2a4a',
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.5)',
    accent: '#00d4ff',
    accent2: '#7c3aed'
};

interface LayerListProps {
    layers: HeroSliderLayer[];
    selectedIds: string[];
    onSelect: (id: string, addToSelection?: boolean) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onReorder: (layers: HeroSliderLayer[]) => void;
    onAddToSection?: (sectionId: string, type: 'text' | 'image' | 'button' | 'icon' | 'rte') => void;
}

const getLayerIcon = (type: string) => {
    switch (type) {
        case 'text': return <TextFieldsIcon sx={{ fontSize: 16 }} />;
        case 'rte': return <TextFieldsIcon sx={{ fontSize: 16, borderBottom: '2px solid currentColor' }} />;
        case 'image': return <ImageIcon sx={{ fontSize: 16 }} />;
        case 'button': return <SmartButtonIcon sx={{ fontSize: 16 }} />;
        case 'icon': return <StarIcon sx={{ fontSize: 16 }} />;
        case 'section': return <ViewModuleIcon sx={{ fontSize: 16 }} />;
        default: return <TextFieldsIcon sx={{ fontSize: 16 }} />;
    }
};

const getLayerColor = (type: string) => {
    switch (type) {
        case 'text': return '#00d4ff';
        case 'rte': return '#06b6d4';
        case 'image': return '#10b981';
        case 'button': return '#7c3aed';
        case 'icon': return '#f59e0b';
        case 'section': return '#ec4899';
        default: return colors.textSecondary;
    }
};

function SortableLayerItem({
    layer,
    isSelected,
    onSelect,
    onDelete,
    onDuplicate,
    onToggleVisibility,
    onToggleLock,
    onAddToSection,
    childLayers,
    allLayers,
    isNested = false
}: {
    layer: HeroSliderLayer;
    isSelected: boolean;
    onSelect: (id: string, addToSelection?: boolean) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onAddToSection?: (sectionId: string, type: 'text' | 'image' | 'button' | 'icon' | 'rte' | 'section') => void;
    childLayers?: HeroSliderLayer[];
    allLayers?: HeroSliderLayer[];
    isNested?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: layer.id });
    const isVisible = layer.visible !== false;
    const isLocked = layer.locked === true;
    const [expanded, setExpanded] = useState(true);
    const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    const layerColor = getLayerColor(layer.type);
    const isSection = layer.type === 'section';
    const hasChildren = childLayers && childLayers.length > 0;

    const handleClick = (e: React.MouseEvent) => {
        if (!isLocked) {
            onSelect(layer.id, e.ctrlKey || e.metaKey);
        }
    };

    return (
        <Box sx={{ ml: isNested ? 2 : 0 }}>
            <Box
                ref={setNodeRef}
                style={style}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: isSelected ? alpha(colors.accent, 0.15) : (isSection ? alpha(colors.accent2, 0.1) : colors.bgTertiary),
                    borderRadius: 1,
                    mb: 0.75,
                    border: `1px solid ${isSelected ? colors.accent : (isSection ? alpha(colors.accent2, 0.3) : 'transparent')}`,
                    opacity: isVisible ? 1 : 0.4,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                        backgroundColor: isSelected ? alpha(colors.accent, 0.2) : colors.bgHover,
                        '& .layer-actions': { opacity: 1 }
                    }
                }}
            >
                {/* Section Expand/Collapse */}
                {isSection && (
                    <IconButton
                        size="small"
                        onClick={() => setExpanded(!expanded)}
                        sx={{ 
                            width: 20, 
                            height: 20, 
                            ml: 0.5,
                            color: colors.textSecondary
                        }}
                    >
                        {expanded ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                )}

                {/* Drag Handle */}
                <Box
                    {...attributes}
                    {...listeners}
                    sx={{
                        p: isSection ? 0.5 : 1,
                        cursor: 'grab',
                        color: colors.textSecondary,
                        display: 'flex',
                        alignItems: 'center',
                    '&:active': { cursor: 'grabbing' }
                }}
            >
                <DragIndicatorIcon sx={{ fontSize: 16 }} />
            </Box>

            {/* Layer Type Icon */}
            <Box sx={{
                color: layerColor,
                display: 'flex',
                alignItems: 'center',
                mr: 1
            }}>
                {getLayerIcon(layer.type)}
            </Box>

            {/* Layer Info */}
            <Box
                onClick={handleClick}
                sx={{
                    flex: 1,
                    py: 0.75,
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    overflow: 'hidden'
                }}
            >
                <Typography
                    variant="body2"
                    sx={{
                        color: colors.text,
                        fontWeight: 500,
                        fontSize: 12,
                        textTransform: 'capitalize',
                        lineHeight: 1.2
                    }}
                    noWrap
                >
                    {layer.name || layer.type}
                </Typography>
                {layer.content && typeof layer.content === 'string' && layer.type !== 'image' && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: colors.textSecondary,
                            fontSize: 10,
                            display: 'block'
                        }}
                        noWrap
                    >
                        {layer.content.substring(0, 20)}{layer.content.length > 20 ? '...' : ''}
                    </Typography>
                )}
            </Box>

            {/* Actions */}
            <Box
                className="layer-actions"
                sx={{
                    display: 'flex',
                    gap: 0.25,
                    pr: 0.5,
                    opacity: isSelected ? 1 : 0,
                    transition: 'opacity 0.15s'
                }}
            >
                <Tooltip title={isVisible ? "Hide" : "Show"} arrow placement="top">
                    <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                        sx={{
                            width: 24,
                            height: 24,
                            color: isVisible ? colors.textSecondary : colors.accent,
                            '&:hover': { color: colors.accent }
                        }}
                    >
                        {isVisible ? <VisibilityIcon sx={{ fontSize: 14 }} /> : <VisibilityOffIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                </Tooltip>
                <Tooltip title={isLocked ? "Unlock" : "Lock"} arrow placement="top">
                    <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onToggleLock(layer.id); }}
                        sx={{
                            width: 24,
                            height: 24,
                            color: isLocked ? '#f59e0b' : colors.textSecondary,
                            '&:hover': { color: '#f59e0b' }
                        }}
                    >
                        {isLocked ? <LockIcon sx={{ fontSize: 14 }} /> : <LockOpenIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                </Tooltip>
                <Tooltip title="Duplicate" arrow placement="top">
                    <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onDuplicate(layer.id); }}
                        sx={{
                            width: 24,
                            height: 24,
                            color: colors.textSecondary,
                            '&:hover': { color: colors.accent }
                        }}
                    >
                        <ContentCopyIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete" arrow placement="top">
                    <IconButton
                        size="small"
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            console.log('Delete clicked for layer:', layer.id, layer.type);
                            onDelete(layer.id); 
                        }}
                        sx={{
                            width: 24,
                            height: 24,
                            color: colors.textSecondary,
                            '&:hover': { color: '#ef4444' }
                        }}
                    >
                        <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </Tooltip>

                {/* Add to Section Button */}
                {isSection && onAddToSection && (
                    <>
                        <Tooltip title="Add Content" arrow placement="top">
                            <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); setAddMenuAnchor(e.currentTarget); }}
                                sx={{
                                    width: 24,
                                    height: 24,
                                    color: colors.accent,
                                    '&:hover': { color: colors.accent2 }
                                }}
                            >
                                <AddIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            anchorEl={addMenuAnchor}
                            open={Boolean(addMenuAnchor)}
                            onClose={() => setAddMenuAnchor(null)}
                            PaperProps={{
                                sx: { bgcolor: colors.bgSecondary, border: `1px solid ${colors.border}` }
                            }}
                        >
                            <MenuItem onClick={() => { onAddToSection(layer.id, 'text'); setAddMenuAnchor(null); }} sx={{ color: colors.text }}>
                                <ListItemIcon><TextFieldsIcon sx={{ color: '#00d4ff', fontSize: 16 }} /></ListItemIcon>
                                <ListItemText>Text</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => { onAddToSection(layer.id, 'rte'); setAddMenuAnchor(null); }} sx={{ color: colors.text }}>
                                <ListItemIcon><TextFieldsIcon sx={{ color: '#06b6d4', fontSize: 16, borderBottom: '2px solid currentColor' }} /></ListItemIcon>
                                <ListItemText>Rich Text</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => { onAddToSection(layer.id, 'image'); setAddMenuAnchor(null); }} sx={{ color: colors.text }}>
                                <ListItemIcon><ImageIcon sx={{ color: '#10b981', fontSize: 16 }} /></ListItemIcon>
                                <ListItemText>Image</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => { onAddToSection(layer.id, 'button'); setAddMenuAnchor(null); }} sx={{ color: colors.text }}>
                                <ListItemIcon><SmartButtonIcon sx={{ color: '#7c3aed', fontSize: 16 }} /></ListItemIcon>
                                <ListItemText>Button</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => { onAddToSection(layer.id, 'icon'); setAddMenuAnchor(null); }} sx={{ color: colors.text }}>
                                <ListItemIcon><StarIcon sx={{ color: '#f59e0b', fontSize: 16 }} /></ListItemIcon>
                                <ListItemText>Icon</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => { onAddToSection(layer.id, 'section'); setAddMenuAnchor(null); }} sx={{ color: colors.text }}>
                                <ListItemIcon><ViewModuleIcon sx={{ color: '#ec4899', fontSize: 16 }} /></ListItemIcon>
                                <ListItemText>Nested Section</ListItemText>
                            </MenuItem>
                        </Menu>
                    </>
                )}
            </Box>
            </Box>

            {/* Section Children */}
            {isSection && hasChildren && (
                <Collapse in={expanded}>
                    <Box sx={{ borderLeft: `2px solid ${alpha(colors.accent2, 0.3)}`, ml: 1.5, pl: 0.5 }}>
                        {childLayers.map(child => {
                            // Get nested section's children from allLayers
                            const layerSource = allLayers || childLayers;
                            const nestedChildren = child.type === 'section' && child.children
                                ? layerSource.filter(l => l.parentId === child.id)
                                : [];
                            return (
                                <SortableLayerItem
                                    key={child.id}
                                    layer={child}
                                    isSelected={false}
                                    onSelect={onSelect}
                                    onDelete={onDelete}
                                    onDuplicate={onDuplicate}
                                    onToggleVisibility={onToggleVisibility}
                                    onToggleLock={onToggleLock}
                                    onAddToSection={onAddToSection}
                                    childLayers={nestedChildren}
                                    allLayers={allLayers}
                                    isNested
                                />
                            );
                        })}
                    </Box>
                </Collapse>
            )}
        </Box>
    );
}

export default function LayerList({
    layers,
    selectedIds,
    onSelect,
    onDelete,
    onDuplicate,
    onToggleVisibility,
    onToggleLock,
    onReorder,
    onAddToSection
}: LayerListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Filter out child layers from the main list (they render inside their parent sections)
    // Reverse for display (top layer = first in visual list)
    const displayLayers = [...layers].filter(l => !l.parentId).reverse();

    // Helper to get child layers for a section
    const getChildLayers = (sectionId: string) => {
        return layers.filter(l => l.parentId === sectionId);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = displayLayers.findIndex(l => l.id === active.id);
            const newIndex = displayLayers.findIndex(l => l.id === over.id);
            const reordered = arrayMove(displayLayers, oldIndex, newIndex);
            onReorder([...reordered].reverse());
        }
    };

    return (
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{
                p: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${colors.border}`
            }}>
                <Typography variant="subtitle2" sx={{ color: colors.text, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Layers
                </Typography>
                <Typography variant="caption" sx={{ color: selectedIds.length > 1 ? colors.accent : colors.textSecondary, fontSize: 10 }}>
                    {selectedIds.length > 1 ? `${selectedIds.length} selected` : `${layers.length} items`}
                </Typography>
            </Box>

            {/* Layers */}
            <Box sx={{ 
                flex: 1, 
                overflow: 'auto', 
                p: 1,
                '&::-webkit-scrollbar': {
                    width: 6,
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha(colors.accent, 0.3),
                    borderRadius: 3,
                    '&:hover': {
                        backgroundColor: alpha(colors.accent, 0.5),
                    }
                }
            }}>
                {displayLayers.length === 0 ? (
                    <Box sx={{
                        textAlign: 'center',
                        py: 4,
                        color: colors.textSecondary
                    }}>
                        <Typography variant="caption">No layers yet</Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 0.5, fontSize: 10 }}>
                            Add layers using the toolbar
                        </Typography>
                    </Box>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={displayLayers.map(l => l.id)} strategy={verticalListSortingStrategy}>
                            {displayLayers.map((layer) => (
                                <SortableLayerItem
                                    key={layer.id}
                                    layer={layer}
                                    isSelected={selectedIds.includes(layer.id)}
                                    onSelect={onSelect}
                                    onDelete={onDelete}
                                    onDuplicate={onDuplicate}
                                    onToggleVisibility={onToggleVisibility}
                                    onToggleLock={onToggleLock}
                                    onAddToSection={onAddToSection}
                                    childLayers={layer.type === 'section' ? getChildLayers(layer.id) : undefined}
                                    allLayers={layers}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </Box>
        </Box>
    );
}
