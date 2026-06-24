import React, { useState } from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Typography, Divider, Tabs, Tab, Grid, Slider, Switch, FormControlLabel } from '@mui/material';
import { ColorPicker } from '@/components/atoms';
import { COMMON_FONTS } from '@/utils/fonts';

interface HeadingConfigPanelProps {
    config: {
        heading?: string;
        subheading?: string;
        tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
        align?: 'left' | 'center' | 'right';
        alignTablet?: 'left' | 'center' | 'right';
        alignMobile?: 'left' | 'center' | 'right';
        headingStyle?: 'plain' | 'bottom-accent' | 'double-line' | 'background-ribbon';
        subheadingFirst?: boolean;
        styles?: {
            fontFamily?: string;
            fontSize?: number; // px
            fontWeight?: number;
            color?: string;
            textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';

            subFontFamily?: string;
            subFontSize?: number;
            subFontWeight?: number;
            subColor?: string;
            subTextTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';

            backgroundColor?: string;
            decorationColor?: string;

            // Border
            borderStyle?: string;
            borderColor?: string;
            borderWidth?: number;
            borderRadius?: number;
            borderTop?: boolean;
            borderRight?: boolean;
            borderBottom?: boolean;
            borderLeft?: boolean;

            // Padding
            paddingTop?: number;
            paddingBottom?: number;
            paddingLeft?: number;
            paddingRight?: number;
        };
    };
    onChange: (config: any) => void;
}


