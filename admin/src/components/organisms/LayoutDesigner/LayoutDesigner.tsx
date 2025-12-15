'use client';

import { useState, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Chip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import TabletIcon from '@mui/icons-material/Tablet';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    DragOverEvent,
    DragOverlay,
    closestCenter,
    closestCorners,
    pointerWithin,
    rectIntersection,
    getFirstCollision,
    PointerSensor,
    useSensor,
    useSensors,
    Active,
    UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Layout, LayoutSection, LayoutModule, ModuleType } from '@/types';
import ModulePalette from './ModulePalette';
import SectionList from './SectionList';
import SectionEditor from './SectionEditor';
import ModuleEditor from './ModuleEditor';
import { createSection, createModule, getModuleDefinition } from './types';

interface LayoutDesignerProps {
    layout: Layout;
    onChange: (layout: Layout) => void;
    onSave: () => void;
    onBack: () => void;
    isSaving?: boolean;
}

export default function LayoutDesigner({
    layout,
    onChange,
    onSave,
    onBack,
    isSaving = false,
}: LayoutDesignerProps) {
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeDragData, setActiveDragData] = useState<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    // Find selected section and module
    const selectedSection = layout.sections.find((s) => s.id === selectedSectionId);
    const selectedModule = selectedSection?.modules.find((m) => m.id === selectedModuleId);

    // Update sections
    const updateSections = useCallback(
        (sections: LayoutSection[]) => {
            onChange({ ...layout, sections });
        },
        [layout, onChange]
    );

    // Update a specific section
    const updateSection = useCallback(
        (sectionId: string, updates: Partial<LayoutSection>) => {
            const sections = layout.sections.map((s) =>
                s.id === sectionId ? { ...s, ...updates } : s
            );
            updateSections(sections);
        },
        [layout.sections, updateSections]
    );

    // Update a module within a section
    const updateModule = useCallback(
        (sectionId: string, moduleId: string, updates: Partial<LayoutModule>) => {
            const sections = layout.sections.map((s) => {
                if (s.id !== sectionId) return s;
                return {
                    ...s,
                    modules: s.modules.map((m) =>
                        m.id === moduleId ? { ...m, ...updates } : m
                    ),
                };
            });
            updateSections(sections);
        },
        [layout.sections, updateSections]
    );

    // Add new section
    const handleAddSection = () => {
        const newSection = createSection('container');
        updateSections([...layout.sections, newSection]);
        setSelectedSectionId(newSection.id);
        setSelectedModuleId(null);
    };

    // Delete section
    const handleDeleteSection = (sectionId: string) => {
        updateSections(layout.sections.filter((s) => s.id !== sectionId));
        if (selectedSectionId === sectionId) {
            setSelectedSectionId(null);
            setSelectedModuleId(null);
        }
    };

    // Delete module
    const handleDeleteModule = (sectionId: string, moduleId: string) => {
        updateSection(sectionId, {
            modules: layout.sections
                .find((s) => s.id === sectionId)
                ?.modules.filter((m) => m.id !== moduleId) || [],
        });
        if (selectedModuleId === moduleId) {
            setSelectedModuleId(null);
        }
    };

    // Find which section contains a module
    const findSectionByModuleId = (moduleId: string): LayoutSection | undefined => {
        return layout.sections.find((s) => s.modules.some((m) => m.id === moduleId));
    };

    // Handle drag start
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);
        setActiveDragData(active.data.current);
    };

    // Handle drag end
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveDragData(null);

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        // Case 1: Dragging from palette to drop zone
        if (activeData?.type === 'palette-module' && activeData.moduleType) {
            // Check if dropping on a section drop zone
            if (overData?.type === 'section-drop' && overData.sectionId) {
                const newModule = createModule(activeData.moduleType as ModuleType);
                const section = layout.sections.find((s) => s.id === overData.sectionId);
                if (section) {
                    updateSection(overData.sectionId, {
                        modules: [...section.modules, newModule],
                    });
                    setSelectedSectionId(overData.sectionId);
                    setSelectedModuleId(newModule.id);
                }
            }
            return;
        }

        // Case 2: Reordering sections
        if (activeData?.type === 'section' && overData?.type === 'section') {
            const oldIndex = layout.sections.findIndex((s) => s.id === active.id);
            const newIndex = layout.sections.findIndex((s) => s.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                updateSections(arrayMove(layout.sections, oldIndex, newIndex));
            }
            return;
        }

        // Case 3: Reordering modules within same section
        const activeSection = findSectionByModuleId(active.id as string);
        const overSection = findSectionByModuleId(over.id as string);

        if (activeSection && overSection && activeSection.id === overSection.id) {
            const oldIndex = activeSection.modules.findIndex((m) => m.id === active.id);
            const newIndex = activeSection.modules.findIndex((m) => m.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                updateSection(activeSection.id, {
                    modules: arrayMove(activeSection.modules, oldIndex, newIndex),
                });
            }
        }
    };

    // Custom collision detection that works for both palette drops and sortable items
    const collisionDetection = useCallback((args: any) => {
        // First check if we're dragging from palette
        if (activeDragData?.type === 'palette-module') {
            // For palette items, prefer pointer-based detection for precise drops
            const pointerCollisions = pointerWithin(args);
            // Filter to only include drop zones
            const dropZoneCollisions = pointerCollisions.filter((c: any) =>
                c.id?.toString().startsWith('drop-')
            );
            if (dropZoneCollisions.length > 0) return dropZoneCollisions;
            // Fall back to all pointer collisions
            if (pointerCollisions.length > 0) return pointerCollisions;
        }

        // For everything else use closest corners
        return closestCorners(args);
    }, [activeDragData]);

    // Render drag overlay content
    const renderDragOverlay = () => {
        if (!activeId || !activeDragData) return null;

        // Palette module being dragged
        if (activeDragData.type === 'palette-module') {
            const definition = getModuleDefinition(activeDragData.moduleType);
            return (
                <Paper
                    sx={{
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: 'primary.50',
                        border: '2px solid',
                        borderColor: 'primary.main',
                        boxShadow: 4,
                    }}
                >
                    <DragIndicatorIcon fontSize="small" color="primary" />
                    <Typography variant="body2" fontWeight={600}>
                        {definition?.label || activeDragData.moduleType}
                    </Typography>
                </Paper>
            );
        }

        // Section being dragged
        if (activeDragData.type === 'section') {
            return (
                <Paper
                    sx={{
                        p: 1,
                        bgcolor: 'grey.100',
                        border: '2px solid',
                        borderColor: 'primary.main',
                        boxShadow: 4,
                        opacity: 0.9,
                    }}
                >
                    <Typography variant="subtitle2" fontWeight={600}>
                        {activeDragData.section?.name || 'Section'}
                    </Typography>
                </Paper>
            );
        }

        return null;
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
                {/* Left Sidebar - Module Palette */}
                <Paper
                    sx={{
                        width: 280,
                        borderRadius: 0,
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        overflow: 'auto',
                        flexShrink: 0,
                    }}
                >
                    <Box sx={{ p: 2 }}>
                        <ModulePalette layoutType={layout.type} />
                    </Box>
                </Paper>

                {/* Main Canvas */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Header */}
                    <Paper
                        sx={{
                            p: 2,
                            borderRadius: 0,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <IconButton onClick={onBack}>
                            <ArrowBackIcon />
                        </IconButton>

                        <Box flex={1}>
                            <Typography variant="h6" fontWeight={600}>
                                {layout.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                <Chip label={layout.type} size="small" color="primary" variant="outlined" />
                                <Chip
                                    label={layout.status}
                                    size="small"
                                    color={layout.status === 'published' ? 'success' : 'default'}
                                />
                                {layout.isDefault && <Chip label="Default" size="small" color="warning" />}
                            </Box>
                        </Box>

                        {/* Device Toggle */}
                        <Box sx={{ display: 'flex', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <IconButton
                                size="small"
                                color={previewDevice === 'desktop' ? 'primary' : 'default'}
                                onClick={() => setPreviewDevice('desktop')}
                            >
                                <DesktopWindowsIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                size="small"
                                color={previewDevice === 'tablet' ? 'primary' : 'default'}
                                onClick={() => setPreviewDevice('tablet')}
                            >
                                <TabletIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                size="small"
                                color={previewDevice === 'mobile' ? 'primary' : 'default'}
                                onClick={() => setPreviewDevice('mobile')}
                            >
                                <PhoneIphoneIcon fontSize="small" />
                            </IconButton>
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={onSave}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                    </Paper>

                    {/* Canvas */}
                    <Box
                        sx={{
                            flex: 1,
                            overflow: 'auto',
                            p: 3,
                            bgcolor: 'grey.100',
                        }}
                    >
                        <Box
                            sx={{
                                maxWidth: previewDevice === 'mobile' ? 375 : previewDevice === 'tablet' ? 768 : '100%',
                                mx: 'auto',
                                bgcolor: 'background.paper',
                                minHeight: 400,
                                p: 2,
                                borderRadius: 1,
                                boxShadow: 1,
                            }}
                        >
                            {layout.sections.length === 0 ? (
                                <Box
                                    sx={{
                                        py: 8,
                                        textAlign: 'center',
                                        border: '2px dashed',
                                        borderColor: 'grey.300',
                                        borderRadius: 2,
                                    }}
                                >
                                    <Typography color="text.secondary" gutterBottom>
                                        No sections yet
                                    </Typography>
                                    <Button variant="outlined" onClick={handleAddSection}>
                                        Add First Section
                                    </Button>
                                </Box>
                            ) : (
                                <SectionList
                                    sections={layout.sections}
                                    selectedSectionId={selectedSectionId}
                                    selectedModuleId={selectedModuleId}
                                    onSelectSection={(id) => {
                                        setSelectedSectionId(id);
                                        setSelectedModuleId(null);
                                    }}
                                    onSelectModule={(sectionId, moduleId) => {
                                        setSelectedSectionId(sectionId);
                                        setSelectedModuleId(moduleId);
                                    }}
                                    onDeleteModule={handleDeleteModule}
                                    onAddSection={handleAddSection}
                                />
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Right Sidebar - Settings */}
                <Paper
                    sx={{
                        width: 320,
                        borderRadius: 0,
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                        overflow: 'auto',
                        flexShrink: 0,
                    }}
                >
                    <Box sx={{ p: 2 }}>
                        {selectedModule && selectedSectionId ? (
                            <ModuleEditor
                                module={selectedModule}
                                onChange={(updated) =>
                                    updateModule(selectedSectionId, selectedModule.id, updated)
                                }
                                onDelete={() => handleDeleteModule(selectedSectionId, selectedModule.id)}
                                storeId={layout.storeId}
                            />
                        ) : selectedSection ? (
                            <SectionEditor
                                section={selectedSection}
                                onChange={(updated) => updateSection(selectedSection.id, updated)}
                                onDelete={() => handleDeleteSection(selectedSection.id)}
                            />
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Select a section or module to edit
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Paper>
            </Box>

            {/* Drag Overlay - renders the dragged item visually */}
            <DragOverlay dropAnimation={null} style={{ zIndex: 9999 }}>
                {renderDragOverlay()}
            </DragOverlay>
        </DndContext>
    );
}
