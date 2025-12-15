'use client';

import {
    Box,
    TextField,
    MenuItem,
    Typography,
    Slider,
    FormControlLabel,
    Checkbox,
    Divider,
    IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { LayoutSection, SectionType } from '@/types';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { FileItem } from '@/types/file';
import { createColumn } from './types';

interface SectionEditorProps {
    section: LayoutSection;
    onChange: (section: LayoutSection) => void;
    onDelete: () => void;
}

const sectionTypes: { value: SectionType; label: string }[] = [
    { value: 'full-width', label: 'Full Width' },
    { value: 'container', label: 'Container' },
    { value: 'split-2', label: '2 Columns' },
    { value: 'split-3', label: '3 Columns' },
    { value: 'split-4', label: '4 Columns' },
];

export default function SectionEditor({ section, onChange, onDelete }: SectionEditorProps) {
    const updateSettings = (key: string, value: any) => {
        onChange({
            ...section,
            settings: { ...section.settings, [key]: value },
        });
    };

    const updateVisibility = (device: 'desktop' | 'tablet' | 'mobile', value: boolean) => {
        onChange({
            ...section,
            visibility: { ...section.visibility, [device]: value },
        });
    };

    const handleBackgroundImageSelect = (files: FileItem[]) => {
        if (files.length > 0) {
            updateSettings('backgroundImage', files[0].url);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" fontWeight={600}>
                    Section Settings
                </Typography>
                <IconButton size="small" color="error" onClick={onDelete}>
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>

            <TextField
                label="Section Name"
                value={section.name || ''}
                onChange={(e) => onChange({ ...section, name: e.target.value })}
                size="small"
                fullWidth
            />

            <TextField
                select
                label="Layout Type"
                value={section.type}
                onChange={(e) => {
                    const newType = e.target.value as SectionType;
                    let newColumns = section.columns;

                    if (newType.startsWith('split')) {
                        const count = parseInt(newType.split('-')[1]);
                        // Initialize columns if not present or count changed
                        if (!newColumns || newColumns.length !== count) {
                            newColumns = Array(count).fill(0).map(() => createColumn(12 / count));

                            // If switching from non-split to split, move modules to first column
                            if (section.modules.length > 0) {
                                newColumns[0].modules = [...section.modules];
                            }
                        }
                    } else {
                        // Switching back to container/full-width
                        // Move all modules back to main modules array
                        if (section.columns) {
                            const allModules = section.columns.flatMap(c => c.modules);
                            onChange({ ...section, type: newType, columns: undefined, modules: allModules });
                            return;
                        }
                    }

                    onChange({
                        ...section,
                        type: newType,
                        columns: newColumns,
                        // Clear main modules if using columns
                        modules: newType.startsWith('split') ? [] : section.modules
                    });
                }}
                size="small"
                fullWidth
            >
                {sectionTypes.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </MenuItem>
                ))}
            </TextField>

            {/* Column Configuration for Split Sections */}
            {section.type.startsWith('split') && section.columns && (
                <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                        Column Widths (Total must be 12)
                    </Typography>
                    {section.columns.map((col, index) => (
                        <Box key={col.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <Typography variant="caption" sx={{ minWidth: 60 }}>
                                Col {index + 1}: {col.width}/12
                            </Typography>
                            <Slider
                                value={col.width}
                                onChange={(_, val) => {
                                    const newColumns = [...section.columns!];
                                    const oldWidth = newColumns[index].width;
                                    const diff = (val as number) - oldWidth;

                                    // Adjust next column (or previous if last) to keep total 12
                                    if (index < newColumns.length - 1) {
                                        newColumns[index + 1].width -= diff;
                                    } else if (index > 0) {
                                        newColumns[index - 1].width -= diff;
                                    }

                                    newColumns[index].width = val as number;
                                    onChange({ ...section, columns: newColumns });
                                }}
                                min={1}
                                max={11}
                                step={1}
                                size="small"
                                sx={{ flex: 1 }}
                            />
                        </Box>
                    ))}
                    <Divider sx={{ my: 2 }} />
                </Box>
            )}

            <Divider />

            <Typography variant="caption" color="text.secondary">
                Background
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
                <Box flex={1}>
                    <Typography variant="caption" color="text.secondary">
                        Color
                    </Typography>
                    <input
                        type="color"
                        value={section.settings.backgroundColor || '#ffffff'}
                        onChange={(e) => updateSettings('backgroundColor', e.target.value)}
                        style={{ width: '100%', height: 32, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                    />
                </Box>

                <Box flex={2}>
                    <Typography variant="caption" color="text.secondary">
                        Image
                    </Typography>
                    <FileManagerButton
                        onSelect={handleBackgroundImageSelect}
                        accept="image/*"
                        label="Choose"
                        size="small"
                        fullWidth
                    />
                </Box>
            </Box>

            {section.settings.backgroundImage && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        select
                        label="Size"
                        value={section.settings.backgroundSize || 'cover'}
                        onChange={(e) => updateSettings('backgroundSize', e.target.value)}
                        size="small"
                        sx={{ flex: 1 }}
                    >
                        <MenuItem value="cover">Cover</MenuItem>
                        <MenuItem value="contain">Contain</MenuItem>
                        <MenuItem value="auto">Auto</MenuItem>
                    </TextField>

                    <TextField
                        select
                        label="Position"
                        value={section.settings.backgroundPosition || 'center'}
                        onChange={(e) => updateSettings('backgroundPosition', e.target.value)}
                        size="small"
                        sx={{ flex: 1 }}
                    >
                        <MenuItem value="center">Center</MenuItem>
                        <MenuItem value="top">Top</MenuItem>
                        <MenuItem value="bottom">Bottom</MenuItem>
                    </TextField>
                </Box>
            )}

            <Divider />

            <Typography variant="caption" color="text.secondary">
                Padding (px)
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <Box flex={1}>
                    <Typography variant="caption">Top: {section.settings.paddingTop || 0}</Typography>
                    <Slider
                        value={section.settings.paddingTop || 0}
                        onChange={(_, val) => updateSettings('paddingTop', val)}
                        min={0}
                        max={120}
                        step={8}
                        size="small"
                    />
                </Box>

                <Box flex={1}>
                    <Typography variant="caption">Bottom: {section.settings.paddingBottom || 0}</Typography>
                    <Slider
                        value={section.settings.paddingBottom || 0}
                        onChange={(_, val) => updateSettings('paddingBottom', val)}
                        min={0}
                        max={120}
                        step={8}
                        size="small"
                    />
                </Box>
            </Box>

            <Divider />

            <Typography variant="caption" color="text.secondary">
                Visibility
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={section.visibility.desktop}
                            onChange={(e) => updateVisibility('desktop', e.target.checked)}
                            size="small"
                        />
                    }
                    label="Desktop"
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={section.visibility.tablet}
                            onChange={(e) => updateVisibility('tablet', e.target.checked)}
                            size="small"
                        />
                    }
                    label="Tablet"
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={section.visibility.mobile}
                            onChange={(e) => updateVisibility('mobile', e.target.checked)}
                            size="small"
                        />
                    }
                    label="Mobile"
                />
            </Box>

            <TextField
                label="Custom CSS Class"
                value={section.settings.customClass || ''}
                onChange={(e) => updateSettings('customClass', e.target.value)}
                size="small"
                fullWidth
                placeholder="my-custom-section"
            />
        </Box>
    );
}
