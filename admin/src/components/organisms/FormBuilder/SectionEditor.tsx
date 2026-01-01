'use client';

import {
    Box,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Divider,
    Slider,
    Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { FormSection } from '@/types';

interface SectionEditorProps {
    section: FormSection;
    onChange: (updates: Partial<FormSection>) => void;
    onDelete: () => void;
    errors?: Record<string, string>;
    sectionIndex?: number;
}

// Column preset configurations
const columnPresets: Record<string, { label: string; widths: number[] }> = {
    'split-2-equal': { label: '50 / 50', widths: [50, 50] },
    'split-2-60-40': { label: '60 / 40', widths: [60, 40] },
    'split-2-40-60': { label: '40 / 60', widths: [40, 60] },
    'split-2-70-30': { label: '70 / 30', widths: [70, 30] },
    'split-2-30-70': { label: '30 / 70', widths: [30, 70] },
    'split-3-equal': { label: '33 / 33 / 33', widths: [33.33, 33.33, 33.34] },
    'split-3-50-25-25': { label: '50 / 25 / 25', widths: [50, 25, 25] },
    'split-3-25-50-25': { label: '25 / 50 / 25', widths: [25, 50, 25] },
    'split-4-equal': { label: '25 / 25 / 25 / 25', widths: [25, 25, 25, 25] },
};

export default function SectionEditor({ section, onChange, onDelete, errors = {}, sectionIndex = -1 }: SectionEditorProps) {
    const handleLayoutChange = (newType: FormSection['type']) => {
        let newColumns = section.columns;

        if (newType === 'split-2') {
            newColumns = [
                { id: crypto.randomUUID(), width: 50, fields: [] },
                { id: crypto.randomUUID(), width: 50, fields: [] },
            ];
        } else if (newType === 'split-3') {
            newColumns = [
                { id: crypto.randomUUID(), width: 33.33, fields: [] },
                { id: crypto.randomUUID(), width: 33.33, fields: [] },
                { id: crypto.randomUUID(), width: 33.34, fields: [] },
            ];
        } else if (newType === 'split-4') {
            newColumns = [
                { id: crypto.randomUUID(), width: 25, fields: [] },
                { id: crypto.randomUUID(), width: 25, fields: [] },
                { id: crypto.randomUUID(), width: 25, fields: [] },
                { id: crypto.randomUUID(), width: 25, fields: [] },
            ];
        } else {
            // Full-width - no columns
            newColumns = undefined;
        }

        onChange({ type: newType, columns: newColumns });
    };

    const applyPreset = (presetKey: string) => {
        const preset = columnPresets[presetKey];
        if (!preset || !section.columns) return;

        const newColumns = section.columns.map((col, index) => ({
            ...col,
            width: preset.widths[index] || col.width,
        }));

        onChange({ columns: newColumns });
    };

    const updateColumnWidth = (index: number, newWidth: number) => {
        if (!section.columns) return;

        const newColumns = [...section.columns];
        const oldWidth = newColumns[index].width;
        const diff = newWidth - oldWidth;

        // Adjust next column (or previous if last) to maintain total 100%
        if (index < newColumns.length - 1) {
            newColumns[index + 1].width = Math.max(5, newColumns[index + 1].width - diff);
        } else if (index > 0) {
            newColumns[index - 1].width = Math.max(5, newColumns[index - 1].width - diff);
        }

        newColumns[index].width = newWidth;
        onChange({ columns: newColumns });
    };

    // Get available presets for current layout
    const getPresetsForLayout = () => {
        if (section.type === 'split-2') {
            return Object.entries(columnPresets).filter(([key]) => key.startsWith('split-2'));
        } else if (section.type === 'split-3') {
            return Object.entries(columnPresets).filter(([key]) => key.startsWith('split-3'));
        } else if (section.type === 'split-4') {
            return Object.entries(columnPresets).filter(([key]) => key.startsWith('split-4'));
        }
        return [];
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                    Section Settings
                </Typography>
                <IconButton onClick={onDelete} color="error" size="small">
                    <DeleteIcon />
                </IconButton>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Section Name (Optional)"
                    value={section.name || ''}
                    onChange={(e) => onChange({ name: e.target.value })}
                    fullWidth
                    size="small"
                    placeholder="e.g., Contact Information"
                    error={sectionIndex !== -1 && !!errors[`sections[${sectionIndex}].name`]}
                    helperText={sectionIndex !== -1 ? errors[`sections[${sectionIndex}].name`] : null}
                />

                <FormControl fullWidth size="small">
                    <InputLabel>Layout Type</InputLabel>
                    <Select
                        value={section.type}
                        label="Layout Type"
                        onChange={(e) => handleLayoutChange(e.target.value as FormSection['type'])}
                    >
                        <MenuItem value="full-width">Full Width</MenuItem>
                        <MenuItem value="split-2">2 Columns</MenuItem>
                        <MenuItem value="split-3">3 Columns</MenuItem>
                        <MenuItem value="split-4">4 Columns</MenuItem>
                    </Select>
                </FormControl>

                {section.type !== 'full-width' && section.columns && (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Column Configuration
                        </Typography>

                        {/* Preset Buttons */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {getPresetsForLayout().map(([key, preset]) => (
                                <Chip
                                    key={key}
                                    label={preset.label}
                                    onClick={() => applyPreset(key)}
                                    size="small"
                                    variant="outlined"
                                    sx={{ cursor: 'pointer' }}
                                />
                            ))}
                        </Box>

                        {/* Column Width Sliders */}
                        <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                            Adjust Column Widths (%)
                        </Typography>
                        {section.columns.map((col, index) => (
                            <Box key={col.id} sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="caption" sx={{ minWidth: 80 }}>
                                        Column {index + 1}: {col.width.toFixed(1)}%
                                    </Typography>
                                    <Slider
                                        value={col.width}
                                        onChange={(_, val) => updateColumnWidth(index, val as number)}
                                        min={5}
                                        max={95}
                                        step={0.5}
                                        size="small"
                                        sx={{ flex: 1 }}
                                    />
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
                <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<DeleteIcon />}
                    onClick={onDelete}
                >
                    Delete Section
                </Button>
            </Box>
        </Box>
    );
}

