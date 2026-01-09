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
    sectionId: string;
    columnId?: string;
    index: number;
}

function SortableModule({ module, isSelected, onSelect, onDelete, sectionId, columnId, index }: SortableModuleProps) {
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
            sectionId,
            columnId,
            index,
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
                gap: 0.75,
                mb: 1,
                p: 1,
                bgcolor: '#FFFFFF',
                border: isSelected ? '2px solid' : '1px solid',
                borderColor: isSelected ? '#3B82F6' : '#E5E7EB',
                borderRadius: 1,
                boxShadow: isSelected
                    ? '0 4px 12px rgba(59, 130, 246, 0.15)'
                    : '0 1px 3px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    borderColor: isSelected ? '#3B82F6' : '#D1D5DB',
                    bgcolor: isSelected ? '#FFFFFF' : '#F9FAFB',
                },
            }}
        >
            {/* Drag Handle */}
            <Box
                {...attributes}
                {...listeners}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    color: '#D1D5DB',
                    transition: 'all 0.2s',
                    '&:hover': { color: '#9CA3AF' },
                }}
            >
                <DragIndicatorIcon sx={{ fontSize: '1rem' }} />
            </Box>

            {/* Module Content */}
            <Box flex={1} onClick={onSelect} sx={{ cursor: 'pointer', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <ModuleRenderer module={module} isSelected={isSelected} onClick={onSelect} />
            </Box>

            {/* Delete Button */}
            {isRemovable && (
                <IconButton
                    size="small"
                    onClick={onDelete}
                    sx={{
                        p: 0.5,
                        color: '#D1D5DB',
                        transition: 'all 0.2s',
                        '&:hover': {
                            color: '#EF4444',
                            bgcolor: '#FEE2E2',
                        },
                    }}
                >
                    <DeleteIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
            )}
        </Box>
    );
}

// Droppable area for modules from palette
interface ModuleDropZoneProps {
    sectionId: string;
    columnId?: string;
    children: React.ReactNode;
}

