'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Chip, Card, CardContent,
    IconButton, Drawer, Alert, CircularProgress,
    FormControl, InputLabel, Select, MenuItem, Divider, LinearProgress,
    Tooltip, Grid, Checkbox, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
    DataGrid, GridColDef, GridRenderCellParams, GridPaginationModel, GridRowSelectionModel
} from '@mui/x-data-grid';
import {
    CheckCircleOutline, ErrorOutline, WarningAmber, InfoOutlined,
    CloudUpload, Refresh, Search, Close, DeleteOutline,
    HealthAndSafety, ShoppingBag, TrendingUp, Edit, FilterList
} from '@mui/icons-material';
import GoogleTaxonomyAutocomplete from '@/components/molecules/GoogleTaxonomyAutocomplete';
import CategoryAutocomplete from '@/components/molecules/CategoryAutocomplete';
import api from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';
import { useTheme } from '@mui/material/styles';

// ─── Types ────────────────────────────────────────────────────────
interface GMCProduct {
    _id: string;
    name: string;
    sku: string;
    price: number;
    salePrice?: number;
    isOnSale: boolean;
    featuredImage?: string;
    images?: string[];
    stockStatus: string;
    isActive: boolean;
    brand?: { name: string } | string; // Handle both populated and string ID
    googleMerchant?: {
        status: string;
        lastSubmittedAt?: string;
        googleProductId?: string;
        issues?: Array<{ severity: string; title: string; description: string }>;
        gtin?: string;
        mpn?: string;
        googleProductCategory?: string;
        condition?: string;
        ageGroup?: string;
        gender?: string;
        color?: string;
        size?: string;
        material?: string;
        pattern?: string;
        brand?: string;
        customLabel0?: string;
        customLabel1?: string;
        customLabel2?: string;
        customLabel3?: string;
        customLabel4?: string;
        identifierExists?: boolean;
    };
    readinessScore: number;
    readinessIssueCount: number;
    isReady: boolean;
}

interface Diagnostics {
    total: number;
    statuses: Record<string, number>;
    topIssues: Array<{ severity: string; title: string; count: number }>;
}

// ─── Helpers ──────────────────────────────────────────────────────
const statusConfig: Record<string, { color: 'default' | 'success' | 'error' | 'warning' | 'info'; icon: React.ReactNode; label: string }> = {
    not_submitted: { color: 'default', icon: <InfoOutlined fontSize="small" />, label: 'Not Submitted' },
    pending: { color: 'info', icon: <CircularProgress size={14} />, label: 'Pending' },
    approved: { color: 'success', icon: <CheckCircleOutline fontSize="small" />, label: 'Approved' },
    disapproved: { color: 'error', icon: <ErrorOutline fontSize="small" />, label: 'Disapproved' },
    warning: { color: 'warning', icon: <WarningAmber fontSize="small" />, label: 'Warning' },
};

function StatusChip({ status }: { status: string }) {
    const config = statusConfig[status] || statusConfig.not_submitted;
    return <Chip icon={config.icon as React.ReactElement} label={config.label} color={config.color} size="small" variant="outlined" />;
}

