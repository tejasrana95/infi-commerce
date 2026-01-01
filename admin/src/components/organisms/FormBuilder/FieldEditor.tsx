'use client';

import {
    Box,
    Typography,
    TextField,
    FormControlLabel,
    Switch,
    Button,
    Divider,
    IconButton,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import { FormField } from '@/types';
import { getFieldDefinition } from './types';
import { useState } from 'react';

interface FieldEditorProps {
    field: FormField;
    onChange: (updates: Partial<FormField>) => void;
    onDelete: () => void;
    errors?: Record<string, string>;
    selectedSectionId?: string | null;
    sections?: any[];
}

export default function FieldEditor({ field, onChange, onDelete, errors = {}, selectedSectionId, sections = [] }: FieldEditorProps) {
    const definition = getFieldDefinition(field.type);
    const [newOption, setNewOption] = useState('');

    const hasOptions = ['select', 'radio', 'checkbox'].includes(field.type);
    const hasValidation = !['richtext', 'repeater'].includes(field.type);

    const handleAddOption = () => {
        if (!newOption.trim()) return;

        const options = field.options || [];
        onChange({
            options: [...options, { label: newOption, value: newOption.toLowerCase().replace(/\s+/g, '_') }]
        });
        setNewOption('');
    };

    const handleRemoveOption = (index: number) => {
        const options = field.options || [];
        onChange({
            options: options.filter((_, i) => i !== index)
        });
    };

    // Find field path for error matching
    const getFieldPath = () => {
        if (!selectedSectionId || !sections.length) return null;

        const sectionIndex = sections.findIndex(s => s.id === selectedSectionId);
        if (sectionIndex === -1) return null;

        const section = sections[sectionIndex];

        // Check in main fields
        const fieldIndex = section.fields?.findIndex((f: any) => f.id === field.id);
        if (fieldIndex !== -1) {
            return `sections[${sectionIndex}].fields[${fieldIndex}]`;
        }

        // Check in columns
        if (section.columns) {
            for (let colIndex = 0; colIndex < section.columns.length; colIndex++) {
                const fIndex = section.columns[colIndex].fields.findIndex((f: any) => f.id === field.id);
                if (fIndex !== -1) {
                    return `sections[${sectionIndex}].columns[${colIndex}].fields[${fIndex}]`;
                }
            }
        }

        return null;
    };

    const fieldPath = getFieldPath();
    const labelError = fieldPath ? errors[`${fieldPath}.label`] : null;
    const nameError = fieldPath ? errors[`${fieldPath}.name`] : null;

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                    Field Settings
                </Typography>
                <IconButton onClick={onDelete} color="error" size="small">
                    <DeleteIcon />
                </IconButton>
            </Box>

            <Chip label={definition?.label || field.type} color="primary" size="small" sx={{ mb: 2 }} />

            {/* Basic Settings */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Label"
                    value={field.label}
                    onChange={(e) => onChange({ label: e.target.value })}
                    fullWidth
                    required
                    size="small"
                    error={!!labelError}
                    helperText={labelError}
                />

                <TextField
                    label="Field Name"
                    value={field.name}
                    onChange={(e) => onChange({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                    fullWidth
                    required
                    size="small"
                    error={!!nameError}
                    helperText={nameError || "Unique identifier for this field"}
                />

                {!['checkbox', 'radio'].includes(field.type) && (
                    <TextField
                        label="Placeholder"
                        value={field.placeholder || ''}
                        onChange={(e) => onChange({ placeholder: e.target.value })}
                        fullWidth
                        size="small"
                    />
                )}

                <FormControlLabel
                    control={
                        <Switch
                            checked={field.required}
                            onChange={(e) => onChange({ required: e.target.checked })}
                        />
                    }
                    label="Required Field"
                />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Options for select/radio/checkbox */}
            {hasOptions && (
                <>
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2" fontWeight={600}>
                                Options
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {(field.options || []).map((option, index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <TextField
                                            value={option.label}
                                            onChange={(e) => {
                                                const options = [...(field.options || [])];
                                                options[index] = { ...option, label: e.target.value };
                                                onChange({ options });
                                            }}
                                            size="small"
                                            fullWidth
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRemoveOption(index)}
                                            color="error"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                    <TextField
                                        value={newOption}
                                        onChange={(e) => setNewOption(e.target.value)}
                                        placeholder="New option"
                                        size="small"
                                        fullWidth
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddOption();
                                            }
                                        }}
                                    />
                                    <Button
                                        onClick={handleAddOption}
                                        variant="outlined"
                                        size="small"
                                        startIcon={<AddIcon />}
                                    >
                                        Add
                                    </Button>
                                </Box>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                    <Divider sx={{ my: 2 }} />
                </>
            )}

            {/* Repeater Field Configuration */}
            {field.type === 'repeater' && (
                <>
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2" fontWeight={600}>
                                Repeater Configuration
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Define the fields that will repeat for each instance
                                </Typography>

                                {/* Sub-fields */}
                                {(field.subFields || []).map((subField, index) => (
                                    <Box key={index} sx={{
                                        p: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        bgcolor: 'grey.50'
                                    }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="caption" fontWeight={600}>
                                                Sub-field {index + 1}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    const subFields = [...(field.subFields || [])];
                                                    subFields.splice(index, 1);
                                                    onChange({ subFields });
                                                }}
                                                color="error"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <TextField
                                                label="Label"
                                                value={subField.label}
                                                onChange={(e) => {
                                                    const subFields = [...(field.subFields || [])];
                                                    subFields[index] = { ...subField, label: e.target.value };
                                                    onChange({ subFields });
                                                }}
                                                size="small"
                                                fullWidth
                                            />
                                            <TextField
                                                select
                                                label="Type"
                                                value={subField.type}
                                                onChange={(e) => {
                                                    const subFields = [...(field.subFields || [])];
                                                    subFields[index] = { ...subField, type: e.target.value as any };
                                                    onChange({ subFields });
                                                }}
                                                size="small"
                                                sx={{ minWidth: 120 }}
                                            >
                                                <MenuItem value="text">Text</MenuItem>
                                                <MenuItem value="email">Email</MenuItem>
                                                <MenuItem value="phone">Phone</MenuItem>
                                                <MenuItem value="date">Date</MenuItem>
                                            </TextField>
                                        </Box>
                                    </Box>
                                ))}

                                <Button
                                    onClick={() => {
                                        const subFields = field.subFields || [];
                                        onChange({
                                            subFields: [...subFields, {
                                                id: crypto.randomUUID(),
                                                label: `Field ${subFields.length + 1}`,
                                                type: 'text' as any,
                                                name: `field_${subFields.length + 1}`
                                            }]
                                        });
                                    }}
                                    variant="outlined"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    fullWidth
                                >
                                    Add Sub-field
                                </Button>

                                <Divider sx={{ my: 1 }} />

                                {/* Min/Max Instances */}
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        label="Min Instances"
                                        type="number"
                                        value={field.repeaterConfig?.minInstances || 0}
                                        onChange={(e) => onChange({
                                            repeaterConfig: {
                                                ...field.repeaterConfig,
                                                minInstances: parseInt(e.target.value) || 0
                                            }
                                        })}
                                        size="small"
                                        fullWidth
                                        inputProps={{ min: 0 }}
                                        helperText="Minimum required instances"
                                    />
                                    <TextField
                                        label="Max Instances"
                                        type="number"
                                        value={field.repeaterConfig?.maxInstances || ''}
                                        onChange={(e) => onChange({
                                            repeaterConfig: {
                                                ...field.repeaterConfig,
                                                maxInstances: e.target.value ? parseInt(e.target.value) : undefined
                                            }
                                        })}
                                        size="small"
                                        fullWidth
                                        inputProps={{ min: 1 }}
                                        helperText="Leave empty for unlimited"
                                    />
                                </Box>

                                <TextField
                                    label="Add Button Text"
                                    value={field.repeaterConfig?.addButtonText || 'Add Item'}
                                    onChange={(e) => onChange({
                                        repeaterConfig: {
                                            ...field.repeaterConfig,
                                            addButtonText: e.target.value
                                        }
                                    })}
                                    size="small"
                                    fullWidth
                                    placeholder="Add Item"
                                />
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                    <Divider sx={{ my: 2 }} />
                </>
            )}

            {/* Validation Rules */}
            {hasValidation && (
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2" fontWeight={600}>
                            Validation Rules
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {['text', 'textarea', 'email', 'phone'].includes(field.type) && (
                                <>
                                    <TextField
                                        label="Min Length"
                                        type="number"
                                        value={field.validation?.minLength || ''}
                                        onChange={(e) => onChange({
                                            validation: {
                                                ...field.validation,
                                                minLength: e.target.value ? parseInt(e.target.value) : undefined
                                            }
                                        })}
                                        size="small"
                                        fullWidth
                                    />
                                    <TextField
                                        label="Max Length"
                                        type="number"
                                        value={field.validation?.maxLength || ''}
                                        onChange={(e) => onChange({
                                            validation: {
                                                ...field.validation,
                                                maxLength: e.target.value ? parseInt(e.target.value) : undefined
                                            }
                                        })}
                                        size="small"
                                        fullWidth
                                    />
                                </>
                            )}

                            {['date', 'time', 'datetime'].includes(field.type) && (
                                <>
                                    <TextField
                                        label="Min Value"
                                        type={field.type}
                                        value={field.validation?.min || ''}
                                        onChange={(e) => onChange({
                                            validation: {
                                                ...field.validation,
                                                min: e.target.value ? parseFloat(e.target.value) : undefined
                                            }
                                        })}
                                        size="small"
                                        fullWidth
                                    />
                                    <TextField
                                        label="Max Value"
                                        type={field.type}
                                        value={field.validation?.max || ''}
                                        onChange={(e) => onChange({
                                            validation: {
                                                ...field.validation,
                                                max: e.target.value ? parseFloat(e.target.value) : undefined
                                            }
                                        })}
                                        size="small"
                                        fullWidth
                                    />
                                </>
                            )}

                            {['file', 'image'].includes(field.type) && (
                                <>
                                    <TextField
                                        label="Max File Size (MB)"
                                        type="number"
                                        value={field.validation?.maxFileSize ? field.validation.maxFileSize / (1024 * 1024) : ''}
                                        onChange={(e) => onChange({
                                            validation: {
                                                ...field.validation,
                                                maxFileSize: e.target.value ? parseFloat(e.target.value) * 1024 * 1024 : undefined
                                            }
                                        })}
                                        size="small"
                                        fullWidth
                                    />
                                    <TextField
                                        label="Allowed File Types"
                                        value={field.validation?.fileTypes?.join(', ') || ''}
                                        onChange={(e) => onChange({
                                            validation: {
                                                ...field.validation,
                                                fileTypes: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                                            }
                                        })}
                                        size="small"
                                        fullWidth
                                        placeholder="e.g., image/jpeg, image/png"
                                        helperText="Comma-separated MIME types"
                                    />
                                </>
                            )}

                            <TextField
                                label="Custom Pattern (Regex)"
                                value={field.validation?.pattern || ''}
                                onChange={(e) => onChange({
                                    validation: {
                                        ...field.validation,
                                        pattern: e.target.value
                                    }
                                })}
                                size="small"
                                fullWidth
                                placeholder="^[A-Za-z]+$"
                            />
                        </Box>
                    </AccordionDetails>
                </Accordion>
            )}

            <Box sx={{ mt: 3 }}>
                <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<DeleteIcon />}
                    onClick={onDelete}
                >
                    Delete Field
                </Button>
            </Box>
        </Box>
    );
}
