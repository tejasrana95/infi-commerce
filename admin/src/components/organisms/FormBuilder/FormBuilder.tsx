'use client';

import { useState, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
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
            <Box sx={{ display: 'flex', height: 'calc(100vh - 300px)', overflow: 'hidden' }}>
                {/* Left Panel - Field Palette */}
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
                        <FieldPalette />
                    </Box>
                </Paper>

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
                        <Typography variant="h6" fontWeight={600}>
                            Form Builder
                        </Typography>
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
                                    }}
                                    onSelectField={(sectionId, fieldId) => {
                                        setSelectedSectionId(sectionId);
                                        setSelectedFieldId(fieldId);
                                    }}
                                    onDeleteField={handleDeleteField}
                                    errors={errors}
                                />
                            </SortableContext>
                        )}
                    </Box>
                </Box>

                {/* Right Panel - Field/Section Editor */}
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
                </Paper>
            </Box>

            {/* Drag Overlay */}
            <DragOverlay dropAnimation={null} style={{ zIndex: 9999 }}>
                {renderDragOverlay()}
            </DragOverlay>
        </DndContext>
    );
}
