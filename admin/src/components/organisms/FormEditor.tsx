'use client';

import { useState } from 'react';
import {
    Box,
    Paper,
    Tabs,
    Tab,
    TextField,
    Button,
    Typography,
    FormControlLabel,
    Switch,
    Grid,
    Chip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Form, FormSection, Store } from '@/types';
import { useRouter } from 'next/navigation';
import { FormBuilder } from '@/components/organisms/FormBuilder';
import api from '@/lib/api';
import { useEffect } from 'react';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import RichTextEditor from '@/components/molecules/RichTextEditor';
import { MenuItem } from '@mui/material';

interface FormEditorProps {
    form?: Form;
    onSave: (formData: Partial<Form>) => Promise<void>;
    onBack: () => void;
    saving?: boolean;
}

export default function FormEditor({ form, onSave, onBack, saving = false }: FormEditorProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(0);
    const [formData, setFormData] = useState<Partial<Form>>({
        name: form?.name || '',
        slug: form?.slug || '',
        description: form?.description || '',
        storeId: form?.storeId || '',
        status: form?.status || 'draft',
        sections: form?.sections || [],
        emailSettings: form?.emailSettings || {
            to: [],
            subject: '',
            body: '',
        },
        confirmationEmail: form?.confirmationEmail || {
            enabled: false,
            body: '',
            subject: '',
        },
    });

    const [stores, setStores] = useState<Store[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        severity?: 'info' | 'warning' | 'error';
    }>({
        open: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await api.get('/stores');
                setStores(response.data.stores || response.data.data || response.data || []);
            } catch (error) {
                console.error('Error fetching stores:', error);
            }
        };
        fetchStores();
    }, []);

    const handleChange = (field: keyof Form, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleEmailSettingChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            emailSettings: {
                ...prev.emailSettings!,
                [field]: value,
            },
        }));
    };

    const handleConfirmationEmailChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            confirmationEmail: {
                ...(prev.confirmationEmail || { enabled: false, body: '', subject: '' }),
                [field]: value,
            },
        }));
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const hasTabErrors = (tabIndex: number) => {
        const errorKeys = Object.keys(errors);
        if (tabIndex === 0) {
            return errorKeys.some(key => ['name', 'slug', 'storeId', 'description'].includes(key));
        }
        if (tabIndex === 1) {
            return errorKeys.some(key => key.startsWith('sections'));
        }
        if (tabIndex === 2) {
            return errorKeys.some(key => key.startsWith('emailSettings') || key.startsWith('confirmationEmail'));
        }
        return false;
    };

    const handleNameChange = (name: string) => {
        handleChange('name', name);
        if (!form) {
            handleChange('slug', generateSlug(name));
        }
    };

    const handleSave = async (publish = false) => {
        setErrors({});

        if (!formData.storeId) {
            setConfirmDialog({
                open: true,
                title: 'Missing Store',
                message: 'Please select a store before saving.',
                onConfirm: () => setConfirmDialog(prev => ({ ...prev, open: false })),
                severity: 'error',
            });
            return;
        }

        const dataToSave = {
            ...formData,
            status: publish ? 'published' as const : formData.status,
        };

        const onSaveError = (error: any) => {
            const validationErrors = error.response?.data?.details || error.response?.data?.errors;

            if (validationErrors && Array.isArray(validationErrors)) {
                const fieldErrors: Record<string, string> = {};
                let message = 'Please correct the following errors:\n';

                validationErrors.forEach((err: any) => {
                    fieldErrors[err.field] = err.message;
                    message += `• ${err.message}\n`;
                });

                setErrors(fieldErrors);

                setConfirmDialog({
                    open: true,
                    title: 'Validation Error',
                    message: message.trim(),
                    onConfirm: () => setConfirmDialog(prev => ({ ...prev, open: false })),
                    severity: 'error',
                });
            } else {
                setConfirmDialog({
                    open: true,
                    title: 'Error',
                    message: error.response?.data?.error || error.message || 'Error saving form',
                    onConfirm: () => setConfirmDialog(prev => ({ ...prev, open: false })),
                    severity: 'error',
                });
            }
        };

        if (publish) {
            setConfirmDialog({
                open: true,
                title: 'Publish Form',
                message: 'Are you sure you want to publish this form? This will make it available on the storefront.',
                onConfirm: async () => {
                    setConfirmDialog(prev => ({ ...prev, open: false }));
                    try {
                        await onSave(dataToSave);
                    } catch (error: any) {
                        onSaveError(error);
                    }
                },
                severity: 'info',
            });
        } else {
            try {
                await onSave(dataToSave);
            } catch (error: any) {
                onSaveError(error);
            }
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={onBack}
                        variant="outlined"
                    >
                        Back
                    </Button>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                        {form ? 'Edit Form' : 'Create New Form'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<SaveIcon />}
                        onClick={() => handleSave(false)}
                        disabled={saving || !formData.name}
                    >
                        Save Draft
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<PublishIcon />}
                        onClick={() => handleSave(true)}
                        disabled={saving || !formData.name || !formData.emailSettings?.to?.length}
                    >
                        {form?.status === 'published' ? 'Update' : 'Publish'}
                    </Button>
                </Box>
            </Box>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                    <Tab
                        label="General"
                        sx={{ color: hasTabErrors(0) ? 'error.main' : 'inherit' }}
                    />
                    <Tab
                        label="Form Builder"
                        sx={{ color: hasTabErrors(1) ? 'error.main' : 'inherit' }}
                    />
                    <Tab
                        label="Settings"
                        sx={{ color: hasTabErrors(2) ? 'error.main' : 'inherit' }}
                    />
                </Tabs>
            </Paper>

            {/* Tab Content */}
            <Paper sx={{ p: 2 }}>
                {/* General Tab */}
                {activeTab === 0 && (
                    <Box>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Form Name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Select Store"
                                    required
                                    value={formData.storeId}
                                    onChange={(e) => handleChange('storeId', e.target.value)}
                                    error={!!errors.storeId}
                                    helperText={errors.storeId}
                                >
                                    {stores.map((store) => (
                                        <MenuItem key={store._id} value={store._id}>
                                            {store.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Slug"
                                    required
                                    value={formData.slug}
                                    onChange={(e) => handleChange('slug', e.target.value)}
                                    error={!!errors.slug}
                                    helperText={errors.slug || "URL-friendly identifier for this form"}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    multiline
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    error={!!errors.description}
                                    helperText={errors.description}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.status === 'published'}
                                            onChange={(e) => handleChange('status', e.target.checked ? 'published' : 'draft')}
                                        />
                                    }
                                    label="Published"
                                />
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {/* Form Builder Tab */}
                {activeTab === 1 && (
                    <Box sx={{

                        minHeight: 400
                    }}>
                        <FormBuilder
                            sections={formData.sections || []}
                            onChange={(sections) => handleChange('sections', sections)}
                            errors={errors}
                        />
                    </Box>
                )}

                {/* Settings Tab */}
                {activeTab === 2 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Email Notification Settings
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="To (Recipients)"
                                    required
                                    value={formData.emailSettings?.to?.join(', ') || ''}
                                    onChange={(e) => handleEmailSettingChange('to', e.target.value.split(',').map(s => s.trim()))}
                                    error={!!errors['emailSettings.to']}
                                    helperText={errors['emailSettings.to'] || "Comma-separated email addresses"}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="CC"
                                    value={formData.emailSettings?.cc?.join(', ') || ''}
                                    onChange={(e) => handleEmailSettingChange('cc', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    helperText={errors['emailSettings.cc'] || "Optional, comma-separated"}
                                    error={!!errors['emailSettings.cc']}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="BCC"
                                    value={formData.emailSettings?.bcc?.join(', ') || ''}
                                    onChange={(e) => handleEmailSettingChange('bcc', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    helperText={errors['emailSettings.bcc'] || "Optional, comma-separated"}
                                    error={!!errors['emailSettings.bcc']}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Reply-To"
                                    value={formData.emailSettings?.replyTo || ''}
                                    onChange={(e) => handleEmailSettingChange('replyTo', e.target.value)}
                                    error={!!errors['emailSettings.replyTo']}
                                    helperText={errors['emailSettings.replyTo']}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Notification Email Subject"
                                    required
                                    value={formData.emailSettings?.subject}
                                    onChange={(e) => handleEmailSettingChange('subject', e.target.value)}
                                    sx={{ mb: 2 }}
                                    error={!!errors['emailSettings.subject']}
                                    helperText={errors['emailSettings.subject']}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                    Email Body Content
                                </Typography>
                                <RichTextEditor
                                    value={formData.emailSettings?.body || ''}
                                    onChange={(val) => handleEmailSettingChange('body', val)}
                                    placeholder="Enter email template content..."
                                    minHeight={300}
                                    error={!!errors['emailSettings.body']}
                                    helperText={errors['emailSettings.body']}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Form fields will be automatically included in the notification. Use the editor to add header/footer content.
                                </Typography>
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Confirmation Email (to form submitter)
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.confirmationEmail?.enabled || false}
                                                onChange={(e) => handleConfirmationEmailChange('enabled', e.target.checked)}
                                            />
                                        }
                                        label="Send confirmation email to submitter"
                                    />
                                </Grid>
                                {formData.confirmationEmail?.enabled && (
                                    <>
                                        <Grid size={{ xs: 12 }}>
                                            <TextField
                                                fullWidth
                                                label="Reply-To"
                                                value={formData.confirmationEmail?.replyTo || ''}
                                                onChange={(e) => handleConfirmationEmailChange('replyTo', e.target.value)}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12 }}>
                                            <TextField
                                                fullWidth
                                                label="Confirmation Email Subject"
                                                required
                                                value={formData.confirmationEmail?.subject}
                                                onChange={(e) => handleConfirmationEmailChange('subject', e.target.value)}
                                                sx={{ mb: 2 }}
                                                error={!!errors['confirmationEmail.subject']}
                                                helperText={errors['confirmationEmail.subject']}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12 }}>
                                            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                                Confirmation Email Body
                                            </Typography>
                                            <RichTextEditor
                                                value={formData.confirmationEmail?.body || ''}
                                                onChange={(val) => handleConfirmationEmailChange('body', val)}
                                                placeholder="Enter confirmation message for the customer..."
                                                minHeight={300}
                                                error={!!errors['confirmationEmail.body']}
                                                helperText={errors['confirmationEmail.body']}
                                            />
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                        </Box>
                    </Box>
                )}
            </Paper>

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                severity={confirmDialog.severity}
                confirmLabel={confirmDialog.severity === 'error' ? 'OK' : 'Confirm'}
                cancelLabel={confirmDialog.severity === 'error' ? '' : 'Cancel'}
            />
        </Box>
    );
}
