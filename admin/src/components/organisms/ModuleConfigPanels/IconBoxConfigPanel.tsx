'use client';

import { Box, TextField, Typography, MenuItem, Select, FormControl, InputLabel, Button, IconButton, Accordion, AccordionSummary, AccordionDetails, Switch, FormControlLabel } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import IconPicker from '@/components/atoms/IconPicker';
import FileManagerButton from '@/components/molecules/FileManagerButton';

interface IconBoxConfigPanelProps {
    config: {
        items: any[];
        layout: string;
        displayMode: string;
        columns: number;
        iconType: string;
        textAlign: string;
        [key: string]: any;
    };
    onChange: (config: any) => void;
}

export default function IconBoxConfigPanel({ config, onChange }: IconBoxConfigPanelProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    const handleAddItem = () => {
        const newItems = [...(config.items || []), {
            id: crypto.randomUUID(),
            title: 'New Feature',
            description: 'Feature description',
            icon: 'FaStar',
            link: ''
        }];
        handleChange('items', newItems);
    };

    const handleItemChange = (index: number, key: string, value: any) => {
        const newItems = [...(config.items || [])];
        newItems[index] = { ...newItems[index], [key]: value };
        handleChange('items', newItems);
    };

    const handleDeleteItem = (index: number) => {
        const newItems = [...(config.items || [])];
        newItems.splice(index, 1);
        handleChange('items', newItems);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl fullWidth size="small">
                    <InputLabel>Layout</InputLabel>
                    <Select
                        value={config.layout || 'icon-top'}
                        label="Layout"
                        onChange={(e) => handleChange('layout', e.target.value)}
                    >
                        <MenuItem value="icon-top">Icon Top</MenuItem>
                        <MenuItem value="icon-left">Icon Left</MenuItem>
                        <MenuItem value="icon-right">Icon Right</MenuItem>
                        <MenuItem value="icon-bottom">Icon Bottom</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                    <InputLabel>Display Mode</InputLabel>
                    <Select
                        value={config.displayMode || 'grid'}
                        label="Display Mode"
                        onChange={(e) => handleChange('displayMode', e.target.value)}
                    >
                        <MenuItem value="grid">Grid</MenuItem>
                        <MenuItem value="carousel">Carousel</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                    <InputLabel>Columns</InputLabel>
                    <Select
                        value={config.columns || 3}
                        label="Columns"
                        onChange={(e) => handleChange('columns', e.target.value)}
                    >
                        <MenuItem value={1}>1 Column</MenuItem>
                        <MenuItem value={2}>2 Columns</MenuItem>
                        <MenuItem value={3}>3 Columns</MenuItem>
                        <MenuItem value={4}>4 Columns</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                    <InputLabel>Text Align</InputLabel>
                    <Select
                        value={config.textAlign || 'center'}
                        label="Text Align"
                        onChange={(e) => handleChange('textAlign', e.target.value)}
                    >
                        <MenuItem value="left">Left</MenuItem>
                        <MenuItem value="center">Center</MenuItem>
                        <MenuItem value="right">Right</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                    <InputLabel>Icon Source</InputLabel>
                    <Select
                        value={config.iconType || 'icon'}
                        label="Icon Source"
                        onChange={(e) => handleChange('iconType', e.target.value)}
                    >
                        <MenuItem value="icon">React Icon</MenuItem>
                        <MenuItem value="image">Custom Image</MenuItem>
                    </Select>

                </FormControl>

                {config.iconType === 'image' && (
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.fullSizeImage || false}
                                onChange={(e) => handleChange('fullSizeImage', e.target.checked)}
                            />
                        }
                        label="Full Size Image"
                        sx={{ ml: 1 }}
                    />
                )}
            </Box>

            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">Items</Typography>
                    <Button startIcon={<AddIcon />} size="small" onClick={handleAddItem}>
                        Add Item
                    </Button>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {(config.items || []).map((item: any, index: number) => (
                        <Accordion key={item.id || index} disableGutters>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="body2">{item.title || 'Untitled Item'}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        label="Title"
                                        size="small"
                                        fullWidth
                                        value={item.title || ''}
                                        onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                                    />
                                    <TextField
                                        label="Description"
                                        size="small"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        value={item.description || ''}
                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                    />

                                    {config.iconType === 'image' ? (
                                        <Box>
                                            <FileManagerButton
                                                fullWidth
                                                label={item.image ? "Change Image" : "Select Image"}
                                                onSelect={(files) => {
                                                    if (files.length > 0) {
                                                        handleItemChange(index, 'image', files[0].url);
                                                    }
                                                }}
                                                trigger={
                                                    <TextField
                                                        label="Image URL"
                                                        size="small"
                                                        fullWidth
                                                        value={item.image || ''}
                                                        onChange={(e) => handleItemChange(index, 'image', e.target.value)}
                                                        helperText="Select from File Manager or enter URL"
                                                        InputProps={{
                                                            endAdornment: (
                                                                <Button size="small">Select</Button>
                                                            )
                                                        }}
                                                    />
                                                }
                                            />
                                        </Box>
                                    ) : (
                                        <IconPicker
                                            label="Select Icon"
                                            value={item.icon || ''}
                                            onChange={(newIcon) => handleItemChange(index, 'icon', newIcon)}
                                            fullWidth
                                        />
                                    )}

                                    <TextField
                                        label="Link URL"
                                        size="small"
                                        fullWidth
                                        value={item.link || ''}
                                        onChange={(e) => handleItemChange(index, 'link', e.target.value)}
                                    />

                                    <TextField
                                        label="CTA Text"
                                        size="small"
                                        fullWidth
                                        value={item.ctaText || ''}
                                        onChange={(e) => handleItemChange(index, 'ctaText', e.target.value)}
                                    />

                                    <Button
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        size="small"
                                        onClick={() => handleDeleteItem(index)}
                                    >
                                        Remove Item
                                    </Button>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            </Box>
        </Box >
    );
}
