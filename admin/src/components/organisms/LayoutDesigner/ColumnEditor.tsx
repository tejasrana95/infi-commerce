'use client';

import React from 'react';
import {
    Box,
    TextField,
    MenuItem,
    Typography,
    Divider,
    IconButton,
    InputAdornment,
    Tabs,
    Tab,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import CloseIcon from '@mui/icons-material/Close';
import { LayoutColumn } from '@/types';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { FileItem } from '@/types/file';

interface ColumnEditorProps {
    column: LayoutColumn;
    onChange: (column: LayoutColumn) => void;
    onDelete?: () => void;
    copiedStyle?: any;
    onCopyStyle?: (style: any) => void;
}

export default function ColumnEditor({ column, onChange, onDelete, copiedStyle, onCopyStyle }: ColumnEditorProps) {
    const [activeTab, setActiveTab] = React.useState(0);
    const settings = column.settings || {};

    const handleCopyStyle = () => {
        if (onCopyStyle) {
            const styleToCopy = {
                backgroundColor: settings.backgroundColor,
                backgroundImage: settings.backgroundImage,
                backgroundSize: settings.backgroundSize,
                backgroundPosition: settings.backgroundPosition,
                textColor: settings.textColor,
                paddingTop: settings.paddingTop,
                paddingBottom: settings.paddingBottom,
                paddingLeft: settings.paddingLeft,
                paddingRight: settings.paddingRight,
                marginTop: settings.marginTop,
                marginBottom: settings.marginBottom,
                borderTopWidth: settings.borderTopWidth,
                borderRightWidth: settings.borderRightWidth,
                borderBottomWidth: settings.borderBottomWidth,
                borderLeftWidth: settings.borderLeftWidth,
                borderColor: settings.borderColor,
                borderStyle: settings.borderStyle,
                borderRadius: settings.borderRadius,
                hoverEffect: settings.hoverEffect,
            };
            onCopyStyle(styleToCopy);
        }
    };

    const handlePasteStyle = () => {
        if (copiedStyle) {
            onChange({
                ...column,
                settings: { ...column.settings, ...copiedStyle },
            });
        }
    };

    const updateSettings = (key: string, value: any) => {
        onChange({
            ...column,
            settings: { ...column.settings, [key]: value },
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
                    Column Settings
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={handleCopyStyle} title="Copy Style">
                        <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    {copiedStyle && (
                        <IconButton size="small" onClick={handlePasteStyle} title="Paste Style" color="primary">
                            <ContentPasteIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            </Box>

            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="fullWidth">
                <Tab label="Style" />
                <Tab label="Border" />
            </Tabs>

            {activeTab === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    {/* Background */}
                    <Typography variant="subtitle2" color="text.secondary">Background</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box flex={1}>
                            <Typography variant="caption" color="text.secondary">Color</Typography>
                            <input
                                type="color"
                                value={settings.backgroundColor || '#ffffff'}
                                onChange={(e) => updateSettings('backgroundColor', e.target.value)}
                                style={{ width: '100%', height: 40, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
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
                                {settings.backgroundImage && (
                                    <IconButton size="small" color="error" onClick={() => updateSettings('backgroundImage', '')}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {settings.backgroundImage && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <TextField
                                select label="Size" size="small" sx={{ flex: 1 }}
                                value={settings.backgroundSize || 'cover'}
                                onChange={(e) => updateSettings('backgroundSize', e.target.value)}
                            >
                                <MenuItem value="cover">Cover</MenuItem>
                                <MenuItem value="contain">Contain</MenuItem>
                                <MenuItem value="auto">Auto</MenuItem>
                            </TextField>
                            <TextField
                                select label="Position" size="small" sx={{ flex: 1 }}
                                value={settings.backgroundPosition || 'center'}
                                onChange={(e) => updateSettings('backgroundPosition', e.target.value)}
                            >
                                <MenuItem value="center">Center</MenuItem>
                                <MenuItem value="top">Top</MenuItem>
                                <MenuItem value="bottom">Bottom</MenuItem>
                            </TextField>
                        </Box>
                    )}

                    <Divider />
                    <Typography variant="subtitle2" color="text.secondary">Typography</Typography>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Text Color</Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <input
                                type="color"
                                value={settings.textColor || '#000000'}
                                onChange={(e) => updateSettings('textColor', e.target.value)}
                                style={{ width: 40, height: 40, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                            />
                            {settings.textColor && (
                                <IconButton size="small" onClick={() => updateSettings('textColor', '')} title="Clear color">
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Box>
                    </Box>


                    <Divider />
                    <Typography variant="subtitle2" color="text.secondary">Spacing</Typography>

                    <Typography variant="caption">Padding</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                        <TextField label="Top" type="number" size="small" value={settings.paddingTop || 0} onChange={(e) => updateSettings('paddingTop', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                        <TextField label="Bottom" type="number" size="small" value={settings.paddingBottom || 0} onChange={(e) => updateSettings('paddingBottom', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                        <TextField label="Left" type="number" size="small" value={settings.paddingLeft || 0} onChange={(e) => updateSettings('paddingLeft', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                        <TextField label="Right" type="number" size="small" value={settings.paddingRight || 0} onChange={(e) => updateSettings('paddingRight', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                    </Box>

                    <Typography variant="caption" sx={{ mt: 1 }}>Margin</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                        <TextField label="Top" type="number" size="small" value={settings.marginTop || 0} onChange={(e) => updateSettings('marginTop', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                        <TextField label="Bottom" type="number" size="small" value={settings.marginBottom || 0} onChange={(e) => updateSettings('marginBottom', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                    </Box>

                    <FormControlLabel
                        control={<Checkbox checked={settings.hoverEffect || false} onChange={(e) => updateSettings('hoverEffect', e.target.checked)} size="small" />}
                        label="Enable Hover Shadow"
                    />
                </Box>
            )}

            {activeTab === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">Border</Typography>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box flex={1}>
                            <Typography variant="caption" color="text.secondary">Color</Typography>
                            <input
                                type="color"
                                value={settings.borderColor || '#e0e0e0'}
                                onChange={(e) => updateSettings('borderColor', e.target.value)}
                                style={{ width: '100%', height: 40, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                            />
                        </Box>
                        <TextField
                            select label="Style" size="small" sx={{ flex: 1 }}
                            value={settings.borderStyle || 'solid'}
                            onChange={(e) => updateSettings('borderStyle', e.target.value)}
                        >
                            <MenuItem value="none">None</MenuItem>
                            <MenuItem value="solid">Solid</MenuItem>
                            <MenuItem value="dashed">Dashed</MenuItem>
                            <MenuItem value="dotted">Dotted</MenuItem>
                        </TextField>
                        <TextField
                            label="Radius" type="number" size="small" sx={{ flex: 1 }}
                            value={settings.borderRadius || 0}
                            onChange={(e) => updateSettings('borderRadius', parseInt(e.target.value))}
                            InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }}
                        />
                    </Box>

                    <Typography variant="caption" sx={{ mt: 1 }}>Widths</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                        <TextField label="Top" type="number" size="small" value={settings.borderTopWidth || 0} onChange={(e) => updateSettings('borderTopWidth', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                        <TextField label="Right" type="number" size="small" value={settings.borderRightWidth || 0} onChange={(e) => updateSettings('borderRightWidth', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                        <TextField label="Bottom" type="number" size="small" value={settings.borderBottomWidth || 0} onChange={(e) => updateSettings('borderBottomWidth', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                        <TextField label="Left" type="number" size="small" value={settings.borderLeftWidth || 0} onChange={(e) => updateSettings('borderLeftWidth', parseInt(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">px</InputAdornment> }} />
                    </Box>
                </Box>
            )}
        </Box>
    );
}
