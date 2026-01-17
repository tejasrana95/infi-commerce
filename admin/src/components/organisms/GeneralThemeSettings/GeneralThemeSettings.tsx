'use client';

import { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    TextField,
    Paper,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment,
    IconButton,
    Tooltip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Stack,
    FormLabel,
    Switch,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Palette as PaletteIcon,
    TextFields as TextFieldsIcon,
    Refresh as RefreshIcon,
    ContentCopy as CopyIcon,
    VerticalAlignTop as ScrollTopIcon,
} from '@mui/icons-material';
import { ThemeConfig } from '@/types';
import { ColorPicker } from '@/components/atoms';

// Popular Google Fonts
const GOOGLE_FONTS = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Raleway',
    'Outfit',
    'Nunito',
    'Source Sans Pro',
    'Playfair Display',
    'Merriweather',
    'Oswald',
    'Work Sans',
    'DM Sans',
];

// Predefined color palettes
const COLOR_PALETTES = [
    {
        name: 'Modern Blue',
        colors: {
            primary: '#2563eb',
            secondary: '#64748b',
            accent: '#f59e0b',
            background: '#ffffff',
            text: '#1e293b',
        },
    },
    {
        name: 'Elegant Purple',
        colors: {
            primary: '#7c3aed',
            secondary: '#6b7280',
            accent: '#ec4899',
            background: '#fafafa',
            text: '#111827',
        },
    },
    {
        name: 'Fresh Green',
        colors: {
            primary: '#10b981',
            secondary: '#6b7280',
            accent: '#f97316',
            background: '#ffffff',
            text: '#1f2937',
        },
    },
    {
        name: 'Warm Orange',
        colors: {
            primary: '#ea580c',
            secondary: '#78716c',
            accent: '#0891b2',
            background: '#fffbeb',
            text: '#292524',
        },
    },
    {
        name: 'Corporate Gray',
        colors: {
            primary: '#374151',
            secondary: '#9ca3af',
            accent: '#3b82f6',
            background: '#f9fafb',
            text: '#111827',
        },
    },
    {
        name: 'Dark Mode',
        colors: {
            primary: '#6366f1',
            secondary: '#a1a1aa',
            accent: '#22d3ee',
            background: '#18181b',
            text: '#fafafa',
        },
    },
];

interface GeneralThemeSettingsProps {
    config: ThemeConfig;
    onChange: (config: ThemeConfig) => void;
}