function ModuleDropZone({ sectionId, columnId, children }: ModuleDropZoneProps) {
    const dropId = columnId ? `drop-${sectionId}-${columnId}` : `drop-${sectionId}`;

    const { setNodeRef, isOver } = useDroppable({
        id: dropId,
        data: {
            type: 'section-drop',
            sectionId,
            columnId,
        },
    });

    return (
        <Box
            ref={setNodeRef}
            sx={{
                minHeight: 60,
                p: 1,
                border: isOver ? '2px dashed' : '1px dashed',
                borderColor: isOver ? '#3B82F6' : '#E5E7EB',
                borderRadius: 1,
                bgcolor: isOver ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    borderColor: '#D1D5DB',
                    bgcolor: 'rgba(59, 130, 246, 0.02)',
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
                mb: 1.5,
                overflow: 'hidden',
                border: isSelected ? '2px solid' : '1px solid',
                borderColor: isSelected ? '#3B82F6' : '#E5E7EB',
                borderRadius: 1.5,
                bgcolor: '#FFFFFF',
                boxShadow: isSelected
                    ? '0 4px 16px rgba(59, 130, 246, 0.15)'
                    : '0 1px 3px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
                    borderColor: isSelected ? '#3B82F6' : '#D1D5DB',
                },
            }}
        >
            {/* Section Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1.25,
                    gap: 1,
                    bgcolor: isSelected ? '#F0F9FF' : '#FAFBFC',
                    borderBottom: isExpanded ? '1px solid #E5E7EB' : 'none',
                    transition: 'all 0.2s',
                }}
            >
                {/* Drag Handle */}
                <Box
                    {...attributes}
                    {...listeners}
                    sx={{
                        cursor: isDragging ? 'grabbing' : 'grab',
                        display: 'flex',
                        color: '#D1D5DB',
                        transition: 'all 0.2s',
                        '&:hover': { color: '#9CA3AF' },
                    }}
                >
                    <DragIndicatorIcon sx={{ fontSize: '1rem' }} />
                </Box>

                {/* Section Info */}
                <Box
                    flex={1}
                    onClick={onSelectSection}
                    sx={{
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                        '&:hover': { opacity: 0.7 },
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#1F2937', lineHeight: 1.3 }}>
                        {section.name || 'Unnamed Section'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.75rem', letterSpacing: 0.3 }}>
                        {section.type} • {section.modules.length + (section.columns?.reduce((acc, col) => acc + col.modules.length, 0) || 0)} module(s)
                    </Typography>
                </Box>

                {/* Visibility Indicators */}
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', px: 0.75, py: 0.5, bgcolor: '#F3F4F6', borderRadius: 0.75, border: '1px solid #E5E7EB' }}>
                    <DesktopWindowsIcon
                        sx={{
                            fontSize: '0.9rem',
                            color: section.visibility.desktop ? '#3B82F6' : '#D1D5DB',
                            transition: 'color 0.2s',
                        }}
                    />
                    <TabletIcon
                        sx={{
                            fontSize: '0.9rem',
                            color: section.visibility.tablet ? '#3B82F6' : '#D1D5DB',
                            transition: 'color 0.2s',
                        }}
                    />
                    <PhoneIphoneIcon
                        sx={{
                            fontSize: '0.9rem',
                            color: section.visibility.mobile ? '#3B82F6' : '#D1D5DB',
                            transition: 'color 0.2s',
                        }}
                    />
                </Box>

                {/* Settings Button */}
                <IconButton
                    size="small"
                    onClick={onSelectSection}
                    sx={{
                        p: 0.5,
                        color: '#9CA3AF',
                        transition: 'all 0.2s',
                        '&:hover': {
                            color: '#3B82F6',
                            bgcolor: '#EFF6FF',
                        },
                    }}
                >
                    <SettingsIcon sx={{ fontSize: '1rem' }} />
                </IconButton>

                {/* Expand/Collapse Button */}
                <IconButton
                    size="small"
                    onClick={() => setIsExpanded(!isExpanded)}
                    sx={{
                        p: 0.5,
                        color: '#9CA3AF',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
                        '&:hover': {
                            color: '#3B82F6',
                            bgcolor: '#EFF6FF',
                        },
                    }}
                >
                    <ExpandLessIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
            </Box>

            {/* Section Content */}
            <Collapse in={isExpanded}>
                <Box sx={{ p: 1 }}>
                    {section.columns && section.columns.length > 0 ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {section.columns.map((col) => (
                                <Box key={col.id} sx={{ flex: col.width, minWidth: 0 }}>
                                    <SortableContext
                                        id={col.id}
                                        items={col.modules.map(m => m.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <ModuleDropZone sectionId={section.id} columnId={col.id}>
                                            {col.modules.length === 0 ? (
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: '#9CA3AF',
                                                        textAlign: 'center',
                                                        py: 1.5,
                                                        fontSize: '0.875rem',
                                                    }}
                                                >
                                                    Empty column
                                                </Typography>
                                            ) : (
                                                col.modules.map((mod, index) => (
                                                    <SortableModule
                                                        key={mod.id}
                                                        module={mod}
                                                        isSelected={selectedModuleId === mod.id}
                                                        onSelect={() => onSelectModule(mod.id)}
                                                        onDelete={() => onDeleteModule(mod.id)}
                                                        sectionId={section.id}
                                                        columnId={col.id}
                                                        index={index}
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
                                        sx={{
                                            color: '#9CA3AF',
                                            textAlign: 'center',
                                            py: 2,
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        Drag modules here to add
                                    </Typography>
                                ) : (
                                    section.modules.map((mod, index) => (
                                        <SortableModule
                                            key={mod.id}
                                            module={mod}
                                            isSelected={selectedModuleId === mod.id}
                                            onSelect={() => onSelectModule(mod.id)}
                                            onDelete={() => onDeleteModule(mod.id)}
                                            sectionId={section.id}
                                            index={index}
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
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAddSection}
                sx={{
                    mt: 1.5,
                    bgcolor: '#3B82F6',
                    color: '#FFFFFF',
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.25,
                    transition: 'all 0.2s',
                    '&:hover': {
                        bgcolor: '#2563EB',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    },
                }}
            >
                Add Section
            </Button>
        </Box>
    );
}
