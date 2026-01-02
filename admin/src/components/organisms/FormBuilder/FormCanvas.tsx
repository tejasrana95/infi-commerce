'use client';

import { Box, Paper, Typography, IconButton, Chip } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { FormSection, FormField } from '@/types';
import { getFieldDefinition } from './types';
import { useState } from 'react';

interface FormCanvasProps {
    sections: FormSection[];
    selectedSectionId: string | null;
    selectedFieldId: string | null;
    onSelectSection: (id: string) => void;
    onSelectField: (sectionId: string, fieldId: string) => void;
    onDeleteField: (sectionId: string, fieldId: string) => void;
    errors?: Record<string, string>;
}

interface FieldItemProps {
    field: FormField;
    sectionId: string;
    columnId?: string;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
    error?: string;
}

function FieldItem({ field, sectionId, columnId, isSelected, onSelect, onDelete, error }: FieldItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: field.id,
        data: {
            type: 'field',
            field,
            sectionId,
            columnId,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const definition = getFieldDefinition(field.type);

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            onClick={onSelect}
            sx={{
                p: 1.25,
                mb: 1,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: error ? 'error.main' : (isSelected ? 'primary.main' : 'rgba(0,0,0,0.08)'),
                bgcolor: error ? 'error.50' : (isSelected ? 'primary.50' : 'background.paper'),
                borderRadius: 1.5,
                boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.1)' : '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    borderColor: error ? 'error.main' : 'primary.light',
                    bgcolor: error ? 'error.50' : 'grey.50',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box {...attributes} {...listeners} sx={{ cursor: 'grab', display: 'flex' }}>
                    <DragIndicatorIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                        {field.label}
                        {field.required && <span style={{ color: 'red' }}> *</span>}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {definition?.label} • {field.name}
                    </Typography>
                </Box>
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    color="error"
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>
            {error && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {error}
                </Typography>
            )}
        </Paper>
    );
}

interface DropZoneProps {
    id: string;
    sectionId: string;
    columnId?: string;
}

function DropZone({ id, sectionId, columnId }: DropZoneProps) {
    const { setNodeRef, isOver } = useDroppable({
        id,
        data: {
            type: 'section-drop',
            sectionId: columnId || sectionId,
        },
    });

    return (
        <Box
            ref={setNodeRef}
            sx={{
                minHeight: 50,
                border: '1px dashed',
                borderColor: isOver ? 'primary.main' : 'rgba(0,0,0,0.12)',
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: isOver ? 'primary.50' : 'rgba(0,0,0,0.02)',
                transition: 'all 0.2s',
            }}
        >
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {isOver ? 'Drop here' : 'Empty'}
            </Typography>
        </Box>
    );
}

interface SectionItemProps {
    section: FormSection;
    isSelected: boolean;
    selectedFieldId: string | null;
    onSelectSection: () => void;
    onSelectField: (fieldId: string) => void;
    onDeleteField: (fieldId: string) => void;
    errors: Record<string, string>;
    sectionIndex: number;
}

function SectionItem({
    section,
    isSelected,
    selectedFieldId,
    onSelectSection,
    onSelectField,
    onDeleteField,
    errors,
    sectionIndex,
}: SectionItemProps) {
    const [expanded, setExpanded] = useState(true);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: section.id,
        data: {
            type: 'section',
            section,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const hasColumns = section.type !== 'full-width' && section.columns && section.columns.length > 0;

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            sx={{
                mb: 2,
                border: '1px solid',
                borderColor: isSelected ? 'primary.main' : 'rgba(0,0,0,0.08)',
                bgcolor: 'background.paper',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: isSelected ? '0 8px 24px rgba(0, 0, 0, 0.08)' : '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.3s ease',
            }}
        >
            {/* Section Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    bgcolor: isSelected ? 'primary.50' : 'grey.50',
                    borderBottom: expanded ? '1px solid' : 'none',
                    borderColor: 'rgba(0,0,0,0.05)',
                }}
            >
                <Box
                    {...attributes}
                    {...listeners}
                    sx={{
                        cursor: 'grab',
                        display: 'flex',
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main' }
                    }}
                >
                    <DragIndicatorIcon fontSize="small" />
                </Box>

                <Box
                    onClick={onSelectSection}
                    sx={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1 }}
                >
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                        {section.name || 'Untitled Section'}
                    </Typography>
                    <Chip
                        label={section.type}
                        size="small"
                        sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    />
                </Box>

                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(!expanded);
                    }}
                    sx={{
                        transition: 'transform 0.3s ease',
                        transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)',
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        width: 24,
                        height: 24
                    }}
                >
                    <ExpandLessIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>

            {/* Section Content */}
            {expanded && (
                <Box sx={{ p: 2, bgcolor: isSelected ? 'rgba(37, 99, 235, 0.02)' : 'transparent' }}>
                    {hasColumns ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: section.columns!.map(c => `${c.width}%`).join(' '), gap: 2 }}>
                            {section.columns!.map((column) => (
                                <Box key={column.id}>
                                    {column.fields.length > 0 ? (
                                        column.fields.map((field, fieldIndex) => (
                                            <FieldItem
                                                key={field.id}
                                                field={field}
                                                sectionId={section.id}
                                                columnId={column.id}
                                                isSelected={selectedFieldId === field.id}
                                                onSelect={() => onSelectField(field.id)}
                                                onDelete={() => onDeleteField(field.id)}
                                                error={errors[`sections[${sectionIndex}].columns[${section.columns!.indexOf(column)}].fields[${fieldIndex}].label`] ||
                                                    errors[`sections[${sectionIndex}].columns[${section.columns!.indexOf(column)}].fields[${fieldIndex}].name`]}
                                            />
                                        ))
                                    ) : (
                                        <DropZone
                                            id={`drop-${column.id}`}
                                            sectionId={section.id}
                                            columnId={column.id}
                                        />
                                    )}
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <Box>
                            {section.fields.length > 0 ? (
                                section.fields.map((field, fieldIndex) => (
                                    <FieldItem
                                        key={field.id}
                                        field={field}
                                        sectionId={section.id}
                                        isSelected={selectedFieldId === field.id}
                                        onSelect={() => onSelectField(field.id)}
                                        onDelete={() => onDeleteField(field.id)}
                                        error={errors[`sections[${sectionIndex}].fields[${fieldIndex}].label`] ||
                                            errors[`sections[${sectionIndex}].fields[${fieldIndex}].name`]}
                                    />
                                ))
                            ) : (
                                <DropZone
                                    id={`drop-${section.id}`}
                                    sectionId={section.id}
                                />
                            )}
                        </Box>
                    )}
                </Box>
            )}
        </Paper>
    );
}

export default function FormCanvas({
    sections,
    selectedSectionId,
    selectedFieldId,
    onSelectSection,
    onSelectField,
    onDeleteField,
    errors = {},
}: FormCanvasProps) {
    return (
        <Box>
            {sections.map((section, index) => (
                <SectionItem
                    key={section.id}
                    section={section}
                    isSelected={selectedSectionId === section.id}
                    selectedFieldId={selectedFieldId}
                    onSelectSection={() => onSelectSection(section.id)}
                    onSelectField={(fieldId) => onSelectField(section.id, fieldId)}
                    onDeleteField={(fieldId) => onDeleteField(section.id, fieldId)}
                    errors={errors}
                    sectionIndex={index}
                />
            ))}
        </Box>
    );
}