export default function GeneralThemeSettings({ config, onChange }: GeneralThemeSettingsProps) {
    const [copiedColor, setCopiedColor] = useState<string | null>(null);

    const colors = config.colors || {
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1e293b',
    };

    const fonts = config.fonts || {
        heading: 'Inter',
        body: 'Inter',
    };

    const updateColors = (newColors: Partial<typeof colors>) => {
        onChange({
            ...config,
            colors: { ...colors, ...newColors },
        });
    };

    const updateFonts = (newFonts: Partial<typeof fonts>) => {
        onChange({
            ...config,
            fonts: { ...fonts, ...newFonts },
        });
    };

    const updateScrollToTop = (updates: Partial<NonNullable<ThemeConfig['scrollToTop']>>) => {
        const current = config.scrollToTop || {
            enabled: false,
            position: 'bottom-right',
            xAxis: 20,
            yAxis: 20,
            colors: {
                icon: '#ffffff',
                background: '#000000',
            },
            borderRadius: 50,
        };

        onChange({
            ...config,
            scrollToTop: { ...current, ...updates },
        });
    };

    const applyPalette = (palette: typeof COLOR_PALETTES[0]) => {
        onChange({
            ...config,
            colors: palette.colors,
        });
    };

    const copyColor = (color: string) => {
        navigator.clipboard.writeText(color);
        setCopiedColor(color);
        setTimeout(() => setCopiedColor(null), 2000);
    };



    return (
        <Box>
            {/* Color Palette Section */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PaletteIcon color="primary" />
                        <Typography variant="h6">Color Palette</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    {/* Quick Palette Presets */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>
                            Quick Presets
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {COLOR_PALETTES.map((palette) => (
                                <Chip
                                    key={palette.name}
                                    label={palette.name}
                                    onClick={() => applyPalette(palette)}
                                    sx={{
                                        '&:hover': {
                                            boxShadow: 2,
                                        },
                                    }}
                                    icon={
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                gap: '2px',
                                                ml: 1,
                                            }}
                                        >
                                            {Object.values(palette.colors).slice(0, 3).map((color, idx) => (
                                                <Box
                                                    key={idx}
                                                    sx={{
                                                        width: 12,
                                                        height: 12,
                                                        borderRadius: '50%',
                                                        backgroundColor: color,
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    }
                                />
                            ))}
                        </Stack>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Custom Colors */}
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <ColorPicker
                                label="Primary Color"
                                value={colors.primary || '#2563eb'}
                                onChange={(color) => updateColors({ primary: color })}
                                helperText="Main brand color for buttons, links"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <ColorPicker
                                label="Secondary Color"
                                value={colors.secondary || '#64748b'}
                                onChange={(color) => updateColors({ secondary: color })}
                                helperText="Supporting color for secondary elements"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <ColorPicker
                                label="Accent Color"
                                value={colors.accent || '#f59e0b'}
                                onChange={(color) => updateColors({ accent: color })}
                                helperText="Highlight color for CTAs, badges"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <ColorPicker
                                label="Background Color"
                                value={colors.background || '#ffffff'}
                                onChange={(color) => updateColors({ background: color })}
                                helperText="Main page background"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <ColorPicker
                                label="Text Color"
                                value={colors.text || '#1e293b'}
                                onChange={(color) => updateColors({ text: color })}
                                helperText="Primary text color"
                            />
                        </Grid>
                    </Grid>

                    {/* Color Preview */}
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>Preview</Typography>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                backgroundColor: colors.background,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                            }}
                        >
                            <Typography
                                variant="h5"
                                sx={{ color: colors.text, mb: 1, fontWeight: 600 }}
                            >
                                Sample Heading
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ color: colors.text, mb: 2, opacity: 0.8 }}
                            >
                                This is how your text will look on the storefront. The colors you choose will define your brand identity.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Box
                                    sx={{
                                        px: 3,
                                        py: 1,
                                        backgroundColor: colors.primary,
                                        color: '#fff',
                                        borderRadius: 1,
                                        fontWeight: 500,
                                    }}
                                >
                                    Primary Button
                                </Box>
                                <Box
                                    sx={{
                                        px: 3,
                                        py: 1,
                                        backgroundColor: colors.secondary,
                                        color: '#fff',
                                        borderRadius: 1,
                                        fontWeight: 500,
                                    }}
                                >
                                    Secondary
                                </Box>
                                <Box
                                    sx={{
                                        px: 3,
                                        py: 1,
                                        backgroundColor: colors.accent,
                                        color: '#fff',
                                        borderRadius: 1,
                                        fontWeight: 500,
                                    }}
                                >
                                    Accent
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Typography Section */}
            <Accordion defaultExpanded sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextFieldsIcon color="primary" />
                        <Typography variant="h6">Typography</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Heading Font</InputLabel>
                                <Select
                                    value={fonts.heading || 'Inter'}
                                    label="Heading Font"
                                    onChange={(e) => updateFonts({ heading: e.target.value })}
                                >
                                    {GOOGLE_FONTS.map((font) => (
                                        <MenuItem key={font} value={font}>
                                            <span style={{ fontFamily: font }}>{font}</span>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Used for page titles, product names, section headers
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Body Font</InputLabel>
                                <Select
                                    value={fonts.body || 'Inter'}
                                    label="Body Font"
                                    onChange={(e) => updateFonts({ body: e.target.value })}
                                >
                                    {GOOGLE_FONTS.map((font) => (
                                        <MenuItem key={font} value={font}>
                                            <span style={{ fontFamily: font }}>{font}</span>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Used for paragraphs, descriptions, general content
                            </Typography>
                        </Grid>
                    </Grid>

                    {/* Typography Preview */}
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>Preview</Typography>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                backgroundColor: colors.background || '#ffffff',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                            }}
                        >
                            <Typography
                                variant="h4"
                                sx={{
                                    fontFamily: fonts.heading || 'Inter',
                                    color: colors.text || '#1e293b',
                                    mb: 2,
                                    fontWeight: 600,
                                }}
                            >
                                The Quick Brown Fox
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontFamily: fonts.heading || 'Inter',
                                    color: colors.text || '#1e293b',
                                    mb: 2,
                                }}
                            >
                                Jumps Over the Lazy Dog
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    fontFamily: fonts.body || 'Inter',
                                    color: colors.text || '#1e293b',
                                    lineHeight: 1.7,
                                }}
                            >
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                            </Typography>
                        </Paper>
                    </Box>
                </AccordionDetails>
            </Accordion>



            <Accordion defaultExpanded sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScrollTopIcon color="primary" />
                        <Typography variant="h6">Scroll to Top Indicator</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <FormControl component="fieldset">
                                    <FormLabel component="legend">Enable Indicator</FormLabel>
                                    <Switch
                                        checked={config.scrollToTop?.enabled || false}
                                        onChange={(e) => updateScrollToTop({ enabled: e.target.checked })}
                                    />
                                </FormControl>
                            </Box>
                        </Grid>

                        {(config.scrollToTop?.enabled) && (
                            <>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Position</InputLabel>
                                        <Select
                                            value={config.scrollToTop?.position || 'bottom-right'}
                                            label="Position"
                                            onChange={(e) => updateScrollToTop({ position: e.target.value as any })}
                                        >
                                            <MenuItem value="bottom-left">Bottom Left</MenuItem>
                                            <MenuItem value="bottom-center">Bottom Center</MenuItem>
                                            <MenuItem value="bottom-right">Bottom Right</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Border Radius"
                                        type="number"
                                        value={config.scrollToTop?.borderRadius ?? 50}
                                        onChange={(e) => updateScrollToTop({ borderRadius: Number(e.target.value) })}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">px</InputAdornment>,
                                        }}
                                        helperText="For fully rounded, use 50% equivalent (large number)"
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="X Axis Offset"
                                        type="number"
                                        value={config.scrollToTop?.xAxis ?? 20}
                                        onChange={(e) => updateScrollToTop({ xAxis: Number(e.target.value) })}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">px</InputAdornment>,
                                        }}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Y Axis Offset"
                                        type="number"
                                        value={config.scrollToTop?.yAxis ?? 20}
                                        onChange={(e) => updateScrollToTop({ yAxis: Number(e.target.value) })}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">px</InputAdornment>,
                                        }}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <ColorPicker
                                        label="Icon Color"
                                        value={config.scrollToTop?.colors?.icon || '#ffffff'}
                                        onChange={(color) => updateScrollToTop({
                                            colors: { ...(config.scrollToTop?.colors || { background: '#000000' }), icon: color } as any
                                        })}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <ColorPicker
                                        label="Background Color"
                                        value={config.scrollToTop?.colors?.background || '#000000'}
                                        onChange={(color) => updateScrollToTop({
                                            colors: { ...(config.scrollToTop?.colors || { icon: '#ffffff' }), background: color } as any
                                        })}
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </Box >
    );
}
