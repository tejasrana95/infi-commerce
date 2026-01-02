'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Chip,
    IconButton,
    Tooltip,
    Alert,
    CircularProgress,
    Paper,
    Checkbox,
    FormGroup,
    FormLabel,
    Grid,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
    Add,
    Edit,
    Delete,
    ContentCopy,
    Refresh,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import PageHeader from '@/components/molecules/PageHeader';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';

interface ApiKey {
    _id: string;
    name: string;
    keyPrefix: string;
    channel: 'web' | 'mobile' | 'third_party' | 'internal';
    allowedIps: string[];
    validFrom: string;
    validUntil?: string;
    rateLimit?: number;
    permissions: string[];
    storeScope: 'all' | 'single';
    storeId?: { _id: string; name: string };
    isActive: boolean;
    trackUsage?: boolean;
    lastUsedAt?: string;
    usageCount: number;
    createdBy?: { name: string; email: string };
    createdAt: string;
}

interface FormData {
    name: string;
    channel: 'web' | 'mobile' | 'third_party' | 'internal';
    allowedIps: string;
    validFrom: string;
    validUntil: string;
    rateLimit: string;
    permissions: string[];
    storeScope: 'all' | 'single';
    storeId: string;
    isActive: boolean;
    trackUsage: boolean;
}

const defaultFormData: FormData = {
    name: '',
    channel: 'third_party',
    allowedIps: '0.0.0.0',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    rateLimit: '',
    permissions: ['GET'],
    storeScope: 'all',
    storeId: '',
    isActive: true,
    trackUsage: true,
};

const CHANNELS = [
    { value: 'web', label: 'Web' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'third_party', label: '3rd Party' },
    { value: 'internal', label: 'Internal' },
];

const PERMISSIONS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

