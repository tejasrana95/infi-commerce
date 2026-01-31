'use client';

import { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    FormControlLabel,
    Switch,
    TextField,
    Typography,
    Button,
    RadioGroup,
    Radio,
    Stack,
    Alert,
    Paper,
    Grid,
    MenuItem,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import RichTextEditor from '@/components/molecules/RichTextEditor';
import IconPicker from '@/components/atoms/IconPicker';
import { ColorPicker } from '@/components/atoms/ColorPicker';
import DynamicIcon from '@/components/atoms/DynamicIcon';

export interface CookieConsentSettings {
    enabled: boolean;
    title?: string;
    description?: string;
    ctaLink?: string;
    ctaText?: string;
    icon?: string;
    position: 'bottom-left' | 'bottom-center' | 'bottom-right';
    width: 'full' | 'half' | 'custom';
    customWidth?: number;
    backgroundColor?: string;
    textColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
}

interface CookieConsentSettingsProps {
    storeId: string;
    initialSettings?: CookieConsentSettings;
    onSave: (settings: CookieConsentSettings) => Promise<void>;
    saving: boolean;
}

const DEFAULT_SETTINGS: CookieConsentSettings = {
    enabled: false,
    title: '',
    description: '',
    ctaLink: '',
    ctaText: 'Accept',
    icon: '',
    position: 'bottom-center',
    width: 'half',
    backgroundColor: '#1f2937',
    textColor: '#ffffff',
    buttonColor: '#3b82f6',
    buttonTextColor: '#ffffff',
};

const PREDEFINED_STYLES = [
    {
        name: 'Modern Dark',
        backgroundColor: '#1f2937',
        textColor: '#ffffff',
        buttonColor: '#3b82f6',
        buttonTextColor: '#ffffff',
    },
    {
        name: 'Modern Light',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        buttonColor: '#3b82f6',
        buttonTextColor: '#ffffff',
    },
    {
        name: 'Minimalist Gray',
        backgroundColor: '#f3f4f6',
        textColor: '#374151',
        buttonColor: '#6b7280',
        buttonTextColor: '#ffffff',
    },
    {
        name: 'Green Accent',
        backgroundColor: '#ecfdf5',
        textColor: '#065f46',
        buttonColor: '#10b981',
        buttonTextColor: '#ffffff',
    },
    {
        name: 'Red Alert',
        backgroundColor: '#fef2f2',
        textColor: '#7f1d1d',
        buttonColor: '#dc2626',
        buttonTextColor: '#ffffff',
    },
    {
        name: 'Blue Professional',
        backgroundColor: '#eff6ff',
        textColor: '#0c2d6b',
        buttonColor: '#0284c7',
        buttonTextColor: '#ffffff',
    },
];

export default function CookieConsentSettingsComponent({
    initialSettings,
    onSave,
    saving,
}: CookieConsentSettingsProps) {
    const [settings, setSettings] = useState<CookieConsentSettings>(
        initialSettings || DEFAULT_SETTINGS
    );
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (settings.enabled) {
            if (!settings.title?.trim()) {
                setError('Title is required when cookie consent is enabled');
                return;
            }
            if (!settings.description?.trim()) {
                setError('Description is required when cookie consent is enabled');
                return;
            }
        }

        try {
            setError(null);
            await onSave(settings);
        } catch (err: unknown) {
            const error = err as { message?: string };
            setError(error.message || 'Failed to save cookie consent settings');
        }
    };

    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS);
    };

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Settings Form */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Stack spacing={3}>
                                {/* Enable/Disable */}
                                <Box>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.enabled}
                                                onChange={(e) =>
                                                    setSettings({ ...settings, enabled: e.target.checked })
                                                }
                                            />
                                        }
                                        label={
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                Enable Cookie Consent Banner
                                            </Typography>
                                        }
                                    />
                                </Box>

                                {settings.enabled && (
                                    <>
                                        {/* Title */}
                                        <TextField
                                            fullWidth
                                            label="Banner Title"
                                            value={settings.title || ''}
                                            onChange={(e) =>
                                                setSettings({ ...settings, title: e.target.value })
                                            }
                                            placeholder="e.g., We use cookies"
                                        />

                                        {/* Description with RTE */}
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={600} mb={1}>
                                                Banner Description
                                            </Typography>
                                            <RichTextEditor
                                                value={settings.description || ''}
                                                onChange={(content) =>
                                                    setSettings({ ...settings, description: content })
                                                }
                                                placeholder="Describe your cookie usage..."
                                            />
                                        </Box>

                                        {/* CTA Link and Text */}
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="CTA Button Text"
                                                    value={settings.ctaText || ''}
                                                    onChange={(e) =>
                                                        setSettings({ ...settings, ctaText: e.target.value })
                                                    }
                                                    placeholder="e.g., Accept"
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="CTA Link (Optional)"
                                                    type="url"
                                                    value={settings.ctaLink || ''}
                                                    onChange={(e) =>
                                                        setSettings({ ...settings, ctaLink: e.target.value })
                                                    }
                                                    placeholder="e.g., /privacy-policy"
                                                />
                                            </Grid>
                                        </Grid>

                                        {/* Icon Picker */}
                                        <Box>
                                            <IconPicker
                                                value={settings.icon || ''}
                                                onChange={(icon) =>
                                                    setSettings({ ...settings, icon })
                                                }
                                                label="Banner Icon"
                                                fullWidth
                                            />
                                        </Box>

                                        {/* Position */}
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={600} mb={2}>
                                                Banner Position
                                            </Typography>
                                            <RadioGroup
                                                row
                                                value={settings.position}
                                                onChange={(e) =>
                                                    setSettings({
                                                        ...settings,
                                                        position: e.target
                                                            .value as CookieConsentSettings['position'],
                                                    })
                                                }
                                            >
                                                <FormControlLabel
                                                    value="bottom-left"
                                                    control={<Radio />}
                                                    label="Bottom Left"
                                                />
                                                <FormControlLabel
                                                    value="bottom-center"
                                                    control={<Radio />}
                                                    label="Bottom Center"
                                                />
                                                <FormControlLabel
                                                    value="bottom-right"
                                                    control={<Radio />}
                                                    label="Bottom Right"
                                                />
                                            </RadioGroup>
                                        </Box>

                                        {/* Width */}
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={600} mb={2}>
                                                Banner Width
                                            </Typography>
                                            <RadioGroup
                                                row
                                                value={settings.width}
                                                onChange={(e) =>
                                                    setSettings({
                                                        ...settings,
                                                        width: e.target.value as CookieConsentSettings['width'],
                                                    })
                                                }
                                            >
                                                <FormControlLabel value="full" control={<Radio />} label="Full" />
                                                <FormControlLabel value="half" control={<Radio />} label="Half" />
                                                <FormControlLabel value="custom" control={<Radio />} label="Custom" />
                                            </RadioGroup>

                                            {settings.width === 'custom' && (
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    label="Custom Width (px)"
                                                    value={settings.customWidth || ''}
                                                    onChange={(e) =>
                                                        setSettings({
                                                            ...settings,
                                                            customWidth: parseInt(e.target.value) || undefined,
                                                        })
                                                    }
                                                    inputProps={{ min: 200, max: 1200 }}
                                                    sx={{ mt: 2 }}
                                                />
                                            )}
                                        </Box>

                                        {/* Colors */}
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={600} mb={2}>
                                                Style Preset
                                            </Typography>
                                            <TextField
                                                select
                                                fullWidth
                                                value="custom"
                                                label="Choose a Style"
                                                sx={{ mb: 2 }}
                                            >
                                                <MenuItem value="custom">Custom</MenuItem>
                                                {PREDEFINED_STYLES.map((style) => (
                                                    <MenuItem
                                                        key={style.name}
                                                        value={style.name}
                                                        onClick={() =>
                                                            setSettings({
                                                                ...settings,
                                                                backgroundColor: style.backgroundColor,
                                                                textColor: style.textColor,
                                                                buttonColor: style.buttonColor,
                                                                buttonTextColor: style.buttonTextColor,
                                                            })
                                                        }
                                                    >
                                                        {style.name}
                                                    </MenuItem>
                                                ))}
                                            </TextField>

                                            <Typography variant="subtitle2" fontWeight={600} mb={2}>
                                                Custom Colors
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <ColorPicker
                                                        label="Background Color"
                                                        value={settings.backgroundColor || '#1f2937'}
                                                        onChange={(value) =>
                                                            setSettings({
                                                                ...settings,
                                                                backgroundColor: value,
                                                            })
                                                        }
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <ColorPicker
                                                        label="Text Color"
                                                        value={settings.textColor || '#ffffff'}
                                                        onChange={(value) =>
                                                            setSettings({
                                                                ...settings,
                                                                textColor: value,
                                                            })
                                                        }
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <ColorPicker
                                                        label="Button Color"
                                                        value={settings.buttonColor || '#3b82f6'}
                                                        onChange={(value) =>
                                                            setSettings({
                                                                ...settings,
                                                                buttonColor: value,
                                                            })
                                                        }
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <ColorPicker
                                                        label="Button Text Color"
                                                        value={settings.buttonTextColor || '#ffffff'}
                                                        onChange={(value) =>
                                                            setSettings({
                                                                ...settings,
                                                                buttonTextColor: value,
                                                            })
                                                        }
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        {/* Save/Reset Buttons */}
                                        <Box display="flex" gap={2} pt={2}>
                                            <Button
                                                variant="contained"
                                                startIcon={<SaveIcon />}
                                                onClick={handleSave}
                                                disabled={saving}
                                            >
                                                {saving ? 'Saving...' : 'Save Settings'}
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                startIcon={<RestoreIcon />}
                                                onClick={handleReset}
                                                disabled={saving}
                                            >
                                                Reset to Defaults
                                            </Button>
                                        </Box>
                                    </>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Preview */}
                {settings.enabled && (
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} mb={2}>
                                    Preview
                                </Typography>
                                <CookieBannerPreview settings={settings} />
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
}

// Preview Component
function CookieBannerPreview({ settings }: { settings: CookieConsentSettings }) {
    const getPositionStyles = (): Record<string, string | number> => {
        const baseStyles: Record<string, string | number> = {
            position: 'fixed',
            bottom: 20,
            padding: '20px',
            borderRadius: '8px',
            backgroundColor: settings.backgroundColor || '#1f2937',
            color: settings.textColor || '#ffffff',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
        };

        if (settings.width === 'full') {
            baseStyles.width = 'calc(100% - 40px)';
            baseStyles.left = 20;
        } else if (settings.width === 'half') {
            baseStyles.width = 'calc(50% - 40px)';
            if (settings.position === 'bottom-left') {
                baseStyles.left = 20;
            } else if (settings.position === 'bottom-center') {
                baseStyles.left = '25%';
            } else {
                baseStyles.right = 20;
            }
        } else {
            const customWidth = settings.customWidth || 400;
            baseStyles.width = `${customWidth}px`;
            if (settings.position === 'bottom-left') {
                baseStyles.left = 20;
            } else if (settings.position === 'bottom-center') {
                baseStyles.left = `calc(50% - ${customWidth / 2}px)`;
            } else {
                baseStyles.right = 20;
            }
        }

        return baseStyles;
    };

    return (
        <Paper
            elevation={3}
            sx={{
                ...getPositionStyles(),
                position: 'relative',
                bottom: 'auto',
                left: 'auto !important',
                right: 'auto !important',
                width: '100% !important',
                mb: 2,
            }}
        >
            <Box display="flex" gap={2} alignItems="flex-start">
                {settings.icon && (
                    <Box sx={{ flexShrink: 0, mt: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DynamicIcon name={settings.icon} size={24} />
                    </Box>
                )}
                <Box flex={1}>
                    <Typography variant="subtitle2" fontWeight={600}>
                        {settings.title || 'Cookie Title'}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.9 }} dangerouslySetInnerHTML={{ __html: settings.description || 'Cookie description will appear here...' }}>
                    </Typography>
                </Box>
            </Box>
            <Box display="flex" gap={1} mt={2}>
                <Button
                    size="small"
                    sx={{
                        backgroundColor: settings.buttonColor,
                        color: settings.buttonTextColor,
                        '&:hover': {
                            opacity: 0.9,
                        },
                    }}
                >
                    {settings.ctaText || 'Accept'}
                </Button>
                {settings.ctaLink && (
                    <Button
                        size="small"
                        variant="text"
                        sx={{ color: settings.textColor }}
                    >
                        Learn More
                    </Button>
                )}
            </Box>
        </Paper>
    );
}
