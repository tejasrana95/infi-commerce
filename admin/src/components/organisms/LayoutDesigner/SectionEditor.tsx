'use client';

import React from 'react';

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
    Tabs,
    Tab,
    InputAdornment,
    Tooltip,
} from '@mui/material';
import { ColorPicker } from '@/components/atoms';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { LayoutSection, SectionType } from '@/types';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { FileItem } from '@/types/file';
import { createColumn } from './types';

interface SectionEditorProps {
    section: LayoutSection;
    onChange: (section: LayoutSection) => void;
    onDelete: () => void;
    copiedStyle: any;
    onCopyStyle: (style: any) => void;
}

const sectionTypes: { value: SectionType; label: string }[] = [
    { value: 'full-width', label: 'Full Width' },
    { value: 'container', label: 'Container' },
    { value: 'split-2', label: '2 Columns' },
    { value: 'split-3', label: '3 Columns' },
    { value: 'split-4', label: '4 Columns' },
];

export default function SectionEditor({ section, onChange, onDelete, copiedStyle, onCopyStyle }: SectionEditorProps) {
    const [activeTab, setActiveTab] = React.useState(0);

    const handleCopyStyle = () => {
        const styleToCopy = {
            backgroundColor: section.settings.backgroundColor,
            backgroundImage: section.settings.backgroundImage,
            backgroundSize: section.settings.backgroundSize,
            backgroundPosition: section.settings.backgroundPosition,
            paddingTop: section.settings.paddingTop,
            paddingBottom: section.settings.paddingBottom,
            paddingLeft: section.settings.paddingLeft,
            paddingRight: section.settings.paddingRight,
            marginTop: section.settings.marginTop,
            marginBottom: section.settings.marginBottom,
            minHeight: section.settings.minHeight,
            maxHeight: section.settings.maxHeight,
            borderTopWidth: section.settings.borderTopWidth,
            borderRightWidth: section.settings.borderRightWidth,
            borderBottomWidth: section.settings.borderBottomWidth,
            borderLeftWidth: section.settings.borderLeftWidth,
            borderColor: section.settings.borderColor,
            borderStyle: section.settings.borderStyle,
            borderRadius: section.settings.borderRadius,
            boxShadow: section.settings.boxShadow,
            backgroundParallax: section.settings.backgroundParallax,
            backgroundParallaxRatio: section.settings.backgroundParallaxRatio,
        };
        onCopyStyle(styleToCopy);
    };

    const handlePasteStyle = () => {
        if (copiedStyle) {
            onChange({
                ...section,
                settings: { ...section.settings, ...copiedStyle },
            });
        }
    };

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
                <Box>
                    {copiedStyle && (
                        <Tooltip title="Paste Style">
                            <IconButton size="small" onClick={handlePasteStyle} color="primary">
                                <ContentPasteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title="Copy Style">
                        <IconButton size="small" onClick={handleCopyStyle}>
                            <ContentCopyIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <IconButton size="small" color="error" onClick={onDelete}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="fullWidth">
                <Tab label="General" />
                <Tab label="Style" />
            </Tabs>

            {activeTab === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Section ID"
                        value={section.sectionId || ''}
                        onChange={(e) => onChange({ ...section, sectionId: e.target.value })}
                        size="small"
                        fullWidth
                        placeholder="e.g., contact-us"
                        helperText="Used for anchor links (e.g., #contact-us)"
                    />

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
                                if (!newColumns || newColumns.length !== count) {
                                    newColumns = Array(count).fill(0).map(() => createColumn(12 / count));
                                    if (section.modules.length > 0) {
                                        newColumns[0].modules = [...section.modules];
                                    }
                                }
                            } else {
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
                        Visibility
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <FormControlLabel
                            control={<Checkbox checked={section.visibility.desktop} onChange={(e) => updateVisibility('desktop', e.target.checked)} size="small" />}
                            label="Desktop"
                        />
                        <FormControlLabel
                            control={<Checkbox checked={section.visibility.tablet} onChange={(e) => updateVisibility('tablet', e.target.checked)} size="small" />}
                            label="Tablet"
                        />
                        <FormControlLabel
                            control={<Checkbox checked={section.visibility.mobile} onChange={(e) => updateVisibility('mobile', e.target.checked)} size="small" />}
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
            )}

            {activeTab === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">Background</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box flex={1}>
                            <Typography variant="caption" color="text.secondary">Color</Typography>
                            <ColorPicker
                                value={section.settings.backgroundColor || '#ffffff'}
                                onChange={(color) => updateSettings('backgroundColor', color)}
                            />
                        </Box>
                        <Box flex={2}>
                            <Typography variant="caption" color="text.secondary">Image</Typography>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Box sx={{ flex: 1 }}>
                                    <FileManagerButton
                                        onSelect={handleBackgroundImageSelect}
                                        accept="image/*"
                                        label="Choose"
                                        size="small"
                                        fullWidth
                                    />
                                </Box>
                                {section.settings.backgroundImage && (
                                    <IconButton size="small" color="error" onClick={() => updateSettings('backgroundImage', '')}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {section.settings.backgroundImage && (
                        <Box sx={{ mt: 1 }}>
                            <Box
                                component="img"
                                src={section.settings.backgroundImage}
                                alt="Background preview"
                                sx={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                            />
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <TextField
                                    select label="Size" size="small" sx={{ flex: 1 }}
                                    value={section.settings.backgroundSize || 'cover'}
                                    onChange={(e) => updateSettings('backgroundSize', e.target.value)}
                                >
                                    <MenuItem value="cover">Cover</MenuItem>
                                    <MenuItem value="contain">Contain</MenuItem>
                                    <MenuItem value="auto">Auto</MenuItem>
                                </TextField>
                                <TextField
                                    select label="Position" size="small" sx={{ flex: 1 }}
                                    value={section.settings.backgroundPosition || 'center'}
                                    onChange={(e) => updateSettings('backgroundPosition', e.target.value)}
                                >
                                    <MenuItem value="center">Center</MenuItem>
                                    <MenuItem value="top">Top</MenuItem>
                                    <MenuItem value="bottom">Bottom</MenuItem>
                                </TextField>
                            </Box>
                            <FormControlLabel
                                control={<Checkbox checked={section.settings.backgroundParallax || false} onChange={(e) => updateSettings('backgroundParallax', e.target.checked)} size="small" />}
                                label="Parallax Effect"
                            />
                        </Box>
                    )}

                    <Divider />
                    <Typography variant="subtitle2" color="text.secondary">Spacing</Typography>

                    <Typography variant="caption">Padding</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                        <TextField label="Top" type="number" size="small" value={section.settings.paddingTop || 0} onChange={(e) => updateSettings('paddingTop', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                        <TextField label="Bottom" type="number" size="small" value={section.settings.paddingBottom || 0} onChange={(e) => updateSettings('paddingBottom', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                        <TextField label="Left" type="number" size="small" value={section.settings.paddingLeft || 0} onChange={(e) => updateSettings('paddingLeft', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                        <TextField label="Right" type="number" size="small" value={section.settings.paddingRight || 0} onChange={(e) => updateSettings('paddingRight', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                    </Box>

                    <Typography variant="caption" sx={{ mt: 1 }}>Margin</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                        <TextField label="Top" type="number" size="small" value={section.settings.marginTop || 0} onChange={(e) => updateSettings('marginTop', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                        <TextField label="Bottom" type="number" size="small" value={section.settings.marginBottom || 0} onChange={(e) => updateSettings('marginBottom', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                    </Box>

                    <Divider />
                    <Typography variant="subtitle2" color="text.secondary">Border</Typography>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box flex={1}>
                            <Typography variant="caption" color="text.secondary">Color</Typography>
                            <ColorPicker
                                value={section.settings.borderColor || '#e0e0e0'}
                                onChange={(color) => updateSettings('borderColor', color)}
                            />
                        </Box>
                        <TextField
                            select label="Style" size="small" sx={{ flex: 1 }}
                            value={section.settings.borderStyle || 'solid'}
                            onChange={(e) => updateSettings('borderStyle', e.target.value)}
                        >
                            <MenuItem value="none">None</MenuItem>
                            <MenuItem value="solid">Solid</MenuItem>
                            <MenuItem value="dashed">Dashed</MenuItem>
                            <MenuItem value="dotted">Dotted</MenuItem>
                        </TextField>
                        <TextField
                            label="Radius" type="number" size="small" sx={{ flex: 1 }}
                            value={section.settings.borderRadius || 0}
                            onChange={(e) => updateSettings('borderRadius', parseInt(e.target.value))}
                            InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }}
                        />
                    </Box>

                    <Typography variant="caption" sx={{ mt: 1 }}>Widths</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                        <TextField label="Top" type="number" size="small" value={section.settings.borderTopWidth || 0} onChange={(e) => updateSettings('borderTopWidth', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                        <TextField label="Right" type="number" size="small" value={section.settings.borderRightWidth || 0} onChange={(e) => updateSettings('borderRightWidth', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                        <TextField label="Bottom" type="number" size="small" value={section.settings.borderBottomWidth || 0} onChange={(e) => updateSettings('borderBottomWidth', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                        <TextField label="Left" type="number" size="small" value={section.settings.borderLeftWidth || 0} onChange={(e) => updateSettings('borderLeftWidth', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                    </Box>

                    <Divider />
                    <Typography variant="subtitle2" color="text.secondary">Box Shadow</Typography>
                    <TextField
                        select label="Shadow Preset" size="small" fullWidth
                        value={section.settings.boxShadow || 'none'}
                        onChange={(e) => updateSettings('boxShadow', e.target.value)}
                    >
                        <MenuItem value="none">None</MenuItem>
                        <MenuItem value="small">Small</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="large">Large</MenuItem>
                    </TextField>

                    <Divider />
                    <Typography variant="subtitle2" color="text.secondary">Dimensions</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="Min Height" type="number" size="small" fullWidth value={section.settings.minHeight || 0} onChange={(e) => updateSettings('minHeight', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                        <TextField label="Max Height" type="number" size="small" fullWidth value={section.settings.maxHeight || 0} onChange={(e) => updateSettings('maxHeight', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                    </Box>
                </Box>
            )}
        </Box>
    );
}
