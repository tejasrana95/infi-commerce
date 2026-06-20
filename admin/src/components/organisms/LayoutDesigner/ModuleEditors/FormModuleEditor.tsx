'use client';

import { TextField, Switch, FormControlLabel, Box, MenuItem, Typography, Paper } from '@mui/material';
import { Form, LayoutModule } from '@/types';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { ColorPicker } from '@/components/atoms';

interface FormModuleEditorProps {
    module: LayoutModule;
    onChange: (module: LayoutModule) => void;
}

export default function FormModuleEditor({ module, onChange }: FormModuleEditorProps) {
    const [forms, setForms] = useState<Form[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        try {
            const response = await api.get('/forms?status=published'); // Changed axios.get to api.get and added query parameter
            setForms(response.data.forms || []); // Removed client-side filtering as API now filters by status
        } catch (error) {
            console.error('Error fetching forms:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateConfig = (key: string, value: any) => {
        onChange({
            ...module,
            config: { ...module.config, [key]: value },
        });
    };

    const updateUiColor = (key: string, value: string) => {
        updateConfig(key, value);
    };

    const getUiColor = (key: 'buttonBackgroundColor' | 'buttonTextColor' | 'inputBackgroundColor' | 'inputTextColor', fallback: string) => {
        return module.config[key] || module.styling?.[key] || fallback;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
                Form Configuration
            </Typography>

            <TextField
                select
                label="Select Form"
                value={module.config.formId || ''}
                onChange={(e) => updateConfig('formId', e.target.value)}
                fullWidth
                size="small"
                required
                helperText="Only published forms are shown"
                disabled={loading}
            >
                {loading ? (
                    <MenuItem value="">Loading...</MenuItem>
                ) : forms.length === 0 ? (
                    <MenuItem value="">No published forms available</MenuItem>
                ) : (
                    forms.map((form) => (
                        <MenuItem key={form._id} value={form._id}>
                            {form.name} ({form.slug})
                        </MenuItem>
                    ))
                )}
            </TextField>

            <FormControlLabel
                control={
                    <Switch
                        checked={module.config.showTitle ?? true}
                        onChange={(e) => updateConfig('showTitle', e.target.checked)}
                    />
                }
                label="Show Form Title"
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={module.config.showDescription ?? true}
                        onChange={(e) => updateConfig('showDescription', e.target.checked)}
                    />
                }
                label="Show Form Description"
            />

            <TextField
                label="Submit Button Text"
                value={module.config.submitButtonText || 'Submit'}
                onChange={(e) => updateConfig('submitButtonText', e.target.value)}
                fullWidth
                size="small"
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={module.config.inheritBackground ?? false}
                        onChange={(e) => updateConfig('inheritBackground', e.target.checked)}
                    />
                }
                label="Inherit Background Color"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1, display: 'block' }}>
                When enabled, form elements will use contrasting colors based on the section background
            </Typography>

            <TextField
                label="Success Message"
                value={module.config.successMessage || 'Thank you! Your submission has been received.'}
                onChange={(e) => updateConfig('successMessage', e.target.value)}
                fullWidth
                size="small"
                multiline
                rows={2}
            />

            <TextField
                label="Redirect URL (Optional)"
                value={module.config.redirectUrl || ''}
                onChange={(e) => updateConfig('redirectUrl', e.target.value)}
                fullWidth
                size="small"
                placeholder="/thank-you"
                helperText="Leave empty to show success message on same page"
            />

            <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    UI Colors
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Button Background</Typography>
                        <ColorPicker
                            value={getUiColor('buttonBackgroundColor', '#2563eb')}
                            onChange={(color) => updateUiColor('buttonBackgroundColor', color)}
                        />
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Button Text Color</Typography>
                        <ColorPicker
                            value={getUiColor('buttonTextColor', '#ffffff')}
                            onChange={(color) => updateUiColor('buttonTextColor', color)}
                        />
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Input Background</Typography>
                        <ColorPicker
                            value={getUiColor('inputBackgroundColor', '#ffffff')}
                            onChange={(color) => updateUiColor('inputBackgroundColor', color)}
                        />
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Input Text Color</Typography>
                        <ColorPicker
                            value={getUiColor('inputTextColor', '#111827')}
                            onChange={(color) => updateUiColor('inputTextColor', color)}
                        />
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}