const HeadingConfigPanel: React.FC<HeadingConfigPanelProps> = ({ config, onChange }) => {
    const [tab, setTab] = useState(0);

    const handleChange = (field: string, value: any) => {
        onChange({ ...config, [field]: value });
    };

    const handleStyleChange = (field: string, value: any) => {
        onChange({
            ...config,
            styles: {
                ...(config.styles || {}),
                [field]: value
            }
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
                <Tab label="Content" />
                <Tab label="Typography" />
                <Tab label="Box Model" />
            </Tabs>

            {/* Content Tab */}
            {tab === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Heading Text"
                        value={config.heading || ''}
                        onChange={(e) => handleChange('heading', e.target.value)}
                        fullWidth
                        multiline
                    />
                    <TextField
                        label="Subheading Text"
                        value={config.subheading || ''}
                        onChange={(e) => handleChange('subheading', e.target.value)}
                        fullWidth
                        multiline
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.subheadingFirst || false}
                                onChange={(e) => handleChange('subheadingFirst', e.target.checked)}
                            />
                        }
                        label="Show Subheading First"
                    />

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>HTML Tag</InputLabel>
                            <Select
                                value={config.tag || 'h2'}
                                label="HTML Tag"
                                onChange={(e) => handleChange('tag', e.target.value)}
                            >
                                <MenuItem value="h1">H1 (Page Title)</MenuItem>
                                <MenuItem value="h2">H2 (Section)</MenuItem>
                                <MenuItem value="h3">H3 (Subsection)</MenuItem>
                                <MenuItem value="h4">H4</MenuItem>
                                <MenuItem value="h5">H5</MenuItem>
                                <MenuItem value="h6">H6</MenuItem>
                                <MenuItem value="div">Div (Decorative)</MenuItem>
                            </Select>
                        </FormControl>

                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Align (Desktop)</InputLabel>
                            <Select
                                value={config.align || 'center'}
                                label="Align (Desktop)"
                                onChange={(e) => handleChange('align', e.target.value)}
                            >
                                <MenuItem value="left">Left</MenuItem>
                                <MenuItem value="center">Center</MenuItem>
                                <MenuItem value="right">Right</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Align (Tablet)</InputLabel>
                            <Select
                                value={config.alignTablet || config.align || 'center'}
                                label="Align (Tablet)"
                                onChange={(e) => handleChange('alignTablet', e.target.value)}
                            >
                                <MenuItem value="left">Left</MenuItem>
                                <MenuItem value="center">Center</MenuItem>
                                <MenuItem value="right">Right</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Align (Mobile)</InputLabel>
                            <Select
                                value={config.alignMobile || config.align || 'center'}
                                label="Align (Mobile)"
                                onChange={(e) => handleChange('alignMobile', e.target.value)}
                            >
                                <MenuItem value="left">Left</MenuItem>
                                <MenuItem value="center">Center</MenuItem>
                                <MenuItem value="right">Right</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Heading Design Style</InputLabel>
                            <Select
                                value={config.headingStyle || 'plain'}
                                label="Heading Design Style"
                                onChange={(e) => handleChange('headingStyle', e.target.value)}
                            >
                                <MenuItem value="plain">Plain</MenuItem>
                                <MenuItem value="bottom-accent">Bottom Accent Line</MenuItem>
                                <MenuItem value="double-line">Double Line Flanked</MenuItem>
                                <MenuItem value="background-ribbon">Background Ribbon</MenuItem>
                            </Select>
                        </FormControl>
                        {config.headingStyle && config.headingStyle !== 'plain' ? (
                            <ColorPicker
                                label="Decoration Color"
                                value={config.styles?.decorationColor || '#3b82f6'}
                                onChange={(color) => handleStyleChange('decorationColor', color)}
                            />
                        ) : (
                            <Box />
                        )}
                    </Box>
                </Box>
            )}

            {/* Typography Tab */}
            {tab === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <Typography variant="subtitle2">Heading Typography</Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel>Font Family</InputLabel>
                        <Select
                            value={config.styles?.fontFamily || ''}
                            label="Font Family"
                            onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                        >
                            {COMMON_FONTS.map(font => (
                                <MenuItem key={font.value} value={font.value} style={{ fontFamily: font.value || 'inherit' }}>
                                    {font.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField
                            label="Font Size (px)"
                            type="number"
                            value={config.styles?.fontSize || 32}
                            onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value) || 0)}
                            size="small"
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Font Weight</InputLabel>
                            <Select
                                value={config.styles?.fontWeight || 600}
                                label="Font Weight"
                                onChange={(e) => handleStyleChange('fontWeight', Number(e.target.value))}
                            >
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

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <ColorPicker
                            label="Heading Color"
                            value={config.styles?.color || '#000000'}
                            onChange={(color) => handleStyleChange('color', color)}
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Text Transform</InputLabel>
                            <Select
                                value={config.styles?.textTransform || 'none'}
                                label="Text Transform"
                                onChange={(e) => handleStyleChange('textTransform', e.target.value)}
                            >
                                <MenuItem value="none">None</MenuItem>
                                <MenuItem value="uppercase">Uppercase</MenuItem>
                                <MenuItem value="lowercase">Lowercase</MenuItem>
                                <MenuItem value="capitalize">Capitalize</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2">Subheading Typography</Typography>

                    <FormControl fullWidth size="small">
                        <InputLabel>Font Family</InputLabel>
                        <Select
                            value={config.styles?.subFontFamily || ''}
                            label="Font Family"
                            onChange={(e) => handleStyleChange('subFontFamily', e.target.value)}
                        >
                            {COMMON_FONTS.map(font => (
                                <MenuItem key={font.value} value={font.value} style={{ fontFamily: font.value || 'inherit' }}>
                                    {font.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField
                            label="Font Size (px)"
                            type="number"
                            value={config.styles?.subFontSize || 18}
                            onChange={(e) => handleStyleChange('subFontSize', parseInt(e.target.value) || 0)}
                            size="small"
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Font Weight</InputLabel>
                            <Select
                                value={config.styles?.subFontWeight || 400}
                                label="Font Weight"
                                onChange={(e) => handleStyleChange('subFontWeight', Number(e.target.value))}
                            >
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

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <ColorPicker
                            label="Subheading Color"
                            value={config.styles?.subColor || '#666666'}
                            onChange={(color) => handleStyleChange('subColor', color)}
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Text Transform</InputLabel>
                            <Select
                                value={config.styles?.subTextTransform || 'none'}
                                label="Text Transform"
                                onChange={(e) => handleStyleChange('subTextTransform', e.target.value)}
                            >
                                <MenuItem value="none">None</MenuItem>
                                <MenuItem value="uppercase">Uppercase</MenuItem>
                                <MenuItem value="lowercase">Lowercase</MenuItem>
                                <MenuItem value="capitalize">Capitalize</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
            )}

            {/* Box Model Tab */}
            {tab === 2 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <Typography variant="subtitle2">Border Settings</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.styles?.borderTop || false}
                                    onChange={(e) => handleStyleChange('borderTop', e.target.checked)}
                                />
                            }
                            label="Top Border"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.styles?.borderBottom || false}
                                    onChange={(e) => handleStyleChange('borderBottom', e.target.checked)}
                                />
                            }
                            label="Bottom Border"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.styles?.borderLeft || false}
                                    onChange={(e) => handleStyleChange('borderLeft', e.target.checked)}
                                />
                            }
                            label="Left Border"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.styles?.borderRight || false}
                                    onChange={(e) => handleStyleChange('borderRight', e.target.checked)}
                                />
                            }
                            label="Right Border"
                        />
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                        <ColorPicker
                            label="Color"
                            value={config.styles?.borderColor || '#e0e0e0'}
                            onChange={(color) => handleStyleChange('borderColor', color)}
                        />
                        <TextField
                            label="Width (px)"
                            type="number"
                            value={config.styles?.borderWidth || 1}
                            onChange={(e) => handleStyleChange('borderWidth', parseInt(e.target.value) || 0)}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Radius (px)"
                            type="number"
                            value={config.styles?.borderRadius || 0}
                            onChange={(e) => handleStyleChange('borderRadius', parseInt(e.target.value) || 0)}
                            fullWidth
                            size="small"
                        />
                    </Box>

                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2">Padding (px)</Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField
                            label="Top"
                            type="number"
                            value={config.styles?.paddingTop || 20}
                            onChange={(e) => handleStyleChange('paddingTop', parseInt(e.target.value) || 0)}
                            size="small"
                        />
                        <TextField
                            label="Bottom"
                            type="number"
                            value={config.styles?.paddingBottom || 20}
                            onChange={(e) => handleStyleChange('paddingBottom', parseInt(e.target.value) || 0)}
                            size="small"
                        />
                        <TextField
                            label="Left"
                            type="number"
                            value={config.styles?.paddingLeft || 0}
                            onChange={(e) => handleStyleChange('paddingLeft', parseInt(e.target.value) || 0)}
                            size="small"
                        />
                        <TextField
                            label="Right"
                            type="number"
                            value={config.styles?.paddingRight || 0}
                            onChange={(e) => handleStyleChange('paddingRight', parseInt(e.target.value) || 0)}
                            size="small"
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default HeadingConfigPanel;