function ReadinessBar({ score, issues }: { score: number, issues?: Array<{ severity: string; title: string; description: string }> }) {
    const color = score >= 80 ? 'success' : score >= 50 ? 'warning' : 'error';

    // Create tooltip content from issues
    const tooltipContent = issues && issues.length > 0 ? (
        <Box sx={{ p: 1, maxWidth: 300 }}>
            <Typography variant="caption" fontWeight={600} display="block" mb={1}>Readiness Issues:</Typography>
            {issues.slice(0, 5).map((issue, idx) => (
                <Box key={idx} display="flex" gap={1} mb={0.5} alignItems="start">
                    {issue.severity === 'error' ? <ErrorOutline color="error" sx={{ fontSize: 14, mt: 0.3 }} /> :
                        issue.severity === 'warning' ? <WarningAmber color="warning" sx={{ fontSize: 14, mt: 0.3 }} /> :
                            <InfoOutlined color="info" sx={{ fontSize: 14, mt: 0.3 }} />}
                    <Box>
                        <Typography variant="caption" fontWeight={600} display="block">{issue.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{issue.description}</Typography>
                    </Box>
                </Box>
            ))}
            {issues.length > 5 && <Typography variant="caption" color="text.secondary">+{issues.length - 5} more...</Typography>}
        </Box>
    ) : 'Ready to submit';

    return (
        <Tooltip title={tooltipContent} arrow placement="left">
            <Box display="flex" alignItems="center" gap={1} width="100%" sx={{ cursor: 'help' }}>
                <LinearProgress variant="determinate" value={score} color={color} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                <Typography variant="caption" fontWeight={600}>{score}%</Typography>
            </Box>
        </Tooltip>
    );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function GoogleMerchantPage() {
    // Contexts & Hooks
    const { formatPrice } = useCurrency();
    const { showNotification } = useNotification();
    const theme = useTheme();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // State
    const [storeId, setStoreId] = useState<string>('');
    const [stores, setStores] = useState<Array<{ _id: string; name: string }>>([]);
    const [products, setProducts] = useState<GMCProduct[]>([]);
    const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<Set<string>>(new Set());

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 25,
    });
    const [totalProducts, setTotalProducts] = useState(0);
    const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set<string>() });

    const getSelectedIds = (): string[] => {
        // @ts-ignore - Handling custom selection model structure
        if (rowSelectionModel.type === 'include') return Array.from(rowSelectionModel.ids) as string[];
        // @ts-ignore
        return products.map(p => p._id).filter(id => !rowSelectionModel.ids.has(id));
    };

    // Drawers & Modals
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<GMCProduct | null>(null);
    const [supplementalData, setSupplementalData] = useState<Record<string, any>>({});
    const [savingSupplemental, setSavingSupplemental] = useState(false);
    const [batchSubmitting, setBatchSubmitting] = useState(false);
    const [bulkEditOpen, setBulkEditOpen] = useState(false);
    const [bulkEditData, setBulkEditData] = useState<Record<string, any>>({});
    const [savingBulkEdit, setSavingBulkEdit] = useState(false);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch stores on mount
    useEffect(() => {
        const fetchStores = async () => {
            try {
                const res = await api.get('/stores');
                const storeList = res.data.stores || res.data || [];
                setStores(storeList);

                // Select first store with GMC enabled
                const gmcStore = storeList.find((s: any) => s.googleMerchantSettings?.enabled);
                setStoreId(gmcStore?._id || storeList[0]?._id || '');
            } catch {
                showNotification('Failed to load stores', 'error');
            }
        };
        fetchStores();
    }, [showNotification]);

    // Fetch products & diagnostics
    const fetchData = useCallback(async () => {
        if (!storeId) return;
        setLoading(true);
        try {
            const [prodRes, diagRes] = await Promise.all([
                api.get(`/google-merchant/${storeId}/products`, {
                    params: {
                        page: paginationModel.page + 1,
                        limit: paginationModel.pageSize,
                        status: statusFilter,
                        categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
                        search: debouncedSearch || undefined,
                    },
                }),
                api.get(`/google-merchant/${storeId}/diagnostics`),
            ]);
            setProducts(prodRes.data.products);
            setTotalProducts(prodRes.data.total);
            setDiagnostics(diagRes.data.diagnostics);
        } catch {
            showNotification('Failed to load Google Merchant data', 'error');
        } finally {
            setLoading(false);
        }
    }, [storeId, paginationModel, statusFilter, categoryFilter, debouncedSearch, showNotification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Submit single product
    const handleSubmitProduct = async (productId: string) => {
        setSubmitting(prev => new Set(prev).add(productId));
        try {
            await api.post(`/google-merchant/${storeId}/products/${productId}/submit`);
            showNotification('Product submitted successfully', 'success');
            fetchData();
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to submit product', 'error');
        } finally {
            setSubmitting(prev => {
                const next = new Set(prev);
                next.delete(productId);
                return next;
            });
        }
    };

    // Batch submit
    const handleBatchSubmit = async () => {
        const selectedIds = getSelectedIds();
        if (selectedIds.length === 0) return;
        setBatchSubmitting(true);
        try {
            const res = await api.post(`/google-merchant/${storeId}/products/batch-submit`, {
                productIds: selectedIds,
            });
            showNotification(res.data.message, 'success');
            setRowSelectionModel({ type: 'include', ids: new Set<string>() });
            fetchData();
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Batch submit failed', 'error');
        } finally {
            setBatchSubmitting(false);
        }
    };

    // Remove product from GMC
    const handleRemoveProduct = async (productId: string) => {
        try {
            await api.delete(`/google-merchant/${storeId}/products/${productId}`);
            showNotification('Product removed from Google Merchant', 'success');
            fetchData();
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to remove product', 'error');
        }
    };

    // Open supplemental editor
    const openSupplementalEditor = (product: GMCProduct) => {
        setEditingProduct(product);
        setSupplementalData({
            gtin: product.googleMerchant?.gtin || '',
            mpn: product.googleMerchant?.mpn || '',
            googleProductCategory: product.googleMerchant?.googleProductCategory || '',
            condition: product.googleMerchant?.condition || 'new',
            ageGroup: product.googleMerchant?.ageGroup || '',
            gender: product.googleMerchant?.gender || '',
            color: product.googleMerchant?.color || '',
            size: product.googleMerchant?.size || '',
            material: product.googleMerchant?.material || '',
            pattern: product.googleMerchant?.pattern || '',
            brand: product.googleMerchant?.brand || '',
            customLabel0: product.googleMerchant?.customLabel0 || '',
            customLabel1: product.googleMerchant?.customLabel1 || '',
            customLabel2: product.googleMerchant?.customLabel2 || '',
            customLabel3: product.googleMerchant?.customLabel3 || '',
            customLabel4: product.googleMerchant?.customLabel4 || '',
            identifierExists: product.googleMerchant?.identifierExists !== false,
        });
        setDrawerOpen(true);
    };

    // Save supplemental data
    const handleSaveSupplemental = async () => {
        if (!editingProduct) return;
        setSavingSupplemental(true);
        try {
            await api.put(`/google-merchant/${storeId}/products/${editingProduct._id}/supplemental`, supplementalData);
            showNotification('Supplemental data saved', 'success');
            setDrawerOpen(false);
            fetchData();
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to save', 'error');
        } finally {
            setSavingSupplemental(false);
        }
    };

    // Bulk Edit Handlers
    const openBulkEditor = () => {
        setBulkEditData({
            condition: '',
            ageGroup: '',
            gender: '',
            googleProductCategory: '',
        });
        setBulkEditOpen(true);
    };

    const handleBulkEditSave = async () => {
        const selectedIds = getSelectedIds();
        if (selectedIds.length === 0) return;
        setSavingBulkEdit(true);
        try {
            // Check which fields are actually set
            const dataToUpdate: Record<string, any> = {};
            if (bulkEditData.condition) dataToUpdate.condition = bulkEditData.condition;
            if (bulkEditData.ageGroup) dataToUpdate.ageGroup = bulkEditData.ageGroup;
            if (bulkEditData.gender) dataToUpdate.gender = bulkEditData.gender;
            if (bulkEditData.googleProductCategory) dataToUpdate.googleProductCategory = bulkEditData.googleProductCategory;

            if (Object.keys(dataToUpdate).length === 0) {
                showNotification('No fields selected to update', 'info');
                setSavingBulkEdit(false);
                return;
            }

            await api.put(`/google-merchant/${storeId}/products/batch-supplemental`, {
                productIds: selectedIds,
                data: dataToUpdate
            });

            showNotification(`Updated ${selectedIds.length} products successfully`, 'success');
            setBulkEditOpen(false);
            setRowSelectionModel({ type: 'include', ids: new Set<string>() });
            fetchData();
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to bulk update', 'error');
        } finally {
            setSavingBulkEdit(false);
        }
    };

    // DataGrid Columns
    const columns: GridColDef[] = [
        {
            field: 'image',
            headerName: '',
            width: 80,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Box
                        component="img"
                        src={params.row.featuredImage || params.row.images?.[0] || '/placeholder.png'}
                        alt={params.row.name}
                        sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
                    />
                </Box >
            ),
        },
        {
            field: 'name',
            headerName: 'Product',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={500} noWrap>
                        {params.row.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        SKU: {params.row.sku}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'price',
            headerName: 'Price',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2">
                        {params.row.isOnSale && params.row.salePrice ? (
                            <>
                                <span style={{ textDecoration: 'line-through', marginRight: 4, opacity: 0.6 }}>
                                    {formatPrice(params.row.price)}
                                </span>
                                <span style={{ color: '#ef4444', fontWeight: 600 }}>
                                    {formatPrice(params.row.salePrice)}
                                </span>
                            </>
                        ) : formatPrice(params.row.price)}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'status',
            headerName: 'GMC Status',
            width: 150,
            valueGetter: (value: any, row: GMCProduct) => row?.googleMerchant?.status || 'not_submitted',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <StatusChip status={params.value as string} />
                </Box>
            ),
        },
        {
            field: 'readiness',
            headerName: 'Readiness',
            flex: 0.8,
            minWidth: 150,
            valueGetter: (value: any, row: GMCProduct) => row?.readinessScore || 0,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <ReadinessBar score={params.row.readinessScore} issues={params.row.googleMerchant?.issues} />
                </Box>
            ),
        },
        {
            field: 'issues',
            headerName: 'Issues',
            width: 100,
            valueGetter: (value: any, row: GMCProduct) => row?.readinessIssueCount || 0,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    {params.row.readinessIssueCount > 0 && (
                        <Chip
                            label={params.row.readinessIssueCount}
                            size="small"
                            color={params.row.isReady ? 'warning' : 'error'}
                            variant="outlined"
                        />
                    )}
                </Box>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 140,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" gap={0.5} alignItems="center" height="100%">
                    <Tooltip title="Edit GMC Data">
                        <IconButton size="small" onClick={() => openSupplementalEditor(params.row)}>
                            <Edit fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Submit to Google">
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleSubmitProduct(params.row._id)}
                            disabled={submitting.has(params.row._id)}
                        >
                            {submitting.has(params.row._id) ? <CircularProgress size={16} /> : <CloudUpload fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                    {params.row.googleMerchant?.status && params.row.googleMerchant.status !== 'not_submitted' && (
                        <Tooltip title="Remove from GMC">
                            <IconButton size="small" color="error" onClick={() => handleRemoveProduct(params.row._id)}>
                                <DeleteOutline fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            ),
        },
    ];

    return (
        <Box>
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <ShoppingBag sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Box>
                        <Typography variant="h5" fontWeight={700}>Google Merchant Center</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage your product feed for Google Shopping
                        </Typography>
                    </Box>
                </Box>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Store</InputLabel>
                    <Select
                        value={storeId}
                        label="Store"
                        onChange={(e) => { setStoreId(e.target.value); setPaginationModel(prev => ({ ...prev, page: 0 })); }}
                    >
                        {stores.map(s => (
                            <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Overview Cards */}
            {diagnostics && (
                <Grid container spacing={2} mb={3}>
                    {[
                        { label: 'Total Products', value: diagnostics.total, color: '#6366f1', icon: <ShoppingBag /> },
                        { label: 'Approved', value: diagnostics.statuses.approved || 0, color: '#22c55e', icon: <CheckCircleOutline /> },
                        { label: 'Pending', value: diagnostics.statuses.pending || 0, color: '#3b82f6', icon: <TrendingUp /> },
                        { label: 'Disapproved', value: diagnostics.statuses.disapproved || 0, color: '#ef4444', icon: <ErrorOutline /> },
                        { label: 'Warnings', value: diagnostics.statuses.warning || 0, color: '#f59e0b', icon: <WarningAmber /> },
                        { label: 'Not Submitted', value: diagnostics.statuses.not_submitted || 0, color: '#94a3b8', icon: <InfoOutlined /> },
                    ].map((card) => (
                        <Grid size={{ xs: 6, sm: 4, md: 2 }} key={card.label}>
                            <Card sx={{ textAlign: 'center', borderTop: `3px solid ${card.color}` }}>
                                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ color: card.color, mb: 0.5 }}>{card.icon}</Box>
                                    <Typography variant="h5" fontWeight={700}>{card.value}</Typography>
                                    <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Top Issues */}
            {diagnostics && diagnostics.topIssues.length > 0 && (
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} mb={1}>
                        <HealthAndSafety sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Top Feed Issues
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                        {diagnostics.topIssues.slice(0, 8).map((issue, i) => (
                            <Chip
                                key={i}
                                label={`${issue.title} (${issue.count})`}
                                color={issue.severity === 'error' ? 'error' : issue.severity === 'warning' ? 'warning' : 'default'}
                                variant="outlined"
                                size="small"
                            />
                        ))}
                    </Box>
                </Paper>
            )}

            {/* Filters & Bulk Actions */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
                    <TextField
                        size="small"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
                        sx={{ minWidth: 250 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => { setStatusFilter(e.target.value); setPaginationModel(prev => ({ ...prev, page: 0 })); }}
                        >
                            <MenuItem value="all">All Statuses</MenuItem>
                            <MenuItem value="approved">Approved</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="disapproved">Disapproved</MenuItem>
                            <MenuItem value="not_submitted">Not Submitted</MenuItem>
                        </Select>
                    </FormControl>

                    <Box sx={{ minWidth: 200 }}>
                        <CategoryAutocomplete
                            storeId={storeId}
                            value={categoryFilter === 'all' ? null : categoryFilter}
                            onChange={(val) => {
                                setCategoryFilter(val || 'all');
                                setPaginationModel(prev => ({ ...prev, page: 0 }));
                            }}
                            label="Filter Category"
                            minimal
                        />
                    </Box>

                    <Box sx={{ flexGrow: 1 }} />

                    {getSelectedIds().length > 0 && (
                        <Box display="flex" gap={1}>
                            <Button
                                variant="outlined"
                                startIcon={<Edit />}
                                onClick={openBulkEditor}
                            >
                                Bulk Edit ({getSelectedIds().length})
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<CloudUpload />}
                                onClick={handleBatchSubmit}
                                disabled={batchSubmitting}
                            >
                                {batchSubmitting ? 'Submitting...' : `Submit ${getSelectedIds().length} Selected`}
                            </Button>
                        </Box>
                    )}
                    <IconButton onClick={fetchData} title="Refresh">
                        <Refresh />
                    </IconButton>
                </Box>
            </Paper>

            {/* MUI DataGrid */}
            <Box sx={{ width: '100%', position: 'relative' }}>
                <DataGrid
                    rows={products}
                    columns={columns}
                    rowCount={totalProducts}
                    loading={loading}
                    pageSizeOptions={[10, 25, 50, 100]}
                    paginationModel={paginationModel}
                    paginationMode="server"
                    onPaginationModelChange={setPaginationModel}
                    checkboxSelection
                    disableRowSelectionOnClick
                    rowSelectionModel={rowSelectionModel}
                    onRowSelectionModelChange={(newSelection) => setRowSelectionModel(newSelection as any)}
                    getRowId={(row) => row._id}
                    sx={dataGridStyles}
                    rowHeight={80}
                    keepNonExistentRowsSelected
                />
            </Box>

            {/* Supplemental Data Drawer */}
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ width: { xs: '100vw', sm: 480 }, p: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                        <Typography variant="h6">Edit GMC Data</Typography>
                        <IconButton onClick={() => setDrawerOpen(false)}><Close /></IconButton>
                    </Box>
                    {editingProduct && (
                        <Box display="flex" alignItems="center" gap={2} mb={3}>
                            {(editingProduct.featuredImage || editingProduct.images?.[0]) && (
                                <Box
                                    component="img"
                                    src={editingProduct.featuredImage || editingProduct.images?.[0]}
                                    alt={editingProduct.name}
                                    sx={{ width: 56, height: 56, borderRadius: 1, objectFit: 'cover' }}
                                />
                            )}
                            <Box>
                                <Typography fontWeight={600}>{editingProduct.name}</Typography>
                                <Typography variant="body2" color="text.secondary">SKU: {editingProduct.sku}</Typography>
                            </Box>
                        </Box>
                    )}

                    <Divider sx={{ mb: 3 }} />

                    <Typography variant="subtitle2" color="text.secondary" mb={2}>Identifiers</Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                            <TextField fullWidth size="small" label="GTIN (UPC/EAN)" value={supplementalData.gtin} onChange={(e) => setSupplementalData(d => ({ ...d, gtin: e.target.value }))} />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField fullWidth size="small" label="MPN" value={supplementalData.mpn} onChange={(e) => setSupplementalData(d => ({ ...d, mpn: e.target.value }))} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <GoogleTaxonomyAutocomplete
                                value={supplementalData.googleProductCategory}
                                onChange={(val) => setSupplementalData(d => ({ ...d, googleProductCategory: val }))}
                                helperText="e.g., Apparel & Accessories > Clothing > Shirts"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField fullWidth size="small" label="Brand (Override)" value={supplementalData.brand} onChange={(e) => setSupplementalData(d => ({ ...d, brand: e.target.value }))} helperText="Overrides the product brand for GMC" />
                        </Grid>
                    </Grid>

                    <Typography variant="subtitle2" color="text.secondary" mt={3} mb={2}>Product Attributes</Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Condition</InputLabel>
                                <Select value={supplementalData.condition} label="Condition" onChange={(e) => setSupplementalData(d => ({ ...d, condition: e.target.value }))}>
                                    <MenuItem value="new">New</MenuItem>
                                    <MenuItem value="refurbished">Refurbished</MenuItem>
                                    <MenuItem value="used">Used</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Age Group</InputLabel>
                                <Select value={supplementalData.ageGroup} label="Age Group" onChange={(e) => setSupplementalData(d => ({ ...d, ageGroup: e.target.value }))}>
                                    <MenuItem value="">None</MenuItem>
                                    <MenuItem value="newborn">Newborn</MenuItem>
                                    <MenuItem value="infant">Infant</MenuItem>
                                    <MenuItem value="toddler">Toddler</MenuItem>
                                    <MenuItem value="kids">Kids</MenuItem>
                                    <MenuItem value="adult">Adult</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Gender</InputLabel>
                                <Select value={supplementalData.gender} label="Gender" onChange={(e) => setSupplementalData(d => ({ ...d, gender: e.target.value }))}>
                                    <MenuItem value="">None</MenuItem>
                                    <MenuItem value="male">Male</MenuItem>
                                    <MenuItem value="female">Female</MenuItem>
                                    <MenuItem value="unisex">Unisex</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField fullWidth size="small" label="Color" value={supplementalData.color} onChange={(e) => setSupplementalData(d => ({ ...d, color: e.target.value }))} />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField fullWidth size="small" label="Size" value={supplementalData.size} onChange={(e) => setSupplementalData(d => ({ ...d, size: e.target.value }))} />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField fullWidth size="small" label="Material" value={supplementalData.material} onChange={(e) => setSupplementalData(d => ({ ...d, material: e.target.value }))} />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField fullWidth size="small" label="Pattern" value={supplementalData.pattern} onChange={(e) => setSupplementalData(d => ({ ...d, pattern: e.target.value }))} />
                        </Grid>
                    </Grid>

                    <Typography variant="subtitle2" color="text.secondary" mt={3} mb={2}>Custom Labels (Shopping Campaigns)</Typography>
                    <Grid container spacing={2}>
                        {[0, 1, 2, 3, 4].map(i => (
                            <Grid size={{ xs: 6 }} key={i}>
                                <TextField fullWidth size="small" label={`Custom Label ${i}`} value={supplementalData[`customLabel${i}`] || ''} onChange={(e) => setSupplementalData(d => ({ ...d, [`customLabel${i}`]: e.target.value }))} />
                            </Grid>
                        ))}
                    </Grid>

                    <Box mt={4} display="flex" gap={2}>
                        <Button variant="contained" fullWidth onClick={handleSaveSupplemental} disabled={savingSupplemental}>
                            {savingSupplemental ? 'Saving...' : 'Save'}
                        </Button>
                        <Button variant="outlined" fullWidth onClick={() => setDrawerOpen(false)}>
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Drawer>

            {/* Bulk Edit Modal */}
            <Dialog open={bulkEditOpen} onClose={() => setBulkEditOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Bulk Edit Attributes</DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Updating {getSelectedIds().length} products. Only filled fields will be updated.
                    </Alert>

                    <Grid container spacing={2} pt={1}>
                        <Grid size={{ xs: 12 }}>
                            <GoogleTaxonomyAutocomplete
                                value={bulkEditData.googleProductCategory}
                                onChange={(val) => setBulkEditData(d => ({ ...d, googleProductCategory: val }))}
                                helperText="e.g., Apparel & Accessories > Clothing > Shirts"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Condition</InputLabel>
                                <Select value={bulkEditData.condition} label="Condition" onChange={(e) => setBulkEditData(d => ({ ...d, condition: e.target.value }))}>
                                    <MenuItem value="">Don't Change</MenuItem>
                                    <MenuItem value="new">New</MenuItem>
                                    <MenuItem value="refurbished">Refurbished</MenuItem>
                                    <MenuItem value="used">Used</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Age Group</InputLabel>
                                <Select value={bulkEditData.ageGroup} label="Age Group" onChange={(e) => setBulkEditData(d => ({ ...d, ageGroup: e.target.value }))}>
                                    <MenuItem value="">Don't Change</MenuItem>
                                    <MenuItem value="newborn">Newborn</MenuItem>
                                    <MenuItem value="infant">Infant</MenuItem>
                                    <MenuItem value="toddler">Toddler</MenuItem>
                                    <MenuItem value="kids">Kids</MenuItem>
                                    <MenuItem value="adult">Adult</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Gender</InputLabel>
                                <Select value={bulkEditData.gender} label="Gender" onChange={(e) => setBulkEditData(d => ({ ...d, gender: e.target.value }))}>
                                    <MenuItem value="">Don't Change</MenuItem>
                                    <MenuItem value="male">Male</MenuItem>
                                    <MenuItem value="female">Female</MenuItem>
                                    <MenuItem value="unisex">Unisex</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBulkEditOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleBulkEditSave} disabled={savingBulkEdit}>
                        {savingBulkEdit ? 'Updating...' : 'Update Products'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
