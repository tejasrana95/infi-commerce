'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
    Box, Typography, Card, CardContent, Chip, IconButton, Tooltip,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem,
    CircularProgress, Alert, Stack, Switch,
    FormControlLabel, Paper, Divider, Checkbox,
    FormGroup, FormHelperText, SelectChangeEvent,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    DataGrid, GridColDef, GridRenderCellParams,
} from '@mui/x-data-grid';
import {
    Edit, Visibility, Refresh, Email, Sms, WhatsApp,
    Close, Info, Add, Delete,
    ContentCopy, RestartAlt,
    Telegram,
} from '@mui/icons-material';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import RichTextEditor from '@/components/molecules/RichTextEditor';

interface Store {
    _id: string;
    name: string;
}

interface TemplateType {
    value: string;
    label: string;
    description: string;
    variables: string[];
}

interface NotificationTemplate {
    _id: string;
    storeIds: string[];
    storeNames?: string[];
    type: string;
    channel: 'email' | 'sms' | 'whatsapp';
    name: string;
    subject?: string;
    htmlContent?: string;
    textContent: string;
    variables: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface TemplateFormData {
    storeIds: string[];
    type: string;
    channel: 'email' | 'sms' | 'whatsapp' | 'telegram';
    name: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    isActive: boolean;
}

const initialFormData: TemplateFormData = {
    storeIds: [],
    type: '',
    channel: 'email',
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    isActive: true,
};

// Variable categories for the dynamic variables panel
const VARIABLE_CATEGORIES = {
    user: {
        label: 'User',
        variables: ['firstName', 'lastName', 'email', 'phone'],
    },
    store: {
        label: 'Store',
        variables: ['storeName', 'storeAddress', 'storePhone', 'storeEmail'],
    },
    links: {
        label: 'Links',
        variables: ['verifyUrl', 'resetUrl', 'loginUrl'],
    },
    order: {
        label: 'Order',
        variables: ['orderNumber', 'total', 'itemCount', 'orderUrl', 'invoiceDownloadLink'],
    },
    shipping: {
        label: 'Shipping',
        variables: ['trackingNumber', 'trackingUrl', 'estimatedDelivery'],
    },
    product: {
        label: 'Product',
        variables: ['productName', 'productUrl', 'cartUrl', 'reviewUrl'],
    },
};

export default function NotificationTemplatesPage() {
    const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [templateTypes, setTemplateTypes] = useState<TemplateType[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    // Filters
    const [channelFilter, setChannelFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [storeFilter, setStoreFilter] = useState<string>('');

    // Add/Edit Dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
    const [formData, setFormData] = useState<TemplateFormData>(initialFormData);
    const [saving, setSaving] = useState(false);

    const [loadingDefault, setLoadingDefault] = useState(false);

    // Preview Dialog
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);

    // Delete Confirmation
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<NotificationTemplate | null>(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadTemplates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channelFilter, typeFilter, storeFilter]);

    const loadInitialData = async () => {
        try {
            const [storesRes, typesRes] = await Promise.all([
                api.get('stores'),
                api.get('notifications/templates/types'),
            ]);
            setStores(storesRes.data.stores || []);
            setTemplateTypes(typesRes.data.types || []);
        } catch (error) {
            console.error('Failed to load initial data:', error);
            showNotification('Failed to load initial data', 'error');
        }
    };

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = {};
            if (channelFilter) params.channel = channelFilter;
            if (typeFilter) params.type = typeFilter;
            if (storeFilter) params.storeId = storeFilter;

            const res = await api.get('notifications/templates/list', { params });
            setTemplates(res.data.templates || []);
        } catch (error) {
            console.error('Failed to load templates:', error);
            showNotification('Failed to load templates', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingTemplate(null);
        setFormData({
            ...initialFormData,
            storeIds: stores.length === 1 ? [stores[0]._id] : [],
        });

        setDialogOpen(true);
    };

    const handleOpenEdit = (template: NotificationTemplate) => {
        setEditingTemplate(template);
        setFormData({
            storeIds: template.storeIds,
            type: template.type,
            channel: template.channel,
            name: template.name,
            subject: template.subject || '',
            htmlContent: template.htmlContent || '',
            textContent: template.textContent,
            isActive: template.isActive,
        });

        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingTemplate(null);
        setFormData(initialFormData);
    };

    const handleLoadDefault = async () => {
        if (!formData.type || !formData.channel) {
            showNotification('Please select type and channel first', 'warning');
            return;
        }

        setLoadingDefault(true);
        try {
            const res = await api.get('notifications/templates/default', {
                params: { type: formData.type, channel: formData.channel },
            });
            const defaultTemplate = res.data.template;
            setFormData(prev => ({
                ...prev,
                name: defaultTemplate.name,
                subject: defaultTemplate.subject || '',
                htmlContent: defaultTemplate.htmlContent || '',
                textContent: defaultTemplate.textContent,
            }));
            showNotification('Default template loaded', 'success');
        } catch (error) {
            console.error('Failed to load default template:', error);
            showNotification('No default template available for this type/channel', 'warning');
        } finally {
            setLoadingDefault(false);
        }
    };

    const handleSave = async () => {
        // Validation
        if (formData.storeIds.length === 0) {
            showNotification('Please select at least one store', 'error');
            return;
        }
        if (!formData.type) {
            showNotification('Please select a template type', 'error');
            return;
        }
        if (!formData.name) {
            showNotification('Please enter a template name', 'error');
            return;
        }
        if (!formData.textContent) {
            showNotification('Please enter template content', 'error');
            return;
        }

        setSaving(true);
        try {
            if (editingTemplate) {
                // Update
                await api.put(`notifications/templates/${editingTemplate._id}`, {
                    storeIds: formData.storeIds,
                    name: formData.name,
                    subject: formData.subject,
                    htmlContent: formData.htmlContent,
                    textContent: formData.textContent,
                    isActive: formData.isActive,
                });
                showNotification('Template updated successfully', 'success');
            } else {
                // Create
                await api.post('notifications/templates', formData);
                showNotification('Template created successfully', 'success');
            }
            handleCloseDialog();
            loadTemplates();
        } catch (error: any) {
            console.error('Failed to save template:', error);
            const message = error.response?.data?.message || 'Failed to save template';
            showNotification(message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (template: NotificationTemplate) => {
        try {
            await api.patch(`notifications/templates/${template._id}/toggle`);
            showNotification(
                `Template ${template.isActive ? 'deactivated' : 'activated'} successfully`,
                'success'
            );
            loadTemplates();
        } catch (error: any) {
            console.error('Failed to toggle status:', error);
            const message = error.response?.data?.message || 'Failed to toggle status';
            showNotification(message, 'error');
        }
    };

    const handleDeleteConfirm = (template: NotificationTemplate) => {
        setTemplateToDelete(template);
        setDeleteConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!templateToDelete) return;

        try {
            await api.delete(`notifications/templates/${templateToDelete._id}`);
            showNotification('Template deleted successfully', 'success');
            setDeleteConfirmOpen(false);
            setTemplateToDelete(null);
            loadTemplates();
        } catch (error) {
            console.error('Failed to delete template:', error);
            showNotification('Failed to delete template', 'error');
        }
    };

    const handlePreview = (template: NotificationTemplate) => {
        setPreviewTemplate(template);
        setPreviewOpen(true);
    };

    const insertVariable = useCallback((variable: string) => {
        const variableText = `{{${variable}}}`;
        // Copy to clipboard
        navigator.clipboard.writeText(variableText);
        showNotification(`Copied ${variableText} to clipboard`, 'success');
    }, [showNotification]);

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'email': return <Email fontSize="small" />;
            case 'sms': return <Sms fontSize="small" />;
            case 'whatsapp': return <WhatsApp fontSize="small" />;
            case 'telegram': return <Telegram fontSize="small" />;
            default: return null;
        }
    };

    const getChannelColor = (channel: string): 'primary' | 'success' | 'warning' => {
        switch (channel) {
            case 'email': return 'primary';
            case 'sms': return 'warning';
            case 'whatsapp': return 'success';
            case 'telegram': return 'success';
            default: return 'primary';
        }
    };

    const formatType = (type: string) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    // Get unique types for filter dropdown
    const uniqueTypes = useMemo(() => {
        const types = [...new Set(templates.map(t => t.type))];
        return types.sort();
    }, [templates]);

    // Get current template type info for variables panel
    const currentTypeInfo = useMemo(() => {
        return templateTypes.find(t => t.value === formData.type);
    }, [templateTypes, formData.type]);

    const columns: GridColDef[] = useMemo(() => [
        {
            field: 'name',
            headerName: 'Template Name',
            width: 200,
            flex: 1,
        },
        {
            field: 'storeNames',
            headerName: 'Stores',
            width: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {(params.value || []).slice(0, 2).map((name: string, idx: number) => (
                        <Chip key={idx} label={name} size="small" variant="outlined" />
                    ))}
                    {(params.value || []).length > 2 && (
                        <Chip label={`+${params.value.length - 2}`} size="small" color="default" />
                    )}
                </Stack>
            ),
        },
        {
            field: 'type',
            headerName: 'Type',
            width: 140,
            renderCell: (params: GridRenderCellParams) => formatType(params.value),
        },
        {
            field: 'channel',
            headerName: 'Channel',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    icon={getChannelIcon(params.value) || undefined}
                    label={params.value.toUpperCase()}
                    size="small"
                    color={getChannelColor(params.value)}
                    variant="outlined"
                />
            ),
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.value ? 'Active' : 'Inactive'}
                    size="small"
                    color={params.value ? 'success' : 'default'}
                />
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 180,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box>
                    <Tooltip title="Preview">
                        <IconButton size="small" onClick={() => handlePreview(params.row)}>
                            <Visibility fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(params.row)}>
                            <Edit fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={params.row.isActive ? 'Deactivate' : 'Activate'}>
                        <IconButton
                            size="small"
                            color={params.row.isActive ? 'warning' : 'success'}
                            onClick={() => handleToggleStatus(params.row)}
                        >
                            <RestartAlt fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDeleteConfirm(params.row)}>
                            <Delete fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ], []);

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Notification Templates</Typography>
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" startIcon={<Refresh />} onClick={loadTemplates}>
                        Refresh
                    </Button>
                    <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
                        Add Template
                    </Button>
                </Stack>
            </Box>

            {/* Info Card */}
            <Alert severity="info" sx={{ mb: 3 }}>
                Create and manage notification templates for email, SMS, and WhatsApp.
                Each store can only have <strong>one active template</strong> per type and channel.
            </Alert>

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Store</InputLabel>
                                <Select
                                    value={storeFilter}
                                    label="Store"
                                    onChange={(e) => setStoreFilter(e.target.value)}
                                >
                                    <MenuItem value="">All Stores</MenuItem>
                                    {stores.map(store => (
                                        <MenuItem key={store._id} value={store._id}>{store.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Channel</InputLabel>
                                <Select
                                    value={channelFilter}
                                    label="Channel"
                                    onChange={(e) => setChannelFilter(e.target.value)}
                                >
                                    <MenuItem value="">All Channels</MenuItem>
                                    <MenuItem value="email">Email</MenuItem>
                                    <MenuItem value="sms">SMS</MenuItem>
                                    <MenuItem value="whatsapp">WhatsApp</MenuItem>
                                    <MenuItem value="telegram">Telegram</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={typeFilter}
                                    label="Type"
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                >
                                    <MenuItem value="">All Types</MenuItem>
                                    {uniqueTypes.map(type => (
                                        <MenuItem key={type} value={type}>{formatType(type)}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Data Grid */}
            <Card>
                <DataGrid
                    rows={templates}
                    columns={columns}
                    getRowId={(row) => row._id}
                    loading={loading}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    autoHeight
                    disableRowSelectionOnClick
                    sx={{ border: 0 }}
                />
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
                <DialogTitle>
                    {editingTemplate ? 'Edit Template' : 'Add New Template'}
                    <IconButton onClick={handleCloseDialog} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        {/* Left: Form */}
                        <Grid size={{ xs: 12, md: 8 }}>
                            {/* Store Selection */}
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Select Stores *
                                </Typography>
                                <FormGroup row>
                                    {stores.map(store => (
                                        <FormControlLabel
                                            key={store._id}
                                            control={
                                                <Checkbox
                                                    checked={formData.storeIds.includes(store._id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                storeIds: [...prev.storeIds, store._id],
                                                            }));
                                                        } else {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                storeIds: prev.storeIds.filter(id => id !== store._id),
                                                            }));
                                                        }
                                                    }}
                                                />
                                            }
                                            label={store.name}
                                        />
                                    ))}
                                </FormGroup>
                                <FormHelperText>
                                    Template will be available for selected stores
                                </FormHelperText>
                            </FormControl>

                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                {/* Type */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <FormControl fullWidth disabled={!!editingTemplate}>
                                        <InputLabel>Template Type *</InputLabel>
                                        <Select
                                            value={formData.type}
                                            label="Template Type *"
                                            onChange={(e: SelectChangeEvent) => setFormData(prev => ({
                                                ...prev,
                                                type: e.target.value,
                                            }))}
                                        >
                                            {templateTypes.map(type => (
                                                <MenuItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {currentTypeInfo && (
                                            <FormHelperText>{currentTypeInfo.description}</FormHelperText>
                                        )}
                                    </FormControl>
                                </Grid>

                                {/* Channel */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <FormControl fullWidth disabled={!!editingTemplate}>
                                        <InputLabel>Channel *</InputLabel>
                                        <Select
                                            value={formData.channel}
                                            label="Channel *"
                                            onChange={(e: SelectChangeEvent<'email' | 'sms' | 'whatsapp' | 'telegram'>) => {
                                                const channel = e.target.value as 'email' | 'sms' | 'whatsapp' | 'telegram';
                                                setFormData(prev => ({ ...prev, channel }));
                                            }}
                                        >
                                            <MenuItem value="email">
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Email fontSize="small" /> <span>Email</span>
                                                </Stack>
                                            </MenuItem>
                                            <MenuItem value="sms">
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Sms fontSize="small" /> <span>SMS</span>
                                                </Stack>
                                            </MenuItem>
                                            <MenuItem value="whatsapp">
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <WhatsApp fontSize="small" /> <span>WhatsApp</span>
                                                </Stack>
                                            </MenuItem>
                                            <MenuItem value="telegram">
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Telegram fontSize="small" /> <span>Telegram</span>
                                                </Stack>
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            {/* Load Default Button */}
                            <Box sx={{ mb: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={loadingDefault ? <CircularProgress size={16} /> : <RestartAlt />}
                                    onClick={handleLoadDefault}
                                    disabled={!formData.type || !formData.channel || loadingDefault}
                                >
                                    Load Default Template
                                </Button>
                            </Box>

                            {/* Template Name */}
                            <TextField
                                fullWidth
                                label="Template Name *"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                sx={{ mb: 2 }}
                            />

                            {/* Subject (for email only) */}
                            {formData.channel === 'email' && (
                                <TextField
                                    fullWidth
                                    label="Subject"
                                    value={formData.subject}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                    sx={{ mb: 2 }}
                                    helperText="Use {{variables}} for dynamic content"
                                />
                            )}

                            {formData.channel === 'email' ? (
                                <Box>
                                    <RichTextEditor
                                        value={formData.htmlContent}
                                        onChange={(value) => setFormData(prev => ({ ...prev, htmlContent: value }))}
                                        variant="full"
                                        label="Email Content (HTML)"
                                        placeholder="Design your email template here..."
                                        showSourceToggle={true}
                                        showFullscreen={true}
                                        minHeight={350}
                                        helperText="Use the toolbar to format your email. Click the code icon to edit raw HTML."
                                    />
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="Plain Text Fallback"
                                        value={formData.textContent}
                                        onChange={(e) => setFormData(prev => ({ ...prev, textContent: e.target.value }))}
                                        sx={{ mt: 2 }}
                                        helperText="Used when HTML cannot be rendered (e.g., plain text email clients)"
                                    />
                                </Box>
                            ) : (
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    label="Message Content *"
                                    value={formData.textContent}
                                    onChange={(e) => setFormData(prev => ({ ...prev, textContent: e.target.value }))}
                                    helperText={`${formData.textContent.length} characters${formData.channel === 'sms' ? ' (SMS limit: 160)' : ''}`}
                                />
                            )}

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                    />
                                }
                                label="Template Active"
                                sx={{ mt: 2 }}
                            />
                        </Grid>

                        {/* Right: Variables Reference */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper variant="outlined" sx={{ p: 2, position: 'sticky', top: 0 }}>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                    <Info color="info" fontSize="small" />
                                    <Typography variant="subtitle2">Dynamic Variables</Typography>
                                </Stack>
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                    Click a variable to copy it. Use with double curly braces in your template.
                                </Typography>

                                {Object.entries(VARIABLE_CATEGORIES).map(([key, category]) => (
                                    <Box key={key} sx={{ mb: 2 }}>
                                        <Typography variant="caption" color="textSecondary" fontWeight="bold">
                                            {category.label}
                                        </Typography>
                                        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                                            {category.variables.map(variable => (
                                                <Chip
                                                    key={variable}
                                                    label={`{{${variable}}}`}
                                                    size="small"
                                                    variant="outlined"
                                                    clickable
                                                    icon={<ContentCopy sx={{ fontSize: 12 }} />}
                                                    sx={{ fontFamily: 'monospace', fontSize: 11 }}
                                                    onClick={() => insertVariable(variable)}
                                                />
                                            ))}
                                        </Stack>
                                    </Box>
                                ))}
                            </Paper>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={20} /> : undefined}
                    >
                        {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Preview: {previewTemplate?.name}
                    <IconButton onClick={() => setPreviewOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {previewTemplate && (
                        <Box>
                            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                <Chip
                                    icon={getChannelIcon(previewTemplate.channel) || undefined}
                                    label={previewTemplate.channel.toUpperCase()}
                                    size="small"
                                    color={getChannelColor(previewTemplate.channel)}
                                />
                                <Chip label={formatType(previewTemplate.type)} size="small" variant="outlined" />
                                <Chip
                                    label={previewTemplate.isActive ? 'Active' : 'Inactive'}
                                    size="small"
                                    color={previewTemplate.isActive ? 'success' : 'default'}
                                />
                            </Stack>

                            {previewTemplate.storeNames && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="textSecondary">Stores</Typography>
                                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                                        {previewTemplate.storeNames.map((name, idx) => (
                                            <Chip key={idx} label={name} size="small" variant="outlined" />
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {previewTemplate.channel === 'email' && previewTemplate.subject && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="textSecondary">Subject</Typography>
                                    <Typography variant="body1">{previewTemplate.subject}</Typography>
                                </Box>
                            )}

                            {previewTemplate.channel === 'email' && previewTemplate.htmlContent ? (
                                <Box
                                    sx={{
                                        border: '1px solid #e5e7eb',
                                        borderRadius: 1,
                                        overflow: 'auto',
                                        maxHeight: 500,
                                    }}
                                    dangerouslySetInnerHTML={{ __html: previewTemplate.htmlContent }}
                                />
                            ) : (
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                        {previewTemplate.textContent}
                                    </Typography>
                                </Paper>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setPreviewOpen(false);
                            previewTemplate && handleOpenEdit(previewTemplate);
                        }}
                    >
                        Edit Template
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Delete Template?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete &quot;{templateToDelete?.name}&quot;?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDelete}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
