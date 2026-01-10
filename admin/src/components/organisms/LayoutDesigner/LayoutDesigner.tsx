'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Switch,
    MenuItem,
    Drawer,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import GridViewIcon from '@mui/icons-material/GridView';
import MenuIcon from '@mui/icons-material/Menu';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useNotification } from '@/contexts/NotificationContext';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';

import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    closestCorners,
    pointerWithin,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import ColumnEditor from './ColumnEditor';
import { Layout, LayoutSection, LayoutModule, ModuleType, LayoutType, LayoutColumn } from '@/types';
import ModulePalette from './ModulePalette';
import SectionList from './SectionList';
import FloatingToolbar from './FloatingToolbar';
import ModuleEditor from './ModuleEditor';
import SectionEditor from './SectionEditor';
import { createSection, getModuleDefinition, createModule } from './types';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';


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
    const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeDragData, setActiveDragData] = useState<any>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const { showNotification } = useNotification();

    // Responsive state
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md')); // <900px
    const [leftPanelOpen, setLeftPanelOpen] = useState(false); // Start hidden
    const [rightPanelOpen, setRightPanelOpen] = useState(true); // Auto-open when selection exists

    // Types that support slug-specific layouts
    const slugSupportedTypes: LayoutType[] = ['category', 'product', 'blog-post', 'page'];

    // Confirmation Dialog State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ title: '', message: '', onConfirm: () => { } });

    // Global Clipboard State for Styles
    const [copiedSectionStyle, setCopiedSectionStyle] = useState<any>(null);
    const [copiedColumnStyle, setCopiedColumnStyle] = useState<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    // Find selected section and module
    const selectedSection = layout.sections.find((s) => s.id === selectedSectionId);
    const selectedModule = selectedSection?.modules.find((m) => m.id === selectedModuleId) ||
        selectedSection?.columns?.flatMap(c => c.modules).find(m => m.id === selectedModuleId);

    // Auto-open right panel when section or module is selected
    useEffect(() => {
        if (selectedSectionId || selectedModuleId) {
            setRightPanelOpen(true);
        }
    }, [selectedSectionId, selectedModuleId]);

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
    // Clone a section
    const handleCloneSection = (sectionId: string) => {
        const sectionIndex = layout.sections.findIndex((s) => s.id === sectionId);
        if (sectionIndex === -1) return;

        const originalSection = layout.sections[sectionIndex];

        // Deep clone and regenerate IDs
        const clonedSection: LayoutSection = JSON.parse(JSON.stringify(originalSection));
        clonedSection.id = crypto.randomUUID();
        clonedSection.name = `${originalSection.name} (Copy)`;

        // Regenerate IDs for modules
        clonedSection.modules = clonedSection.modules.map((m) => ({
            ...m,
            id: crypto.randomUUID(),
        }));

        // Regenerate IDs for columns and their modules
        if (clonedSection.columns) {
            clonedSection.columns = clonedSection.columns.map((col) => ({
                ...col,
                id: crypto.randomUUID(),
                modules: col.modules.map((m) => ({
                    ...m,
                    id: crypto.randomUUID(),
                })),
            }));
        }

        const newSections = [...layout.sections];
        newSections.splice(sectionIndex + 1, 0, clonedSection);
        updateSections(newSections);

        // Select the new section
        setSelectedSectionId(clonedSection.id);
        setSelectedModuleId(null);
        showNotification('Section duplicated', 'success');
    };

    // Select a column
    const handleSelectColumn = (sectionId: string, columnId: string) => {
        if (selectedColumnId === columnId) {
            setSelectedColumnId(null);
            setRightPanelOpen(false);
            return;
        }
        setSelectedSectionId(sectionId);
        setSelectedModuleId(null);
        setSelectedColumnId(columnId);
        setRightPanelOpen(true);
    };

    // Add new section
    const handleAddSection = () => {
        const newSection = createSection('container');
        updateSections([...layout.sections, newSection]);
        setSelectedSectionId(newSection.id);
        setSelectedModuleId(null);
        setSelectedColumnId(null);
    };

    // Delete section
    const handleDeleteSection = (sectionId: string) => {
        setConfirmConfig({
            title: 'Delete Section',
            message: 'Are you sure you want to delete this section? This action cannot be undone.',
            onConfirm: () => {
                updateSections(layout.sections.filter((s) => s.id !== sectionId));
                if (selectedSectionId === sectionId) {
                    setSelectedSectionId(null);
                    setSelectedModuleId(null);
                    setSelectedColumnId(null);
                }
                setConfirmOpen(false);
                showNotification('Section deleted', 'success');
            }
        });
        setConfirmOpen(true);
    };

    const handleDeleteModule = (sectionId: string, moduleId: string) => {
        setConfirmConfig({
            title: 'Delete Module',
            message: 'Are you sure you want to delete this module?',
            onConfirm: () => {
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
                setConfirmOpen(false);
                showNotification('Module deleted', 'success');
            }
        });
        setConfirmOpen(true);
    };

    const handleCloneModule = (sectionId: string, moduleId: string) => {
        const section = layout.sections.find((s) => s.id === sectionId);
        if (!section) return;

        let updates: Partial<LayoutSection> = {};

        // Check if module is in columns or main modules list
        if (section.columns && section.columns.length > 0) {
            const columnWithModule = section.columns.find(col =>
                col.modules.some(m => m.id === moduleId)
            );

            if (columnWithModule) {
                const moduleIndex = columnWithModule.modules.findIndex(m => m.id === moduleId);
                const originalModule = columnWithModule.modules[moduleIndex];

                // Deep clone the module with all settings
                const clonedModule: LayoutModule = JSON.parse(JSON.stringify(originalModule));
                clonedModule.id = crypto.randomUUID();

                updates = {
                    columns: section.columns.map(col => {
                        if (col.id === columnWithModule.id) {
                            const newModules = [...col.modules];
                            newModules.splice(moduleIndex + 1, 0, clonedModule);
                            return { ...col, modules: newModules };
                        }
                        return col;
                    })
                };
            }
        } else {
            const moduleIndex = section.modules.findIndex(m => m.id === moduleId);
            if (moduleIndex !== -1) {
                const originalModule = section.modules[moduleIndex];

                // Deep clone the module with all settings
                const clonedModule: LayoutModule = JSON.parse(JSON.stringify(originalModule));
                clonedModule.id = crypto.randomUUID();

                const newModules = [...section.modules];
                newModules.splice(moduleIndex + 1, 0, clonedModule);
                updates = { modules: newModules };
            }
        }

        updateSection(sectionId, updates);
        showNotification('Module duplicated', 'success');
    };

    // Find which section contains a module
    const findSectionByModuleId = (moduleId: string): LayoutSection | undefined => {
        return layout.sections.find((s) =>
            s.modules.some((m) => m.id === moduleId) ||
            s.columns?.some(c => c.modules.some(m => m.id === moduleId))
        );
    };

    const insertModuleIntoSections = (
        sections: LayoutSection[],
        targetSectionId: string,
        targetColumnId: string | undefined,
        module: LayoutModule,
        insertAfterId?: string
    ): LayoutSection[] => {
        const insertIntoList = (list: LayoutModule[]) => {
            const newList = [...list];
            if (insertAfterId) {
                const insertIndex = newList.findIndex((m) => m.id === insertAfterId);
                if (insertIndex !== -1) {
                    newList.splice(insertIndex + 1, 0, module);
                    return newList;
                }
            }
            newList.push(module);
            return newList;
        };

        return sections.map((section) => {
            if (section.id !== targetSectionId) return section;

            if (targetColumnId && section.columns) {
                const columnFound = section.columns.some((c) => c.id === targetColumnId);
                if (columnFound) {
                    return {
                        ...section,
                        columns: section.columns.map((col) =>
                            col.id === targetColumnId
                                ? { ...col, modules: insertIntoList(col.modules) }
                                : col
                        ),
                    };
                }
            }

            return {
                ...section,
                modules: insertIntoList(section.modules),
            };
        });
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
            const newModule = createModule(activeData.moduleType as ModuleType);

            if (overData?.type === 'section-drop' && overData.sectionId) {
                updateSections(
                    insertModuleIntoSections(
                        layout.sections,
                        overData.sectionId,
                        overData.columnId,
                        newModule
                    )
                );
                setSelectedSectionId(overData.sectionId);
                setSelectedModuleId(newModule.id);
            } else if (overData?.type === 'module' && overData.sectionId) {
                updateSections(
                    insertModuleIntoSections(
                        layout.sections,
                        overData.sectionId,
                        overData.columnId,
                        newModule,
                        overData.module?.id
                    )
                );
                setSelectedSectionId(overData.sectionId);
                setSelectedModuleId(newModule.id);
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

        // Target container resolution
        let overSection: LayoutSection | undefined;
        if (overData?.type === 'section') {
            overSection = overData.section;
        } else if (overData?.type === 'section-drop' && overData.sectionId) {
            overSection = layout.sections.find((s) => s.id === overData.sectionId);
        } else {
            overSection = findSectionByModuleId(over.id as string);
        }

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

            if (overSection) {
                // If hovering over a drop zone, use that container ID
                if (overData?.type === 'section-drop' && overData.sectionId) {
                    const targetCol = overData.columnId
                        ? overSection.columns?.find(c => c.id === overData.columnId)
                        : undefined;
                    if (targetCol) {
                        targetModules = targetCol.modules;
                        targetColumnId = targetCol.id;
                    } else {
                        targetModules = overSection.modules;
                    }
                }
                // If hovering over a module, find its container
                else {
                    targetModules = overSection.modules;
                    if (overSection.columns) {
                        const col = overSection.columns.find(c => c.modules.some(m => m.id === over.id));
                        if (col) {
                            targetModules = col.modules;
                            targetColumnId = col.id;
                        }
                    }
                }
            }

            if (targetSection && targetModules) {
                const oldIndex = sourceModules.findIndex(m => m.id === active.id);
                if (oldIndex === -1) return; // safety check

                // If over a drop zone, append to end. If over a module, find its index.
                const newIndex = overData?.type === 'section-drop'
                    ? targetModules.length
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
        const { active, droppableContainers, pointerCoordinates } = args;
        const activeData = active?.data.current;

        // First check if we're dragging from palette OR dragging a module
        if (activeData?.type === 'palette-module' || activeData?.type === 'module') {
            // For modules/palette, prefer pointer-based detection for precise drops
            const pointerCollisions = pointerWithin(args);

            // Filter to include ALL possible drop zones (modules OR drop zones)
            const moduleCollisions = pointerCollisions.filter((c: any) =>
                c.data?.current?.type === 'module' ||
                c.data?.current?.type === 'section-drop'
            );

            if (moduleCollisions.length > 0) return moduleCollisions;

            // If no specific module/drop-zone collide, but we are over a section, 
            // return the section collisions from pointerWithin
            const sectionCollisions = pointerCollisions.filter((c: any) =>
                c.data?.current?.type === 'section'
            );
            if (sectionCollisions.length > 0) return sectionCollisions;

            // Fall back to all pointer collisions
            if (pointerCollisions.length > 0) return pointerCollisions;
        }

        // For everything else (like reordering sections), use closest corners
        return closestCorners(args);
    }, []);

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

        // Module being dragged
        if (activeDragData.type === 'module') {
            const definition = getModuleDefinition(activeDragData.module?.type);
            return (
                <Paper
                    sx={{
                        p: 1.25,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: 'background.paper',
                        border: '2px solid',
                        borderColor: 'primary.main',
                        boxShadow: 8,
                        borderRadius: 1.5,
                        minWidth: 200,
                    }}
                >
                    <DragIndicatorIcon fontSize="small" color="primary" />
                    <Typography variant="body2" fontWeight={600}>
                        {definition?.label || activeDragData.module?.type}
                    </Typography>
                </Paper>
            );
        }

        return null;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#F0F2F5', position: 'relative', height: '100%', overflow: 'hidden' }}>
            {/* Top Toolbar - Modern Header */}
            <Box
                sx={{
                    zIndex: 1100,
                    bgcolor: '#FFFFFF',
                    borderBottom: '1px solid',
                    borderColor: '#E5E7EB',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
            >
                <FloatingToolbar
                    layoutName={layout.name}
                    layoutType={layout.type}
                    layoutStatus={layout.status}
                    isDefault={layout.isDefault}
                    slug={layout.slug}
                    previewDevice={previewDevice}
                    onPreviewChange={setPreviewDevice}
                    onBack={onBack}
                    onSave={onSave}
                    onSettings={() => setSettingsOpen(true)}
                    onToggleModules={() => setLeftPanelOpen(!leftPanelOpen)}
                    modulesOpen={leftPanelOpen}
                    onToggleProperties={() => setRightPanelOpen(!rightPanelOpen)}
                    isSaving={isSaving}
                />
            </Box>

            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <Box sx={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden', gap: 0 }}>
                    {/* Left Sidebar - Elements Panel */}
                    <Drawer
                        variant="permanent"
                        anchor="left"
                        open={true}
                        sx={{
                            width: leftPanelOpen ? 300 : 60,
                            flexShrink: 0,
                            zIndex: 10,
                            transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                            '& .MuiDrawer-paper': {
                                width: leftPanelOpen ? 300 : 60,
                                position: 'relative',
                                height: '100%',
                                borderRight: '1px solid',
                                borderColor: '#E5E7EB',
                                bgcolor: '#FFFFFF',
                                boxShadow: 'none',
                                overflow: leftPanelOpen ? 'hidden' : 'hidden',
                                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                flexDirection: 'column',
                            },
                        }}
                    >
                        {/* Toggle Button on Sidebar */}
                        <Box
                            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                            sx={{
                                p: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#6B7280',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    color: '#1F2937',
                                    bgcolor: '#F3F4F6',
                                },
                            }}
                        >
                            {leftPanelOpen ? <CloseIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
                        </Box>

                        {leftPanelOpen && (
                            <Box sx={{ flex: 1, overflow: 'auto', pb: 2 }}>
                                <ModulePalette layoutType={layout.type} />
                            </Box>
                        )}
                    </Drawer>

                    {/* Main Canvas Area */}
                    <Box sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden',
                        bgcolor: '#F0F2F5',
                    }}>
                        {/* Canvas Background with Grid */}
                        <Box sx={{
                            flex: 1,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            p: { xs: 2, sm: 3, md: 4 },
                            backgroundImage: 'radial-gradient(circle, #D1D5DB 0.5px, transparent 0.5px)',
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0',
                            position: 'relative',
                            '&::-webkit-scrollbar': {
                                width: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                                bg: 'transparent',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                bgcolor: '#D1D5DB',
                                borderRadius: '4px',
                                '&:hover': {
                                    bgcolor: '#9CA3AF',
                                },
                            },
                        }}>
                            {/* Canvas Content Container */}
                            <Box
                                sx={{
                                    maxWidth: previewDevice === 'mobile' ? 390 : previewDevice === 'tablet' ? 820 : 1280,
                                    mx: 'auto',
                                    width: '100%',
                                    position: 'relative',
                                }}
                            >
                                {layout.sections.length === 0 ? (
                                    <Box
                                        sx={{
                                            py: 12,
                                            px: 4,
                                            textAlign: 'center',
                                            bgcolor: '#FFFFFF',
                                            border: '2px dashed #D1D5DB',
                                            borderRadius: 2.5,
                                            transition: 'all 0.3s',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: 56,
                                                height: 56,
                                                borderRadius: '50%',
                                                bgcolor: '#F3F4F6',
                                                mb: 2,
                                                mx: 'auto',
                                            }}
                                        >
                                            <GridViewIcon sx={{ fontSize: 28, color: '#9CA3AF' }} />
                                        </Box>
                                        <Typography variant="h6" sx={{ mb: 1, color: '#1F2937', fontWeight: 600 }}>
                                            No Sections Yet
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 3, color: '#6B7280' }}>
                                            Start building your layout by adding a section
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            onClick={handleAddSection}
                                            sx={{
                                                bgcolor: '#3B82F6',
                                                '&:hover': { bgcolor: '#2563EB' },
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                px: 3,
                                            }}
                                        >
                                            Add First Section
                                        </Button>
                                    </Box>
                                ) : (
                                    <SectionList
                                        sections={layout.sections}
                                        selectedSectionId={selectedSectionId}
                                        selectedModuleId={selectedModuleId}
                                        selectedColumnId={selectedColumnId}
                                        onSelectSection={(id) => {
                                            if (selectedSectionId === id && !selectedColumnId && !selectedModuleId) {
                                                setSelectedSectionId(null);
                                                setRightPanelOpen(false);
                                            } else {
                                                setSelectedSectionId(id);
                                                setSelectedModuleId(null);
                                                setSelectedColumnId(null);
                                                setRightPanelOpen(true);
                                            }
                                        }}
                                        onCloneSection={handleCloneSection}
                                        onSelectModule={(sectionId, moduleId) => {
                                            if (selectedModuleId === moduleId) {
                                                setSelectedModuleId(null);
                                                setRightPanelOpen(false);
                                            } else {
                                                setSelectedSectionId(sectionId);
                                                setSelectedModuleId(moduleId);
                                                setSelectedColumnId(null);
                                                setRightPanelOpen(true);
                                            }
                                        }}
                                        onDeleteModule={handleDeleteModule}
                                        onCloneModule={handleCloneModule}
                                        onAddSection={handleAddSection}
                                        onSelectColumn={handleSelectColumn}
                                    />
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {/* Right Sidebar - Properties Panel */}
                    <Drawer
                        variant="temporary"
                        anchor="right"
                        open={rightPanelOpen && !!(selectedSectionId || selectedModuleId || selectedColumnId)}
                        onClose={() => setRightPanelOpen(false)}
                        sx={{
                            zIndex: 1200,
                            '& .MuiDrawer-paper': {
                                width: { xs: '90%', sm: 400, md: 360 },
                                maxWidth: 500,
                                borderLeft: '1px solid',
                                borderColor: '#E5E7EB',
                                bgcolor: '#FFFFFF',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                                display: 'flex',
                                flexDirection: 'column',
                            },
                            '& .MuiBackdrop-root': {
                                backdropFilter: 'blur(4px)',
                                bgcolor: 'rgba(0, 0, 0, 0.3)',
                            },
                        }}
                    >
                        {/* Properties Panel Header */}
                        <Box
                            sx={{
                                p: 2,
                                borderBottom: '1px solid',
                                borderColor: '#E5E7EB',
                                bgcolor: '#FAFBFC',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SettingsIcon sx={{ fontSize: 20, color: '#3B82F6' }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1F2937' }}>
                                    {selectedModule ? 'Module Settings' : selectedColumnId ? 'Column Settings' : selectedSection ? 'Section Settings' : 'Properties'}
                                </Typography>
                            </Box>
                            <IconButton
                                size="small"
                                onClick={() => setRightPanelOpen(false)}
                                sx={{
                                    color: '#6B7280',
                                    '&:hover': { bgcolor: '#E5E7EB', color: '#1F2937' },
                                }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>

                        {/* Properties Panel Content */}
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            {selectedModuleId && selectedSection && selectedModule ? (
                                <ModuleEditor
                                    module={selectedModule}
                                    onChange={(updatedModule) => updateModule(selectedSection.id, selectedModule.id, updatedModule)}
                                    onDelete={() => handleDeleteModule(selectedSection.id, selectedModule.id)}
                                    storeId={typeof layout.storeId === 'object' ? layout.storeId._id : layout.storeId}
                                />
                            ) : selectedColumnId && selectedSection ? (
                                (() => {
                                    const column = selectedSection.columns?.find(c => c.id === selectedColumnId);
                                    if (column) {
                                        return (
                                            <ColumnEditor
                                                column={column}
                                                onChange={(updatedColumn) => {
                                                    if (selectedSection.columns) {
                                                        const newColumns = selectedSection.columns.map(c =>
                                                            c.id === updatedColumn.id ? updatedColumn : c
                                                        );
                                                        updateSection(selectedSection.id, { columns: newColumns });
                                                    }
                                                }}
                                                copiedStyle={copiedColumnStyle}
                                                onCopyStyle={setCopiedColumnStyle}
                                            />
                                        );
                                    }
                                    return <Typography color="text.secondary">Column not found</Typography>;
                                })()
                            ) : selectedSectionId && selectedSection ? (
                                <Box sx={{ p: 2 }}>
                                    <SectionEditor
                                        section={selectedSection}
                                        onChange={(updatedSection) => updateSection(selectedSection.id, updatedSection)}
                                        onDelete={() => handleDeleteSection(selectedSection.id)}
                                        copiedStyle={copiedSectionStyle}
                                        onCopyStyle={setCopiedSectionStyle}
                                    />
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary', gap: 1 }}>
                                    <SettingsIcon sx={{ fontSize: 40, opacity: 0.2 }} />
                                    <Typography variant="body2">Select an element to edit</Typography>
                                </Box>
                            )}
                        </Box>
                    </Drawer>
                </Box>

                {/* Drag Overlay */}
                <DragOverlay dropAnimation={null} style={{ zIndex: 9999 }}>
                    {renderDragOverlay()}
                </DragOverlay >

                <ConfirmDialog
                    open={confirmOpen}
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    onConfirm={confirmConfig.onConfirm}
                    onCancel={() => setConfirmOpen(false)}
                    severity="error"
                    confirmLabel="Delete"
                />

                {/* Layout Settings Dialog */}
                <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700, color: '#1F2937' }}>Layout Settings</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
                            <TextField
                                label="Layout Name"
                                value={layout.name}
                                onChange={(e) => onChange({ ...layout, name: e.target.value })}
                                fullWidth
                                required
                                variant="outlined"
                            />
                            <StoreAutocomplete
                                value={typeof layout.storeId === 'object' ? layout.storeId._id : layout.storeId}
                                onChange={(value) => onChange({ ...layout, storeId: value as string })}
                                required
                            />
                            <TextField
                                label="Description"
                                value={layout.description || ''}
                                onChange={(e) => onChange({ ...layout, description: e.target.value })}
                                fullWidth
                                multiline
                                rows={2}
                                variant="outlined"
                            />
                            {slugSupportedTypes.includes(layout.type) && (
                                <TextField
                                    label="Page Slug (Optional)"
                                    value={layout.slug || ''}
                                    onChange={(e) => onChange({ ...layout, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-/]/g, '') })}
                                    fullWidth
                                    placeholder="e.g., about, marble-statues"
                                    helperText="Leave empty for default layout. Only enter slug, not prefix."
                                    variant="outlined"
                                />
                            )}
                            <TextField
                                select
                                label="Status"
                                value={layout.status}
                                onChange={(e) => onChange({ ...layout, status: e.target.value as 'draft' | 'published' })}
                                fullWidth
                                variant="outlined"
                            >
                                <MenuItem value="draft">Draft</MenuItem>
                                <MenuItem value="published">Published</MenuItem>
                            </TextField>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={layout.isDefault}
                                        onChange={(e) => onChange({ ...layout, isDefault: e.target.checked })}
                                    />
                                }
                                label="Set as default layout for this type"
                                sx={{ ml: 0 }}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setSettingsOpen(false)}>Close</Button>
                    </DialogActions>
                </Dialog>
            </DndContext >
        </Box >
    );
}
