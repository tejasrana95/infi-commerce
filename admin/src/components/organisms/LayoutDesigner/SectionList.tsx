'use client';

import {
    Box,
    Typography,
    Paper,
    IconButton,
    Collapse,
    Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SettingsIcon from '@mui/icons-material/Settings';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import TabletIcon from '@mui/icons-material/Tablet';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LayoutSection, LayoutModule } from '@/types';
import ModuleRenderer from './ModuleRenderer';
import { getModuleDefinition } from './types';

// Sortable Module Item
interface SortableModuleProps {
    module: LayoutModule;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
}

function SortableModule({ module, isSelected, onSelect, onDelete }: SortableModuleProps) {
    const definition = getModuleDefinition(module.type);

    // Check if module is removable - defaults to true unless explicitly false or is a placeholder
    const isRemovable = module.isRemovable !== false && definition?.category !== 'placeholder';

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: module.id,
        data: {
            type: 'module',
            module,
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Box
            ref={setNodeRef}
            style={style}
            sx={{
                display: 'flex',
                alignItems: 'stretch',
                gap: 1,
                mb: 1.5,
                p: 1.25,
                bgcolor: 'background.paper',
                border: isSelected ? '2px solid' : 'none',
                borderColor: 'primary.main',
                borderRadius: 1.5,
                boxShadow: isSelected
                    ? '0 2px 8px rgba(37, 99, 235, 0.15), 0 1px 3px rgba(37, 99, 235, 0.08)'
                    : '0 1px 2px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'scale(1)',
                '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.03)',
                    transform: 'scale(1.005)',
                },
            }}
        >
            <Box
                {...attributes}
                {...listeners}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'grab',
                    color: 'grey.400',
                    transition: 'color 0.2s',
                    '&:hover': { color: 'grey.600' },
                    '&:active': { cursor: 'grabbing' },
                }}
            >
                <DragIndicatorIcon sx={{ fontSize: '1.1rem' }} />
            </Box>
            <Box flex={1} onClick={onSelect} sx={{ cursor: 'pointer', minWidth: 0 }}>
                <ModuleRenderer module={module} isSelected={isSelected} onClick={onSelect} />
            </Box>
            {isRemovable && (
                <IconButton
                    size="small"
                    onClick={onDelete}
                    sx={{
                        p: 0.5,
                        color: 'grey.400',
                        transition: 'all 0.2s',
                        '&:hover': {
                            color: 'error.main',
                            bgcolor: 'error.50',
                            transform: 'scale(1.05)',
                        },
                    }}
                >
                    <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                </IconButton>
            )}
        </Box>
    );
}

// Droppable area for modules from palette
interface ModuleDropZoneProps {
    sectionId: string;
    children: React.ReactNode;
}

function ModuleDropZone({ sectionId, children }: ModuleDropZoneProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `drop-${sectionId}`,
        data: { type: 'section-drop', sectionId },
    });

    return (
        <Box
            ref={setNodeRef}
            sx={{
                minHeight: 60,
                p: 1,
                border: isOver ? '2px dashed' : '1px dashed',
                borderColor: isOver ? 'primary.light' : 'grey.200',
                borderRadius: 1.5,
                bgcolor: isOver ? 'rgba(37, 99, 235, 0.03)' : 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    borderColor: 'grey.300',
                    bgcolor: 'grey.50',
                },
            }}
        >
            {children}
        </Box>
    );
}

// Section Item - now uses useSortable instead of its own DndContext
interface SectionItemProps {
    section: LayoutSection;
    isSelected: boolean;
    selectedModuleId: string | null;
    onSelectSection: () => void;
    onSelectModule: (moduleId: string) => void;
    onDeleteModule: (moduleId: string) => void;
}

