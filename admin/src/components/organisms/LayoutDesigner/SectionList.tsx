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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
    } = useSortable({ id: module.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Box
            ref={setNodeRef}
            style={style}
            sx={{ display: 'flex', alignItems: 'stretch', gap: 0.5, mb: 0.5 }}
        >
            <Box
                {...attributes}
                {...listeners}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 0.5,
                    cursor: 'grab',
                    '&:active': { cursor: 'grabbing' },
                }}
            >
                <DragIndicatorIcon fontSize="small" color="action" />
            </Box>
            <Box flex={1}>
                <ModuleRenderer module={module} isSelected={isSelected} onClick={onSelect} />
            </Box>
            {isRemovable && (
                <IconButton size="small" color="error" onClick={onDelete}>
                    <DeleteIcon fontSize="small" />
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
                borderColor: isOver ? 'primary.main' : 'grey.300',
                borderRadius: 1,
                bgcolor: isOver ? 'action.hover' : 'transparent',
                transition: 'all 0.2s',
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
            variant="outlined"
            sx={{
                mb: 2,
                overflow: 'hidden',
                border: isSelected ? '2px solid' : '1px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
            }}
        >
            {/* Section Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    bgcolor: isSelected ? 'primary.50' : 'grey.50',
                    borderBottom: isExpanded ? '1px solid' : 'none',
                    borderColor: 'divider',
                }}
            >
                <Box {...attributes} {...listeners} sx={{ cursor: 'grab', display: 'flex', mr: 1 }}>
                    <DragIndicatorIcon color="action" />
                </Box>

                <Box flex={1} onClick={onSelectSection} sx={{ cursor: 'pointer' }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                        {section.name || 'Unnamed Section'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {section.type} • {section.modules.length + (section.columns?.reduce((acc, col) => acc + col.modules.length, 0) || 0)} module(s)
                    </Typography>
                </Box>

                {/* Visibility indicators */}
                <Box sx={{ display: 'flex', gap: 0.5, mr: 1 }}>
                    <DesktopWindowsIcon
                        fontSize="small"
                        color={section.visibility.desktop ? 'action' : 'disabled'}
                    />
                    <TabletIcon
                        fontSize="small"
                        color={section.visibility.tablet ? 'action' : 'disabled'}
                    />
                    <PhoneIphoneIcon
                        fontSize="small"
                        color={section.visibility.mobile ? 'action' : 'disabled'}
                    />
                </Box>

                <IconButton size="small" onClick={onSelectSection}>
                    <SettingsIcon fontSize="small" />
                </IconButton>

                <IconButton size="small" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>

            {/* Section Content - Modules are sortable within the parent context */}
            <Collapse in={isExpanded}>
                <Box sx={{ p: 1.5, bgcolor: 'background.paper' }}>
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
