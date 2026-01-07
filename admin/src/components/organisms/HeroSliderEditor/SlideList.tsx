import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, IconButton, Typography, Tooltip, alpha } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { HeroSliderSlide } from '@/services/heroSlider.service';
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
    accent2: '#7c3aed',
    gradient: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)'
};

interface SlideListProps {
    slides: HeroSliderSlide[];
    activeId: string;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onCopy: (id: string) => void;
    onPaste?: () => void;
    onReorder: (slides: HeroSliderSlide[]) => void;
}

function SortableSlideItem({ slide, index, activeId, onSelect, onDelete, onCopy }: {
    slide: HeroSliderSlide;
    index: number;
    activeId: string;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onCopy: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id });
    const isActive = slide.id === activeId;

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    // Generate a mini preview gradient or color
    const bgColor = slide.background?.type === 'color' ? slide.background.value : colors.bgTertiary;
    const hasImage = slide.background?.type === 'image';

    return (
        <Box
            ref={setNodeRef}
            style={style}
            sx={{
                mb: 1,
                borderRadius: 1.5,
                overflow: 'hidden',
                border: `2px solid ${isActive ? colors.accent : 'transparent'}`,
                transition: 'border-color 0.2s ease',
                '&:hover': {
                    borderColor: isActive ? colors.accent : alpha(colors.accent, 0.3)
                }
            }}
        >
            {/* Slide Preview */}
            <Box
                onClick={() => onSelect(slide.id)}
                sx={{
                    height: 60,
                    background: hasImage
                        ? `url(${slide.background?.value}) center/cover`
                        : bgColor,
                    position: 'relative',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {/* Slide Number */}
                <Box sx={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderRadius: 0.75,
                    px: 0.75,
                    py: 0.25
                }}>
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600, fontSize: 10 }}>
                        {index + 1}
                    </Typography>
                </Box>

                {/* Layer count */}
                <Box sx={{
                    position: 'absolute',
                    bottom: 6,
                    left: 6,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderRadius: 0.75,
                    px: 0.75,
                    py: 0.25
                }}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 9 }}>
                        {slide.layers?.length || 0} layers
                    </Typography>
                </Box>

                {/* Actions */}
                <Box sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    display: 'flex',
                    gap: 0.25,
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    '.MuiBox-root:hover > &': { opacity: 1 }
                }}
                    className="slide-actions"
                >
                    <Tooltip title="Duplicate Slide" arrow placement="top">
                        <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); onCopy(slide.id); }}
                            sx={{
                                bgcolor: 'rgba(0,0,0,0.6)',
                                color: '#fff',
                                width: 24,
                                height: 24,
                                '&:hover': { bgcolor: colors.accent, color: '#000' }
                            }}
                        >
                            <ContentCopyIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Slide" arrow placement="top">
                        <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); onDelete(slide.id); }}
                            sx={{
                                bgcolor: 'rgba(0,0,0,0.6)',
                                color: '#fff',
                                width: 24,
                                height: 24,
                                '&:hover': { bgcolor: '#ef4444', color: '#fff' }
                            }}
                        >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Drag handle */}
                <Box
                    {...attributes}
                    {...listeners}
                    sx={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        cursor: 'grab',
                        color: 'rgba(255,255,255,0.4)',
                        '&:active': { cursor: 'grabbing' }
                    }}
                >
                    <DragIndicatorIcon sx={{ fontSize: 16 }} />
                </Box>
            </Box>

            {/* Slide Name */}
            {slide.name && (
                <Box sx={{ px: 1, py: 0.5, bgcolor: colors.bgTertiary }}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 10 }} noWrap>
                        {slide.name}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

export default function SlideList({ slides, activeId, onSelect, onDelete, onCopy, onPaste, onReorder }: SlideListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = slides.findIndex(s => s.id === active.id);
            const newIndex = slides.findIndex(s => s.id === over.id);
            onReorder(arrayMove(slides, oldIndex, newIndex));
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
                    Slides
                </Typography>
                {onPaste && (
                    <Tooltip title="Paste Copied Slide" arrow>
                        <IconButton size="small" onClick={onPaste} sx={{ color: colors.accent }}>
                            <ContentPasteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {/* Slides */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        {slides.map((slide, index) => (
                            <SortableSlideItem
                                key={slide.id}
                                slide={slide}
                                index={index}
                                activeId={activeId}
                                onSelect={onSelect}
                                onDelete={onDelete}
                                onCopy={onCopy}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                {slides.length === 0 && (
                    <Box sx={{
                        textAlign: 'center',
                        py: 4,
                        color: colors.textSecondary
                    }}>
                        <Typography variant="caption">No slides yet</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
