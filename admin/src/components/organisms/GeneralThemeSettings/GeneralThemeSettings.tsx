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
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Palette as PaletteIcon,
    TextFields as TextFieldsIcon,
    Refresh as RefreshIcon,
    ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { ThemeConfig } from '@/types';

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

    const ColorInput = ({
        label,
        value,
        onChange: onChangeColor,
        helperText,
    }: {
        label: string;
        value: string;
        onChange: (color: string) => void;
        helperText?: string;
    }) => (
        <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>{label}</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1,
                        border: '2px solid',
                        borderColor: 'divider',
                        backgroundColor: value,
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        flexShrink: 0,
                    }}
                >
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChangeColor(e.target.value)}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer',
                        }}
                    />
                </Box>
                <TextField
                    size="small"
                    value={value}
                    onChange={(e) => onChangeColor(e.target.value)}
                    sx={{ flex: 1 }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <Tooltip title={copiedColor === value ? 'Copied!' : 'Copy'}>
                                    <IconButton size="small" onClick={() => copyColor(value)}>
                                        <CopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>
            {helperText && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {helperText}
                </Typography>
            )}
        </Box>
    );

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
                            <ColorInput
                                label="Primary Color"
                                value={colors.primary || '#2563eb'}
                                onChange={(color) => updateColors({ primary: color })}
                                helperText="Main brand color for buttons, links"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <ColorInput
                                label="Secondary Color"
                                value={colors.secondary || '#64748b'}
                                onChange={(color) => updateColors({ secondary: color })}
                                helperText="Supporting color for secondary elements"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <ColorInput
                                label="Accent Color"
                                value={colors.accent || '#f59e0b'}
                                onChange={(color) => updateColors({ accent: color })}
                                helperText="Highlight color for CTAs, badges"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <ColorInput
                                label="Background Color"
                                value={colors.background || '#ffffff'}
                                onChange={(color) => updateColors({ background: color })}
                                helperText="Main page background"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <ColorInput
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
        </Box>
    );
}