export default function ApiKeysPage() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
    const [formData, setFormData] = useState<FormData>(defaultFormData);
    const [submitting, setSubmitting] = useState(false);
    const [newKeyDialog, setNewKeyDialog] = useState<{ open: boolean; key: string }>({ open: false, key: '' });
    const [stores, setStores] = useState<{ _id: string; name: string }[]>([]);
    const { showNotification } = useNotification();

    const fetchApiKeys = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/api-keys');
            setApiKeys(response.data.apiKeys || []);
        } catch (error: any) {
            showNotification(error.response?.data?.message || error.message || 'Failed to load API keys', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    const fetchStores = useCallback(async () => {
        try {
            const response = await api.get('/stores');
            setStores(response.data.stores || []);
        } catch (error) {
            // Silently fail - stores are optional
        }
    }, []);

    useEffect(() => {
        fetchApiKeys();
        fetchStores();
    }, [fetchApiKeys, fetchStores]);

    const handleOpenDialog = (key?: ApiKey) => {
        if (key) {
            setEditingKey(key);
            setFormData({
                name: key.name,
                channel: key.channel,
                allowedIps: key.allowedIps.join(', '),
                validFrom: key.validFrom ? key.validFrom.split('T')[0] : '',
                validUntil: key.validUntil ? key.validUntil.split('T')[0] : '',
                rateLimit: key.rateLimit?.toString() || '',
                permissions: key.permissions,
                storeScope: key.storeScope,
                storeId: key.storeId?._id || '',
                isActive: key.isActive,
                trackUsage: key.trackUsage !== false,
            });
        } else {
            setEditingKey(null);
            setFormData(defaultFormData);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingKey(null);
        setFormData(defaultFormData);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            showNotification('Name is required', 'error');
            return;
        }
        if (formData.permissions.length === 0) {
            showNotification('At least one permission is required', 'error');
            return;
        }
        if (formData.storeScope === 'single' && !formData.storeId) {
            showNotification('Store is required when scope is Single Store', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: formData.name.trim(),
                channel: formData.channel,
                allowedIps: formData.allowedIps.split(',').map(ip => ip.trim()).filter(Boolean),
                validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : undefined,
                validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined,
                rateLimit: formData.rateLimit ? parseInt(formData.rateLimit) : undefined,
                permissions: formData.permissions,
                storeScope: formData.storeScope,
                storeId: formData.storeScope === 'single' ? formData.storeId : undefined,
                isActive: formData.isActive,
                trackUsage: formData.trackUsage,
            };

            if (editingKey) {
                await api.put(`/api-keys/${editingKey._id}`, payload);
                showNotification('API key updated successfully', 'success');
            } else {
                const response = await api.post('/api-keys', payload);
                // Show the new key in a dialog
                setNewKeyDialog({ open: true, key: response.data.apiKey.key });
                showNotification('API key created successfully', 'success');
            }

            handleCloseDialog();
            fetchApiKeys();
        } catch (error: any) {
            showNotification(error.response?.data?.message || error.message || 'Failed to save API key', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
            return;
        }
        try {
            await api.delete(`/api-keys/${id}`);
            showNotification('API key deleted successfully', 'success');
            fetchApiKeys();
        } catch (error: any) {
            showNotification(error.response?.data?.message || error.message || 'Failed to delete API key', 'error');
        }
    };

    const handleRegenerate = async (id: string) => {
        if (!confirm('Are you sure you want to regenerate this API key? The old key will stop working immediately.')) {
            return;
        }
        try {
            const response = await api.post(`/api-keys/${id}/regenerate`);
            setNewKeyDialog({ open: true, key: response.data.apiKey.key });
            showNotification('API key regenerated successfully', 'success');
            fetchApiKeys();
        } catch (error: any) {
            showNotification(error.response?.data?.message || error.message || 'Failed to regenerate API key', 'error');
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await api.patch(`/api-keys/${id}/toggle`);
            fetchApiKeys();
        } catch (error: any) {
            showNotification(error.response?.data?.message || error.message || 'Failed to toggle API key', 'error');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showNotification('Copied to clipboard', 'success');
    };

    const handlePermissionChange = (permission: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter(p => p !== permission)
                : [...prev.permissions, permission],
        }));
    };

    const columns: GridColDef[] = [
        {
            field: 'name', headerName: 'Name', flex: 1, minWidth: 150, renderCell: (params) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="caption" color="textSecondary">
                        {params.value}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'channel',
            headerName: 'Channel',
            width: 100,
            renderCell: (params) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Chip label={params.value} size="small" variant="outlined" />
                </Box>
            ),
        },
        {
            field: 'permissions',
            headerName: 'Permissions',
            width: 180,
            renderCell: (params) => (
                <Box display="flex" flexWrap="wrap" flexDirection="row" gap={0.5} alignItems="center" justifyContent="start" height="100%">
                    {params.value?.map((p: string) => (
                        <Chip key={p} label={p} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                    ))}
                </Box>
            ),
        },
        {
            field: 'storeScope',
            headerName: 'Scope',
            width: 100,
            renderCell: (params) => (
                <Box display="flex" flexDirection="row" gap={0.5} alignItems="center" justifyContent="start" height="100%">
                    <Chip
                        label={params.value === 'all' ? 'All Stores' : 'Single'}
                        size="small"
                        color={params.value === 'all' ? 'primary' : 'default'}
                    />
                </Box>
            ),
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 100,
            renderCell: (params) => (
                <Box display="flex" flexDirection="row" gap={0.5} alignItems="center" justifyContent="start" height="100%">
                    <Chip
                        label={params.value ? 'Active' : 'Inactive'}
                        size="small"
                        color={params.value ? 'success' : 'default'}
                    />
                </Box>
            ),
        },
        { field: 'usageCount', headerName: 'Usage', width: 80, type: 'number' },
        {
            field: 'lastUsedAt',
            headerName: 'Last Used',
            width: 130,
            renderCell: (params) => params.value ? <Box display="flex" flexDirection="row" gap={0.5} alignItems="center" justifyContent="start" height="100%"><Typography variant="caption" color="textSecondary">{new Date(params.value).toLocaleDateString()}</Typography></Box> : <Box display="flex" flexDirection="row" gap={0.5} alignItems="center" justifyContent="start" height="100%"><Typography variant="caption" color="textSecondary">Never</Typography></Box>,
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 180,
            sortable: false,
            renderCell: (params) => (
                <Box display="flex" flexDirection="row" gap={0.5} alignItems="center" justifyContent="start" height="100%">
                    <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenDialog(params.row)}>
                            <Edit fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={params.row.isActive ? 'Deactivate' : 'Activate'}>
                        <IconButton size="small" onClick={() => handleToggle(params.row._id)}>
                            {params.row.isActive ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Regenerate Key">
                        <IconButton size="small" onClick={() => handleRegenerate(params.row._id)}>
                            <Refresh fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(params.row._id)}>
                            <Delete fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    return (
        <Box>
            <PageHeader
                title="API Keys"
                subtitle="Manage API keys for third-party integrations and external services"
                action={
                    <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
                        Create API Key
                    </Button>
                }
                backUrl="/settings"
            />

            <Paper sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={apiKeys}
                    columns={columns}
                    loading={loading}
                    getRowId={(row) => row._id}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    disableRowSelectionOnClick
                />
            </Paper>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingKey ? 'Edit API Key' : 'Create API Key'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            fullWidth
                            required
                        />

                        <FormControl fullWidth>
                            <InputLabel>Channel</InputLabel>
                            <Select
                                value={formData.channel}
                                label="Channel"
                                onChange={(e) => setFormData({ ...formData, channel: e.target.value as any })}
                            >
                                {CHANNELS.map(c => (
                                    <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Allowed IPs"
                            value={formData.allowedIps}
                            onChange={(e) => setFormData({ ...formData, allowedIps: e.target.value })}
                            fullWidth
                            helperText="Comma-separated. Use 0.0.0.0 to allow any IP"
                        />

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    label="Valid From"
                                    type="date"
                                    value={formData.validFrom}
                                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                    fullWidth
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    label="Valid Until (Optional)"
                                    type="date"
                                    value={formData.validUntil}
                                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                    fullWidth
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            label="Rate Limit (requests/min)"
                            value={formData.rateLimit}
                            onChange={(e) => setFormData({ ...formData, rateLimit: e.target.value })}
                            fullWidth
                            type="number"
                            helperText="Leave empty for unlimited"
                        />

                        <FormControl component="fieldset">
                            <FormLabel component="legend">Permissions</FormLabel>
                            <FormGroup row>
                                {PERMISSIONS.map(p => (
                                    <FormControlLabel
                                        key={p}
                                        control={
                                            <Checkbox
                                                checked={formData.permissions.includes(p)}
                                                onChange={() => handlePermissionChange(p)}
                                            />
                                        }
                                        label={p}
                                    />
                                ))}
                            </FormGroup>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Store Scope</InputLabel>
                            <Select
                                value={formData.storeScope}
                                label="Store Scope"
                                onChange={(e) => setFormData({ ...formData, storeScope: e.target.value as any })}
                            >
                                <MenuItem value="all">All Stores</MenuItem>
                                <MenuItem value="single">Single Store</MenuItem>
                            </Select>
                        </FormControl>

                        {formData.storeScope === 'single' && (
                            <FormControl fullWidth>
                                <InputLabel>Store</InputLabel>
                                <Select
                                    value={formData.storeId}
                                    label="Store"
                                    onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                                >
                                    {stores.map(s => (
                                        <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                            }
                            label="Active"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.trackUsage}
                                    onChange={(e) => setFormData({ ...formData, trackUsage: e.target.checked })}
                                />
                            }
                            label="Track Usage (last used, usage count)"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
                        {submitting ? <CircularProgress size={20} /> : (editingKey ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* New Key Display Dialog */}
            <Dialog open={newKeyDialog.open} onClose={() => setNewKeyDialog({ open: false, key: '' })} maxWidth="sm" fullWidth>
                <DialogTitle>Your API Key</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <strong>Important:</strong> This is the only time you will see this key. Copy it now and store it securely.
                    </Alert>
                    <Paper
                        sx={{
                            p: 2,
                            bgcolor: 'grey.100',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            wordBreak: 'break-all',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <Typography sx={{ flex: 1, fontFamily: 'monospace' }}>{newKeyDialog.key}</Typography>
                        <IconButton onClick={() => copyToClipboard(newKeyDialog.key)} size="small">
                            <ContentCopy fontSize="small" />
                        </IconButton>
                    </Paper>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNewKeyDialog({ open: false, key: '' })} variant="contained">
                        Done
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
