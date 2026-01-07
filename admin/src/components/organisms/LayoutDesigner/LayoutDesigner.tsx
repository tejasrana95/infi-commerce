'use client';

import { useState, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Chip,
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
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import TabletIcon from '@mui/icons-material/Tablet';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MenuIcon from '@mui/icons-material/Menu';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import { useNotification } from '@/contexts/NotificationContext';

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
import { Layout, LayoutSection, LayoutModule, ModuleType, LayoutType } from '@/types';
import ModulePalette from './ModulePalette';
import SectionList from './SectionList';
import SectionEditor from './SectionEditor';
import ModuleEditor from './ModuleEditor';
import FloatingToolbar from './FloatingToolbar';
import PropertiesPanel from './PropertiesPanel';
import { createSection, createModule, getModuleDefinition } from './types';
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
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeDragData, setActiveDragData] = useState<any>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const { showNotification } = useNotification();

    // Responsive state
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md')); // <900px
    const isTablet = useMediaQuery(theme.breakpoints.down('lg')); // <1200px
    const [leftPanelOpen, setLeftPanelOpen] = useState(false); // Start hidden
    const [rightPanelOpen, setRightPanelOpen] = useState(!isMobile);

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
        setConfirmConfig({
            title: 'Delete Section',
            message: 'Are you sure you want to delete this section? This action cannot be undone.',
            onConfirm: () => {
                updateSections(layout.sections.filter((s) => s.id !== sectionId));
                if (selectedSectionId === sectionId) {
                    setSelectedSectionId(null);
                    setSelectedModuleId(null);
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

        // Target container resolution
        let overSection: LayoutSection | undefined;
        if (overData?.type === 'section') {
            overSection = overData.section;
        } else if (overData?.type === 'section-drop' && overData.sectionId) {
            // Find section containing this drop zone (could be main section or column)
            const s = layout.sections.find(s => s.id === overData.sectionId);
            if (s) {
                overSection = s;
            } else {
                overSection = layout.sections.find(s => s.columns?.some(c => c.id === overData.sectionId));
            }
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
                    const containerId = overData.sectionId;
                    const targetCol = overSection.columns?.find(c => c.id === containerId);
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
        <Box sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#FAFAFA', position: 'relative', height: '100%' }}>
            {/* Floating Toolbar - Sticky at top */}
            <Box
                sx={{
                    zIndex: 1100,
                    p: { xs: 1, md: 2 },
                    bgcolor: '#FAFAFA',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
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
                    isSaving={isSaving}
                />
            </Box>

            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <Box sx={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
                    {/* Module Palette Drawer */}
                    <Drawer
                        variant="persistent"
                        anchor="left"
                        open={leftPanelOpen}
                        sx={{
                            width: leftPanelOpen ? 280 : 0,
                            flexShrink: 0,
                            zIndex: 1,
                            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '& .MuiDrawer-paper': {
                                width: 280,
                                position: 'absolute',
                                top: 0,
                                height: '100%',
                                borderRight: '1px solid',
                                borderColor: 'divider',
                                boxShadow: '2px 0 8px rgba(0, 0, 0, 0.08)',
                                overflow: 'hidden',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            },
                        }}
                    >
                        <Box sx={{ p: 1, pt: 2, height: '100%', overflow: 'auto' }}>
                            <ModulePalette layoutType={layout.type} />
                        </Box>
                    </Drawer>

                    {/* Main Canvas */}
                    <Box sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        p: { xs: 2, md: 4 },
                        bgcolor: '#FAFAFA',
                        backgroundImage: 'radial-gradient(#E5E7EB 0.5px, transparent 0.5px)',
                        backgroundSize: '16px 16px',
                        overflowY: 'auto',
                        height: '100%',
                    }}>
                        <Box
                            sx={{
                                maxWidth: previewDevice === 'mobile' ? 375 : previewDevice === 'tablet' ? 768 : 1200,
                                mx: 'auto',
                                width: '100%',
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
                            )}</Box>
                    </Box>
                </Box>

                {/* Properties Panel - Smooth Drawer */}
                <PropertiesPanel
                    open={!!(selectedSectionId || selectedModuleId)}
                    onClose={() => {
                        setSelectedSectionId(null);
                        setSelectedModuleId(null);
                    }}
                    selectedSection={selectedSection}
                    selectedModule={selectedModule}
                    selectedSectionId={selectedSectionId}
                    onUpdateSection={updateSection}
                    onUpdateModule={updateModule}
                    onDeleteSection={handleDeleteSection}
                    onDeleteModule={handleDeleteModule}
                    storeId={typeof layout.storeId === 'object' ? layout.storeId._id : layout.storeId}
                    copiedStyle={copiedSectionStyle}
                    onCopyStyle={setCopiedSectionStyle}
                />

                {/* Drag Overlay - renders the dragged item visually */}
                <DragOverlay dropAnimation={null} style={{ zIndex: 9999 }}>
                    {renderDragOverlay()}
                </DragOverlay>

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
                    <DialogTitle>Layout Settings</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <TextField
                                label="Layout Name"
                                value={layout.name}
                                onChange={(e) => onChange({ ...layout, name: e.target.value })}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Description"
                                value={layout.description || ''}
                                onChange={(e) => onChange({ ...layout, description: e.target.value })}
                                fullWidth
                                multiline
                                rows={2}
                            />
                            {slugSupportedTypes.includes(layout.type) && (
                                <TextField
                                    label="Page Slug (Optional)"
                                    value={layout.slug || ''}
                                    onChange={(e) => onChange({ ...layout, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-/]/g, '') })}
                                    fullWidth
                                    placeholder="e.g., about, marble-statues"
                                    helperText="Leave empty for a default layout. Enter a slug to create a page-specific layout and only slug not the prefix like category, product, etc."
                                />
                            )}
                            <TextField
                                select
                                label="Status"
                                value={layout.status}
                                onChange={(e) => onChange({ ...layout, status: e.target.value as 'draft' | 'published' })}
                                fullWidth
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
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setSettingsOpen(false)}>Close</Button>
                    </DialogActions>
                </Dialog>
            </DndContext >
        </Box >
    );
}
