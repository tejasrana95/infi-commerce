'use client';

import { Box, TextField, Typography, MenuItem, Select, FormControl, InputLabel, Button, IconButton, Accordion, AccordionSummary, AccordionDetails, Switch, FormControlLabel, Tabs, Tab, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import IconPicker from '@/components/atoms/IconPicker';
import { ColorPicker } from '@/components/atoms';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { COMMON_FONTS } from '@/utils/fonts';

interface IconBoxItem {
    id: string;
    title: string;
    description?: string;
    icon?: string;
    image?: string;
    link?: string;
    ctaText?: string;
}

interface IconBoxConfigStyles {
    borderColor?: string;
    borderRadius?: number;
    iconColor?: string;
    iconBgColor?: string;
    iconBgRadius?: number;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    titleFontFamily?: string;
    titleFontSize?: number;
    titleFontWeight?: number;
    descFontFamily?: string;
    descFontSize?: number;
    descFontWeight?: number;
    bgColor?: string;
    ctaColor?: string;
    titleColor?: string;
    descColor?: string;
    iconSize?: number;
    iconBgSize?: number;
    iconBgPadding?: number;
    iconAlign?: string;
    hoverEffect?: string;
}

interface IconBoxConfig {
    items: IconBoxItem[];
    layout: string;
    displayMode: string;
    columns: number;
    iconType: string;
    textAlign: string;
    fullSizeImage?: boolean;
    styles?: IconBoxConfigStyles;
    [key: string]: unknown;
}

interface IconBoxConfigPanelProps {
    readonly config: IconBoxConfig;
    readonly onChange: (config: IconBoxConfig) => void;
}

const emptyStyles: IconBoxConfigStyles = {};

export default function IconBoxConfigPanel({ config, onChange }: Readonly<IconBoxConfigPanelProps>) {
    const [tab, setTab] = useState(0);

    const handleChange = <T extends keyof IconBoxConfig>(key: T, value: IconBoxConfig[T]) => {
        onChange({ ...config, [key]: value });
    };

    const handleStyleChange = <T extends keyof IconBoxConfigStyles>(field: T, value: IconBoxConfigStyles[T]) => {
        onChange({
            ...config,
            styles: {
                ...(config.styles || emptyStyles),
                [field]: value
            }
        });
    };

    const handleAddItem = () => {
        const newItems = [...(config.items || []), {
            id: crypto.randomUUID(),
            title: 'New Feature',
            description: 'Feature description',
            icon: 'FaStar',
            link: '',
            ctaText: ''
        }];
        handleChange('items', newItems);
    };

    const handleItemChange = <T extends keyof IconBoxItem>(index: number, key: T, value: IconBoxItem[T]) => {
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
                <Tab label="Content" />
                <Tab label="Typography" />
                <Tab label="Box Model & Styling" />
            </Tabs>

            {/* Tab 0: Content */}
            {tab === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
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
                                onChange={(e) => handleChange('columns', Number(e.target.value))}
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
                            {(config.items || []).map((item, index) => (
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
                                                <FileManagerButton
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
                                                            slotProps={{
                                                                input: {
                                                                    endAdornment: (
                                                                        <Button size="small">Select</Button>
                                                                    )
                                                                }
                                                            }}
                                                        />
                                                    }
                                                />
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
                </Box>
            )}

            {/* Tab 1: Typography */}
            {tab === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <Typography variant="subtitle2">Title Typography</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Font Family</InputLabel>
                            <Select
                                value={config.styles?.titleFontFamily || ''}
                                label="Font Family"
                                onChange={(e) => handleStyleChange('titleFontFamily', e.target.value)}
                            >
                                {COMMON_FONTS.map(font => (
                                    <MenuItem key={font.value} value={font.value} style={{ fontFamily: font.value || 'inherit' }}>
                                        {font.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ColorPicker
                                label="Title Color"
                                value={config.styles?.titleColor || ''}
                                onChange={(color) => handleStyleChange('titleColor', color)}
                                size="small"
                            />
                            {config.styles?.titleColor && (
                                <IconButton
                                    size="small"
                                    onClick={() => handleStyleChange('titleColor', '')}
                                    sx={{ p: 0.5 }}
                                >
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            )}
                        </Box>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField
                            label="Font Size (px)"
                            type="number"
                            value={config.styles?.titleFontSize ?? ''}
                            onChange={(e) => handleStyleChange('titleFontSize', e.target.value ? Number.parseInt(e.target.value, 10) : undefined)}
                            size="small"
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Font Weight</InputLabel>
                            <Select
                                value={config.styles?.titleFontWeight ?? ''}
                                label="Font Weight"
                                onChange={(e) => handleStyleChange('titleFontWeight', e.target.value ? Number(e.target.value) : undefined)}
                            >
                                <MenuItem value="">Default</MenuItem>
                                <MenuItem value={300}>Light (300)</MenuItem>
                                <MenuItem value={400}>Regular (400)</MenuItem>
                                <MenuItem value={500}>Medium (500)</MenuItem>
                                <MenuItem value={600}>Semi Bold (600)</MenuItem>
                                <MenuItem value={700}>Bold (700)</MenuItem>
                                <MenuItem value={800}>Extra Bold (800)</MenuItem>
                                <MenuItem value={900}>Black (900)</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="subtitle2">Description Typography</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Font Family</InputLabel>
                            <Select
                                value={config.styles?.descFontFamily || ''}
                                label="Font Family"
                                onChange={(e) => handleStyleChange('descFontFamily', e.target.value)}
                            >
                                {COMMON_FONTS.map(font => (
                                    <MenuItem key={font.value} value={font.value} style={{ fontFamily: font.value || 'inherit' }}>
                                        {font.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ColorPicker
                                label="Description Color"
                                value={config.styles?.descColor || ''}
                                onChange={(color) => handleStyleChange('descColor', color)}
                                size="small"
                            />
                            {config.styles?.descColor && (
                                <IconButton
                                    size="small"
                                    onClick={() => handleStyleChange('descColor', '')}
                                    sx={{ p: 0.5 }}
                                >
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            )}
                        </Box>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField
                            label="Font Size (px)"
                            type="number"
                            value={config.styles?.descFontSize ?? ''}
                            onChange={(e) => handleStyleChange('descFontSize', e.target.value ? Number.parseInt(e.target.value, 10) : undefined)}
                            size="small"
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Font Weight</InputLabel>
                            <Select
                                value={config.styles?.descFontWeight ?? ''}
                                label="Font Weight"
                                onChange={(e) => handleStyleChange('descFontWeight', e.target.value ? Number(e.target.value) : undefined)}
                            >
                                <MenuItem value="">Default</MenuItem>
                                <MenuItem value={300}>Light (300)</MenuItem>
                                <MenuItem value={400}>Regular (400)</MenuItem>
                                <MenuItem value={500}>Medium (500)</MenuItem>
                                <MenuItem value={600}>Semi Bold (600)</MenuItem>
                                <MenuItem value={700}>Bold (700)</MenuItem>
                                <MenuItem value={800}>Extra Bold (800)</MenuItem>
                                <MenuItem value={900}>Black (900)</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
            )}

            {/* Tab 2: Box Model & Styling */}
            {tab === 2 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <Typography variant="subtitle2">Card Border & Corners</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ColorPicker
                                label="Border Color"
                                value={config.styles?.borderColor || ''}
                                onChange={(color) => handleStyleChange('borderColor', color)}
                                size="small"
                            />
                            {config.styles?.borderColor && (
                                <IconButton
                                    size="small"
                                    onClick={() => handleStyleChange('borderColor', '')}
                                    sx={{ p: 0.5 }}
                                >
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            )}
                        </Box>
                        <TextField
                            label="Border Radius (px)"
                            type="number"
                            value={config.styles?.borderRadius ?? ''}
                            onChange={(e) => handleStyleChange('borderRadius', e.target.value ? Number.parseInt(e.target.value, 10) : undefined)}
                            size="small"
                            fullWidth
                        />
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="subtitle2">Card Background & CTA Color</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ColorPicker
                                label="Card Background"
                                value={config.styles?.bgColor || ''}
                                onChange={(color) => handleStyleChange('bgColor', color)}
                                size="small"
                            />
                            {config.styles?.bgColor && (
                                <IconButton
                                    size="small"
                                    onClick={() => handleStyleChange('bgColor', '')}
                                    sx={{ p: 0.5 }}
                                >
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ColorPicker
                                label="CTA Color"
                                value={config.styles?.ctaColor || ''}
                                onChange={(color) => handleStyleChange('ctaColor', color)}
                                size="small"
                            />
                            {config.styles?.ctaColor && (
                                <IconButton
                                    size="small"
                                    onClick={() => handleStyleChange('ctaColor', '')}
                                    sx={{ p: 0.5 }}
                                >
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            )}
                        </Box>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="subtitle2">Icon Styling</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ColorPicker
                                    label="Icon Color"
                                    value={config.styles?.iconColor || ''}
                                    onChange={(color) => handleStyleChange('iconColor', color)}
                                    size="small"
                                />
                                {config.styles?.iconColor && (
                                    <IconButton
                                        size="small"
                                        onClick={() => handleStyleChange('iconColor', '')}
                                        sx={{ p: 0.5 }}
                                        aria-label="clear icon color"
                                    >
                                        <DeleteIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ColorPicker
                                    label="Icon Bg Color"
                                    value={config.styles?.iconBgColor || ''}
                                    onChange={(color) => handleStyleChange('iconBgColor', color)}
                                    size="small"
                                />
                                {config.styles?.iconBgColor && (
                                    <IconButton
                                        size="small"
                                        onClick={() => handleStyleChange('iconBgColor', '')}
                                        sx={{ p: 0.5 }}
                                        aria-label="clear icon background color"
                                    >
                                        <DeleteIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField
                                label="Icon Size (px)"
                                type="number"
                                value={config.styles?.iconSize ?? ''}
                                onChange={(e) => handleStyleChange('iconSize', e.target.value ? Number.parseInt(e.target.value, 10) : undefined)}
                                size="small"
                            />
                            <TextField
                                label="Icon Background Radius (px)"
                                type="number"
                                value={config.styles?.iconBgRadius ?? ''}
                                onChange={(e) => handleStyleChange('iconBgRadius', e.target.value ? Number.parseInt(e.target.value, 10) : undefined)}
                                size="small"
                            />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField
                                label="Icon Bg Size/Box (px)"
                                type="number"
                                value={config.styles?.iconBgSize ?? ''}
                                onChange={(e) => handleStyleChange('iconBgSize', e.target.value ? Number.parseInt(e.target.value, 10) : undefined)}
                                size="small"
                            />
                            <TextField
                                label="Icon Bg Padding (px)"
                                type="number"
                                value={config.styles?.iconBgPadding ?? ''}
                                onChange={(e) => handleStyleChange('iconBgPadding', e.target.value ? Number.parseInt(e.target.value, 10) : undefined)}
                                size="small"
                            />
                        </Box>

                        <FormControl fullWidth size="small">
                            <InputLabel>Icon Cross-Alignment</InputLabel>
                            <Select
                                value={config.styles?.iconAlign || ''}
                                label="Icon Cross-Alignment"
                                onChange={(e) => handleStyleChange('iconAlign', e.target.value)}
                            >
                                <MenuItem value="">Default</MenuItem>
                                <MenuItem value="flex-start">Top / Left (Start)</MenuItem>
                                <MenuItem value="center">Center</MenuItem>
                                <MenuItem value="flex-end">Bottom / Right (End)</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="subtitle2">Card Hover Effect</Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel>Hover Effect</InputLabel>
                        <Select
                            value={config.styles?.hoverEffect || ''}
                            label="Hover Effect"
                            onChange={(e) => handleStyleChange('hoverEffect', e.target.value)}
                        >
                            <MenuItem value="">Default</MenuItem>
                            <MenuItem value="none">None</MenuItem>
                            <MenuItem value="lift">Lift Up</MenuItem>
                            <MenuItem value="zoom">Zoom In</MenuItem>
                            <MenuItem value="shadow">Shadow Glow</MenuItem>
                        </Select>
                    </FormControl>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="subtitle2">Card Padding (px)</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField
                            label="Top"
                            type="number"
                            value={config.styles?.paddingTop ?? ''}
                            onChange={(e) => handleStyleChange('paddingTop', e.target.value ? Number.parseInt(e.target.value, 10) : undefined)}
                            size="small"
                        />
                        <TextField
                            label="Bottom"
                            type="number"
                            value={config.styles?.paddingBottom ?? ''}
                            onChange={(e) => handleStyleChange('paddingBottom', e.target.value ? Number.parseInt(e.target.value, 10) : undefined)}
                            size="small"
                        />
                        <TextField
                            label="Left"
                            type="number"
                            value={config.styles?.paddingLeft ?? ''}
                            onChange={(e) => handleStyleChange('paddingLeft', e.target.value ? Number.parseInt(e.target.value, 10) : undefined)}
                            size="small"
                        />
                        <TextField
                            label="Right"
                            type="number"
                            value={config.styles?.paddingRight ?? ''}
                            onChange={(e) => handleStyleChange('paddingRight', e.target.value ? Number.parseInt(e.target.value, 10) : undefined)}
                            size="small"
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
}
