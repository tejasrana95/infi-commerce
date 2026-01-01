'use client';

import { useState, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Drawer,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MenuIcon from '@mui/icons-material/Menu';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
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
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FormSection, FormField } from '@/types';
import FieldPalette from './FieldPalette';
import FormCanvas from './FormCanvas';
import FieldEditor from './FieldEditor';
import SectionEditor from './SectionEditor';
import { createField, createFormSection, getFieldDefinition } from './types';

interface FormBuilderProps {
    sections: FormSection[];
    onChange: (sections: FormSection[]) => void;
    errors?: Record<string, string>;
}

export default function FormBuilder({ sections, onChange, errors = {} }: FormBuilderProps) {
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeDragData, setActiveDragData] = useState<any>(null);

    // Responsive state
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md')); // <900px
    const isTablet = useMediaQuery(theme.breakpoints.down('lg')); // <1200px
    const [leftPanelOpen, setLeftPanelOpen] = useState(!isMobile);
    const [rightPanelOpen, setRightPanelOpen] = useState(!isMobile);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    // Find selected section and field
    const selectedSection = sections.find((s) => s.id === selectedSectionId);
    const selectedField = selectedSection?.fields.find((f) => f.id === selectedFieldId) ||
        selectedSection?.columns?.flatMap(c => c.fields).find(f => f.id === selectedFieldId);

    // Update a specific section
    const updateSection = useCallback(
        (sectionId: string, updates: Partial<FormSection>) => {
            const newSections = sections.map((s) =>
                s.id === sectionId ? { ...s, ...updates } : s
            );
            onChange(newSections);
        },
        [sections, onChange]
    );

    // Update a field within a section
    const updateField = useCallback(
        (sectionId: string, fieldId: string, updates: Partial<FormField>) => {
            const newSections = sections.map((s) => {
                if (s.id !== sectionId) return s;

                // Check if field is in main fields list
                if (s.fields.some(f => f.id === fieldId)) {
                    return {
                        ...s,
                        fields: s.fields.map((f) =>
                            f.id === fieldId ? { ...f, ...updates } : f
                        ),
                    };
                }

                // Check if field is in columns
                if (s.columns) {
                    return {
                        ...s,
                        columns: s.columns.map(col => ({
                            ...col,
                            fields: col.fields.map(f =>
                                f.id === fieldId ? { ...f, ...updates } : f
                            )
                        }))
                    };
                }

                return s;
            });
            onChange(newSections);
        },
        [sections, onChange]
    );

    // Add new section
    const handleAddSection = () => {
        const newSection = createFormSection('full-width');
        newSection.order = sections.length;
        onChange([...sections, newSection]);
        setSelectedSectionId(newSection.id);
        setSelectedFieldId(null);
    };

    // Delete section
    const handleDeleteSection = (sectionId: string) => {
        onChange(sections.filter((s) => s.id !== sectionId));
        if (selectedSectionId === sectionId) {
            setSelectedSectionId(null);
            setSelectedFieldId(null);
        }
    };

    // Delete field
    const handleDeleteField = (sectionId: string, fieldId: string) => {
        const section = sections.find((s) => s.id === sectionId);
        if (!section) return;

        let updates: Partial<FormSection> = {};

        if (section.columns && section.columns.length > 0) {
            updates = {
                columns: section.columns.map(col => ({
                    ...col,
                    fields: col.fields.filter(f => f.id !== fieldId)
                }))
            };
        } else {
            updates = {
                fields: section.fields.filter((f) => f.id !== fieldId)
            };
        }

        updateSection(sectionId, updates);
        if (selectedFieldId === fieldId) {
            setSelectedFieldId(null);
        }
    };

    // Find which section contains a field
    const findSectionByFieldId = (fieldId: string): FormSection | undefined => {
        return sections.find((s) =>
            s.fields.some((f) => f.id === fieldId) ||
            s.columns?.some(c => c.fields.some(f => f.id === fieldId))
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
        if (activeData?.type === 'palette-field' && activeData.fieldType) {
            if (overData?.type === 'section-drop' && overData.sectionId) {
                const newField = createField(activeData.fieldType as FormField['type']);
                const sectionId = overData.sectionId;

                // Find if target is a section or a column
                const section = sections.find(s => s.id === sectionId);

                if (section) {
                    // Dropped directly on a non-split section
                    newField.order = section.fields.length;
                    updateSection(sectionId, {
                        fields: [...section.fields, newField],
                    });
                    setSelectedSectionId(sectionId);
                    setSelectedFieldId(newField.id);
                } else {
                    // Check if it's a column ID
                    const sectionWithColumn = sections.find(s => s.columns?.some(c => c.id === sectionId));
                    if (sectionWithColumn && sectionWithColumn.columns) {
                        const targetColumn = sectionWithColumn.columns.find(c => c.id === sectionId);
                        if (targetColumn) {
                            newField.order = targetColumn.fields.length;
                        }
                        updateSection(sectionWithColumn.id, {
                            columns: sectionWithColumn.columns.map(col =>
                                col.id === sectionId
                                    ? { ...col, fields: [...col.fields, newField] }
                                    : col
                            )
                        });
                        setSelectedSectionId(sectionWithColumn.id);
                        setSelectedFieldId(newField.id);
                    }
                }
            }
            return;
        }

        // Case 2: Reordering sections
        if (activeData?.type === 'section' && overData?.type === 'section') {
            const oldIndex = sections.findIndex((s) => s.id === active.id);
            const newIndex = sections.findIndex((s) => s.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                onChange(arrayMove(sections, oldIndex, newIndex));
            }
            return;
        }

        // Case 3: Reordering fields
        const activeSection = findSectionByFieldId(active.id as string);
        const overSection = findSectionByFieldId(over.id as string);

        if (activeSection) {
            // Determine source container
            let sourceFields = activeSection.fields;
            let sourceColumnId: string | null = null;

            if (activeSection.columns) {
                const col = activeSection.columns.find(c => c.fields.some(f => f.id === active.id));
                if (col) {
                    sourceFields = col.fields;
                    sourceColumnId = col.id;
                }
            }

            // Determine target container
            let targetSection = overSection;
            let targetFields: FormField[] | null = null;
            let targetColumnId: string | null = null;

            if (overSection) {
                targetFields = overSection.fields;
                if (overSection.columns) {
                    const col = overSection.columns.find(c => c.fields.some(f => f.id === over.id));
                    if (col) {
                        targetFields = col.fields;
                        targetColumnId = col.id;
                    }
                }
            } else if (overData?.type === 'section-drop') {
                const containerId = overData.sectionId;
                targetSection = sections.find(s => s.id === containerId);

                if (targetSection) {
                    targetFields = targetSection.fields;
                } else {
                    targetSection = sections.find(s => s.columns?.some(c => c.id === containerId));
                    if (targetSection && targetSection.columns) {
                        const col = targetSection.columns.find(c => c.id === containerId);
                        if (col) {
                            targetFields = col.fields;
                            targetColumnId = col.id;
                        }
                    }
                }
            }

            if (targetSection && targetFields) {
                const oldIndex = sourceFields.findIndex(f => f.id === active.id);
                const newIndex = overData?.type === 'section-drop'
                    ? targetFields.length
                    : targetFields.findIndex(f => f.id === over.id);

                // Same container reorder
                if (activeSection.id === targetSection.id && sourceColumnId === targetColumnId) {
                    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                        const reordered = arrayMove(sourceFields, oldIndex, newIndex);

                        if (sourceColumnId && activeSection.columns) {
                            updateSection(activeSection.id, {
                                columns: activeSection.columns.map(c =>
                                    c.id === sourceColumnId ? { ...c, fields: reordered } : c
                                )
                            });
                        } else {
                            updateSection(activeSection.id, { fields: reordered });
                        }
                    }
                }
                // Move between containers
                else {
                    const item = sourceFields[oldIndex];
                    const newSourceFields = sourceFields.filter(f => f.id !== active.id);
                    const newTargetFields = [...targetFields];

                    if (newIndex >= 0 && newIndex < newTargetFields.length) {
                        newTargetFields.splice(newIndex, 0, item);
                    } else {
                        newTargetFields.push(item);
                    }

                    const newSections = sections.map(s => {
                        let newS = { ...s };

                        if (s.id === activeSection.id) {
                            if (sourceColumnId && s.columns) {
                                newS.columns = s.columns.map(c => c.id === sourceColumnId ? { ...c, fields: newSourceFields } : c);
                            } else {
                                newS.fields = newSourceFields;
                            }
                        }

                        if (s.id === targetSection!.id) {
                            if (targetColumnId && newS.columns) {
                                newS.columns = newS.columns.map(c => c.id === targetColumnId ? { ...c, fields: newTargetFields } : c);
                            } else if (!targetColumnId) {
                                newS.fields = newTargetFields;
                            }
                        }

                        return newS;
                    });

                    onChange(newSections);
                }
            }
        }
    };

    // Custom collision detection
    const collisionDetection = useCallback((args: any) => {
        if (activeDragData?.type === 'palette-field') {
            const pointerCollisions = pointerWithin(args);
            const dropZoneCollisions = pointerCollisions.filter((c: any) =>
                c.id?.toString().startsWith('drop-')
            );
            if (dropZoneCollisions.length > 0) return dropZoneCollisions;
            if (pointerCollisions.length > 0) return pointerCollisions;
        }
        return closestCorners(args);
    }, [activeDragData]);

    // Render drag overlay
    const renderDragOverlay = () => {
        if (!activeId || !activeDragData) return null;

        if (activeDragData.type === 'palette-field') {
            const definition = getFieldDefinition(activeDragData.fieldType);
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
                        {definition?.label || activeDragData.fieldType}
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
            <Box sx={{ display: 'flex', height: { xs: 'calc(100vh - 220px)', sm: 'calc(100vh - 250px)', md: 'calc(100vh - 300px)' }, overflow: 'hidden' }}>
                {/* Left Panel - Field Palette (Desktop) */}
                {!isMobile && (
                    <Paper
                        sx={{
                            width: leftPanelOpen ? 280 : 0,
                            borderRadius: 0,
                            borderRight: leftPanelOpen ? '1px solid' : 'none',
                            borderColor: 'divider',
                            overflow: leftPanelOpen ? 'auto' : 'hidden',
                            flexShrink: 0,
                            transition: 'width 0.3s ease',
                        }}
                    >
                        {leftPanelOpen && (
                            <Box sx={{ p: 2, width: 280 }}>
                                <FieldPalette />
                            </Box>
                        )}
                    </Paper>
                )}

                {/* Left Drawer - Field Palette (Mobile/Tablet) */}
                <Drawer
                    anchor="left"
                    open={isMobile && leftPanelOpen}
                    onClose={() => setLeftPanelOpen(false)}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            width: { xs: '85%', sm: 320 },
                            maxWidth: 400,
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="h6" fontWeight={600}>Field Palette</Typography>
                        <IconButton size="small" onClick={() => setLeftPanelOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Box sx={{ p: 2 }}>
                        <FieldPalette />
                    </Box>
                </Drawer>

                {/* Middle Panel - Form Canvas */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Paper
                        sx={{
                            p: 2,
                            borderRadius: 0,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
                            {/* Panel Toggles */}
                            <IconButton
                                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                                size="small"
                                color={leftPanelOpen ? 'primary' : 'default'}
                                title="Toggle Field Palette"
                            >
                                <MenuIcon />
                            </IconButton>
                            <IconButton
                                onClick={() => setRightPanelOpen(!rightPanelOpen)}
                                size="small"
                                color={rightPanelOpen ? 'primary' : 'default'}
                                title="Toggle Editor Panel"
                            >
                                <TuneIcon />
                            </IconButton>

                            <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                                Form Builder
                            </Typography>
                        </Box>

                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={handleAddSection}
                            size="small"
                        >
                            Add Section
                        </Button>
                    </Paper>

                    <Box
                        sx={{
                            flex: 1,
                            overflow: 'auto',
                            p: 3,
                            bgcolor: 'grey.50',
                        }}
                    >
                        {sections.length === 0 ? (
                            <Box
                                sx={{
                                    py: 8,
                                    textAlign: 'center',
                                    border: '2px dashed',
                                    borderColor: 'grey.300',
                                    borderRadius: 2,
                                    bgcolor: 'background.paper',
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
                            <SortableContext
                                items={sections.map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <FormCanvas
                                    sections={sections}
                                    selectedSectionId={selectedSectionId}
                                    selectedFieldId={selectedFieldId}
                                    onSelectSection={(id) => {
                                        setSelectedSectionId(id);
                                        setSelectedFieldId(null);
                                        // Auto-open right panel on mobile when selecting
                                        if (isMobile) setRightPanelOpen(true);
                                    }}
                                    onSelectField={(sectionId, fieldId) => {
                                        setSelectedSectionId(sectionId);
                                        setSelectedFieldId(fieldId);
                                        // Auto-open right panel on mobile when selecting
                                        if (isMobile) setRightPanelOpen(true);
                                    }}
                                    onDeleteField={handleDeleteField}
                                    errors={errors}
                                />
                            </SortableContext>
                        )}
                    </Box>
                </Box>

                {/* Right Panel - Field/Section Editor (Desktop) */}
                {!isMobile && (
                    <Paper
                        sx={{
                            width: rightPanelOpen ? 320 : 0,
                            borderRadius: 0,
                            borderLeft: rightPanelOpen ? '1px solid' : 'none',
                            borderColor: 'divider',
                            overflow: rightPanelOpen ? 'auto' : 'hidden',
                            flexShrink: 0,
                            transition: 'width 0.3s ease',
                        }}
                    >
                        {rightPanelOpen && (
                            <Box sx={{ p: 2, width: 320 }}>
                                <Typography variant="subtitle2" gutterBottom fontWeight={600} color="text.secondary">
                                    {selectedField ? 'FIELD SETTINGS' : selectedSection ? 'SECTION SETTINGS' : 'EDITOR'}
                                </Typography>
                                {selectedField && selectedSectionId ? (
                                    <FieldEditor
                                        field={selectedField}
                                        onChange={(updated) =>
                                            updateField(selectedSectionId, selectedField.id, updated)
                                        }
                                        onDelete={() => handleDeleteField(selectedSectionId, selectedField.id)}
                                        errors={errors}
                                        selectedSectionId={selectedSectionId}
                                        sections={sections}
                                    />
                                ) : selectedSection ? (
                                    <SectionEditor
                                        section={selectedSection}
                                        onChange={(updated) => updateSection(selectedSection.id, updated)}
                                        onDelete={() => handleDeleteSection(selectedSection.id)}
                                        errors={errors}
                                        sectionIndex={sections.findIndex(s => s.id === selectedSection.id)}
                                    />
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Select a section or field to edit
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Paper>
                )}

                {/* Right Drawer - Field/Section Editor (Mobile/Tablet) */}
                <Drawer
                    anchor="right"
                    open={isMobile && rightPanelOpen}
                    onClose={() => setRightPanelOpen(false)}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            width: { xs: '90%', sm: 360 },
                            maxWidth: 450,
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="h6" fontWeight={600}>
                            {selectedField ? 'Field Settings' : selectedSection ? 'Section Settings' : 'Editor'}
                        </Typography>
                        <IconButton size="small" onClick={() => setRightPanelOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Box sx={{ p: 2 }}>
                        {selectedField && selectedSectionId ? (
                            <FieldEditor
                                field={selectedField}
                                onChange={(updated) =>
                                    updateField(selectedSectionId, selectedField.id, updated)
                                }
                                onDelete={() => handleDeleteField(selectedSectionId, selectedField.id)}
                                errors={errors}
                                selectedSectionId={selectedSectionId}
                                sections={sections}
                            />
                        ) : selectedSection ? (
                            <SectionEditor
                                section={selectedSection}
                                onChange={(updated) => updateSection(selectedSection.id, updated)}
                                onDelete={() => handleDeleteSection(selectedSection.id)}
                                errors={errors}
                                sectionIndex={sections.findIndex(s => s.id === selectedSection.id)}
                            />
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Select a section or field to edit
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Drawer>
            </Box>

            {/* Drag Overlay */}
            <DragOverlay dropAnimation={null} style={{ zIndex: 9999 }}>
                {renderDragOverlay()}
            </DragOverlay>
        </DndContext>
    );
}
