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
    const selectedModule = selectedSection?.modules.find((m) => m.id === selectedModuleId) ||
        selectedSection?.columns?.flatMap(c => c.modules).find(m => m.id === selectedModuleId);

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

                // Check if module is in main modules list
                if (s.modules.some(m => m.id === moduleId)) {
                    return {
                        ...s,
                        modules: s.modules.map((m) =>
                            m.id === moduleId ? { ...m, ...updates } : m
                        ),
                    };
                }

                // Check if module is in columns
                if (s.columns) {
                    return {
                        ...s,
                        columns: s.columns.map(col => ({
                            ...col,
                            modules: col.modules.map(m =>
                                m.id === moduleId ? { ...m, ...updates } : m
                            )
                        }))
                    };
                }

                return s;
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

    const handleDeleteModule = (sectionId: string, moduleId: string) => {
        const section = layout.sections.find((s) => s.id === sectionId);
        if (!section) return;

        let updates: Partial<LayoutSection> = {};

        // Check if section has columns AND they're not empty
        if (section.columns && section.columns.length > 0) {
            updates = {
                columns: section.columns.map(col => ({
                    ...col,
                    modules: col.modules.filter(m => m.id !== moduleId)
                }))
            };
        } else {
            updates = {
                modules: section.modules.filter((m) => m.id !== moduleId)
            };
        }

        updateSection(sectionId, updates);
        if (selectedModuleId === moduleId) {
            setSelectedModuleId(null);
        }
    };

    // Find which section contains a module
    const findSectionByModuleId = (moduleId: string): LayoutSection | undefined => {
        return layout.sections.find((s) =>
            s.modules.some((m) => m.id === moduleId) ||
            s.columns?.some(c => c.modules.some(m => m.id === moduleId))
        );
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
                const sectionId = overData.sectionId; // This could be a section ID or a column ID

                // Find if target is a section or a column
                const section = layout.sections.find(s => s.id === sectionId);

                if (section) {
                    // Dropped directly on a non-split section
                    updateSection(sectionId, {
                        modules: [...section.modules, newModule],
                    });
                    setSelectedSectionId(sectionId);
                    setSelectedModuleId(newModule.id);
                } else {
                    // Check if it's a column ID
                    const sectionWithColumn = layout.sections.find(s => s.columns?.some(c => c.id === sectionId));
                    if (sectionWithColumn && sectionWithColumn.columns) {
                        updateSection(sectionWithColumn.id, {
                            columns: sectionWithColumn.columns.map(col =>
                                col.id === sectionId
                                    ? { ...col, modules: [...col.modules, newModule] }
                                    : col
                            )
                        });
                        setSelectedSectionId(sectionWithColumn.id);
                        setSelectedModuleId(newModule.id);
                    }
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

        // Case 3: Reordering modules (within section/column or moving between them)
        const activeSection = findSectionByModuleId(active.id as string);
        const overSection = findSectionByModuleId(over.id as string);

        // Handle moving modules
        if (activeSection) {
            // Determine source container (section module list or specific column)
            let sourceModules = activeSection.modules;
            let sourceColumnId: string | null = null;

            if (activeSection.columns) {
                const col = activeSection.columns.find(c => c.modules.some(m => m.id === active.id));
                if (col) {
                    sourceModules = col.modules;
                    sourceColumnId = col.id;
                }
            }

            // Determine target container
            let targetSection = overSection;
            let targetModules: LayoutModule[] | null = null;
            let targetColumnId: string | null = null;

            // If hovering over a module, find its container
            if (overSection) {
                targetModules = overSection.modules;
                if (overSection.columns) {
                    const col = overSection.columns.find(c => c.modules.some(m => m.id === over.id));
                    if (col) {
                        targetModules = col.modules;
                        targetColumnId = col.id;
                    }
                }
            }
            // If hovering over a drop zone (empty column/section)
            else if (overData?.type === 'section-drop') {
                const containerId = overData.sectionId;
                targetSection = layout.sections.find(s => s.id === containerId);

                if (targetSection) {
                    targetModules = targetSection.modules;
                } else {
                    targetSection = layout.sections.find(s => s.columns?.some(c => c.id === containerId));
                    if (targetSection && targetSection.columns) {
                        const col = targetSection.columns.find(c => c.id === containerId);
                        if (col) {
                            targetModules = col.modules;
                            targetColumnId = col.id;
                        }
                    }
                }
            }

            if (targetSection && targetModules) {
                const oldIndex = sourceModules.findIndex(m => m.id === active.id);
                // If over a drop zone, append to end. If over a module, find its index.
                const newIndex = overData?.type === 'section-drop'
                    ? targetModules.length + 1
                    : targetModules.findIndex(m => m.id === over.id);

                // Same container reorder
                if (activeSection.id === targetSection.id && sourceColumnId === targetColumnId) {
                    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                        const reordered = arrayMove(sourceModules, oldIndex, newIndex);

                        if (sourceColumnId && activeSection.columns) {
                            updateSection(activeSection.id, {
                                columns: activeSection.columns.map(c =>
                                    c.id === sourceColumnId ? { ...c, modules: reordered } : c
                                )
                            });
                        } else {
                            updateSection(activeSection.id, { modules: reordered });
                        }
                    }
                }
                // Move between containers (columns or sections)
                else {
                    // Remove from source
                    const item = sourceModules[oldIndex];
                    const newSourceModules = sourceModules.filter(m => m.id !== active.id);

                    // Add to target
                    const newTargetModules = [...targetModules];
                    // Insert at specific index if hovering over a module, otherwise append
                    if (newIndex >= 0 && newIndex < newTargetModules.length) {
                        newTargetModules.splice(newIndex, 0, item);
                    } else {
                        newTargetModules.push(item);
                    }

                    // Apply updates (batch if possible, but here we might need two updates if different sections)
                    // Since we update full sections list, we can do it in one go if we modify the sections array

                    const newSections = layout.sections.map(s => {
                        let newS = { ...s };

                        // Update source section
                        if (s.id === activeSection!.id) {
                            if (sourceColumnId && s.columns) {
                                newS.columns = s.columns.map(c => c.id === sourceColumnId ? { ...c, modules: newSourceModules } : c);
                            } else {
                                newS.modules = newSourceModules;
                            }
                        }

                        // Update target section (might be same section)
                        // Note: if same section, we need to use the 'newS' which presumably has the removal applied logic?
                        // Actually, if same section, we need to apply both changes to 'newS'
                        const sId = s.id;

                        if (sId === targetSection!.id) {
                            // If it's the same section, we have already modified newS above used as source. 
                            // We need to match the target column in the *modified* section?
                            // No, source and target are distinct containers (different columns or different sections).

                            if (targetColumnId && newS.columns) {
                                newS.columns = newS.columns.map(c => c.id === targetColumnId ? { ...c, modules: newTargetModules } : c);
                            } else if (!targetColumnId) {
                                newS.modules = newTargetModules;
                            }
                        }

                        return newS;
                    });

                    updateSections(newSections);
                }
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
