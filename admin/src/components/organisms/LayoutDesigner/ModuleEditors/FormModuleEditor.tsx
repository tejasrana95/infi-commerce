'use client';

import { TextField, Switch, FormControlLabel, Box, MenuItem, Typography } from '@mui/material';
import { Form, LayoutModule } from '@/types';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

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
        </Box>
    );
}