function SectionItem({
    section,
    isSelected,
    selectedModuleId,
    onSelectSection,
    onSelectModule,
    onDeleteModule,
}: SectionItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: section.id,
        data: { type: 'section', section },
    });

    const [isExpanded, setIsExpanded] = useState(true);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            elevation={0}
            sx={{
                mb: 2,
                overflow: 'hidden',
                border: isSelected ? '2px solid' : '1px solid',
                borderColor: isSelected ? 'primary.main' : 'grey.100',
                borderRadius: 2,
                bgcolor: 'background.paper',
                boxShadow: isSelected
                    ? '0 4px 16px rgba(37, 99, 235, 0.12), 0 2px 6px rgba(37, 99, 235, 0.06)'
                    : '0 1px 4px rgba(0, 0, 0, 0.02)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'translateY(0)',
                '&:hover': {
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06), 0 3px 8px rgba(0, 0, 0, 0.03)',
                    transform: 'translateY(-1px)',
                },
            }}
        >
            {/* Section Header - Compact */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1.5,
                    bgcolor: isSelected ? 'rgba(37, 99, 235, 0.02)' : 'transparent',
                    borderBottom: isExpanded ? '1px solid' : 'none',
                    borderColor: 'grey.100',
                    transition: 'all 0.2s',
                }}
            >
                <Box
                    {...attributes}
                    {...listeners}
                    sx={{
                        cursor: 'grab',
                        display: 'flex',
                        mr: 1,
                        color: 'grey.400',
                        transition: 'all 0.2s',
                        '&:hover': { color: 'grey.600', transform: 'scale(1.05)' },
                        '&:active': { cursor: 'grabbing' },
                    }}
                >
                    <DragIndicatorIcon fontSize="small" />
                </Box>

                <Box
                    flex={1}
                    onClick={onSelectSection}
                    sx={{
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                        '&:hover': { opacity: 0.7 },
                    }}
                >
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0, fontSize: '0.875rem', lineHeight: 1.4 }}>
                        {section.name || 'Unnamed Section'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.2, fontSize: '0.7rem' }}>
                        {section.type} • {section.modules.length + (section.columns?.reduce((acc, col) => acc + col.modules.length, 0) || 0)} module(s)
                    </Typography>
                </Box>

                {/* Visibility indicators - Compact */}
                <Box sx={{ display: 'flex', gap: 0.5, mr: 1, px: 1, py: 0.5, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.100' }}>
                    <DesktopWindowsIcon
                        fontSize="small"
                        sx={{
                            fontSize: '1rem',
                            color: section.visibility.desktop ? 'primary.main' : 'grey.300',
                            transition: 'color 0.2s',
                        }}
                    />
                    <TabletIcon
                        fontSize="small"
                        sx={{
                            fontSize: '1rem',
                            color: section.visibility.tablet ? 'primary.main' : 'grey.300',
                            transition: 'color 0.2s',
                        }}
                    />
                    <PhoneIphoneIcon
                        fontSize="small"
                        sx={{
                            fontSize: '1rem',
                            color: section.visibility.mobile ? 'primary.main' : 'grey.300',
                            transition: 'color 0.2s',
                        }}
                    />
                </Box>

                <IconButton
                    size="small"
                    onClick={onSelectSection}
                    sx={{
                        p: 0.5,
                        mr: 0.5,
                        color: 'grey.400',
                        transition: 'all 0.2s',
                        '&:hover': {
                            color: 'primary.main',
                            bgcolor: 'primary.50',
                            transform: 'rotate(90deg)',
                        },
                    }}
                >
                    <SettingsIcon sx={{ fontSize: '1.1rem' }} />
                </IconButton>

                <IconButton
                    size="small"
                    onClick={() => setIsExpanded(!isExpanded)}
                    sx={{
                        p: 0.5,
                        color: 'grey.400',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
                        '&:hover': {
                            color: 'primary.main',
                            bgcolor: 'grey.100',
                        },
                    }}
                >
                    <ExpandLessIcon sx={{ fontSize: '1.1rem' }} />
                </IconButton>
            </Box>

            {/* Section Content - Modules are sortable within the parent context */}
            <Collapse in={isExpanded}>
                <Box sx={{ p: 1 }}>
                    {section.columns && section.columns.length > 0 ? (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {section.columns.map((col) => (
                                <Box key={col.id} sx={{ flex: col.width, minWidth: 0 }}>
                                    <SortableContext
                                        id={col.id} // Column ID becomes the sortable context ID
                                        items={col.modules.map(m => m.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <ModuleDropZone sectionId={col.id}> {/* Drop zone uses column ID */}
                                            {col.modules.length === 0 ? (
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    textAlign="center"
                                                    py={2}
                                                >
                                                    Empty
                                                </Typography>
                                            ) : (
                                                col.modules.map((mod) => (
                                                    <SortableModule
                                                        key={mod.id}
                                                        module={mod}
                                                        isSelected={selectedModuleId === mod.id}
                                                        onSelect={() => onSelectModule(mod.id)}
                                                        onDelete={() => onDeleteModule(mod.id)}
                                                    />
                                                ))
                                            )}
                                        </ModuleDropZone>
                                    </SortableContext>
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <SortableContext
                            id={section.id}
                            items={section.modules.map((m) => m.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <ModuleDropZone sectionId={section.id}>
                                {section.modules.length === 0 ? (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        textAlign="center"
                                        py={2}
                                    >
                                        Drag modules here
                                    </Typography>
                                ) : (
                                    section.modules.map((mod) => (
                                        <SortableModule
                                            key={mod.id}
                                            module={mod}
                                            isSelected={selectedModuleId === mod.id}
                                            onSelect={() => onSelectModule(mod.id)}
                                            onDelete={() => onDeleteModule(mod.id)}
                                        />
                                    ))
                                )}
                            </ModuleDropZone>
                        </SortableContext>
                    )}
                </Box>
            </Collapse>
        </Paper>
    );
}

// Main Section List - NO DndContext here, uses parent context
interface SectionListProps {
    sections: LayoutSection[];
    selectedSectionId: string | null;
    selectedModuleId: string | null;
    onSelectSection: (id: string) => void;
    onSelectModule: (sectionId: string, moduleId: string) => void;
    onDeleteModule: (sectionId: string, moduleId: string) => void;
    onAddSection: () => void;
}

export default function SectionList({
    sections,
    selectedSectionId,
    selectedModuleId,
    onSelectSection,
    onSelectModule,
    onDeleteModule,
    onAddSection,
}: SectionListProps) {
    return (
        <Box>
            <SortableContext
                items={sections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
            >
                {sections.map((section) => (
                    <SectionItem
                        key={section.id}
                        section={section}
                        isSelected={selectedSectionId === section.id}
                        selectedModuleId={
                            sections.find((s) => s.id === section.id)?.modules.find((m) => m.id === selectedModuleId) ||
                                sections.find((s) => s.id === section.id)?.columns?.some(c => c.modules.some(m => m.id === selectedModuleId))
                                ? selectedModuleId
                                : null
                        }
                        onSelectSection={() => onSelectSection(section.id)}
                        onSelectModule={(moduleId) => onSelectModule(section.id, moduleId)}
                        onDeleteModule={(moduleId) => onDeleteModule(section.id, moduleId)}
                    />
                ))}
            </SortableContext>

            <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={onAddSection}
                sx={{ mt: 1 }}
            >
                Add Section
            </Button>
        </Box>
    );
}
