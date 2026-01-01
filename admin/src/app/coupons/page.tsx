'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip, Switch } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import api from '@/lib/api';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, PermissionGuard } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { createDataGridStyles } from '@/utils/styles';

interface Coupon {
    _id: string;
    code: string;
    storeId: { _id: string; name: string } | string;
    description?: string;
    discountType: 'flat' | 'percentage';
    discountValue: number;
    applyTo: 'store' | 'categories';
    categoryIds?: { _id: string; title: string }[];
    minCartValue?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    usageCount: number;
    perCustomerLimit?: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export default function CouponsPage() {
    const router = useRouter();
    const theme = useTheme();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const response = await api.get('/coupons');
            setCoupons(response.data.data || []);
        } catch (err) {
            console.error('Failed to fetch coupons');
            showNotification('Failed to load coupons', 'error');
            setCoupons([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({ title: 'Delete Coupon', message: 'Are you sure you want to delete this coupon?', severity: 'error' })) return;
        try {
            await api.delete(`/coupons/${id}`);
            setCoupons(coupons.filter(c => c._id !== id));
            showNotification('Coupon deleted successfully', 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to delete', 'error');
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await api.put(`/coupons/${id}`, { isActive: !currentStatus });
            setCoupons(coupons.map(c => c._id === id ? { ...c, isActive: !currentStatus } : c));
            showNotification(`Coupon ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to update status', 'error');
        }
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        showNotification(`Copied: ${code}`, 'success');
    };

    const handleEdit = (id: string) => {
        router.push(`/coupons/${id}/edit`);
    };

    const handleCreate = () => {
        router.push('/coupons/new');
    };

    const getCouponStatus = (coupon: Coupon): { label: string; color: 'success' | 'warning' | 'default' | 'error' } => {
        const now = new Date();
        const start = new Date(coupon.startDate);
        const end = new Date(coupon.endDate);

        if (!coupon.isActive) return { label: 'Inactive', color: 'default' };
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return { label: 'Exhausted', color: 'error' };
        if (now < start) return { label: 'Scheduled', color: 'warning' };
        if (now > end) return { label: 'Expired', color: 'error' };
        return { label: 'Active', color: 'success' };
    };

    const filteredRows = coupons.filter((coupon) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery ||
            coupon.code.toLowerCase().includes(query) ||
            coupon.description?.toLowerCase().includes(query);
        const couponStoreId = typeof coupon.storeId === 'object' ? coupon.storeId._id : coupon.storeId;
        const matchesStore = !filterStore || couponStoreId === filterStore;

        let matchesStatus = true;
        if (filterStatus) {
            const status = getCouponStatus(coupon);
            matchesStatus = status.label.toLowerCase() === filterStatus.toLowerCase();
        }

        return matchesSearch && matchesStore && matchesStatus;
    });

    const getStoreName = (storeId: any) => {
        if (typeof storeId === 'object' && storeId !== null) return storeId.name;
        return '-';
    };

    const formatDiscount = (coupon: Coupon) => {
        if (coupon.discountType === 'percentage') {
            return `${coupon.discountValue}%`;
        }
        return `$${coupon.discountValue}`;
    };

    const formatUsage = (coupon: Coupon) => {
        if (coupon.usageLimit) {
            return `${coupon.usageCount} / ${coupon.usageLimit}`;
        }
        return `${coupon.usageCount} / ∞`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const columns: GridColDef[] = [
        {
            field: 'code',
            headerName: 'Coupon Code',
            width: 180,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                        label={params.value}
                        size="small"
                        color="primary"
                        variant="filled"
                        sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                    />
                    <IconButton size="small" onClick={() => handleCopyCode(params.value)}>
                        <ContentCopyIcon fontSize="small" />
                    </IconButton>
                </Box>
            ),
        },
        {
            field: 'description',
            headerName: 'Description',
            flex: 1,
            minWidth: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2" noWrap>{params.value || '-'}</Typography>
            ),
        },
        {
            field: 'discountValue',
            headerName: 'Discount',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={formatDiscount(params.row)}
                    size="small"
                    color={params.row.discountType === 'percentage' ? 'secondary' : 'info'}
                    variant="outlined"
                />
            ),
        },
        {
            field: 'applyTo',
            headerName: 'Applies To',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2">
                    {params.value === 'store' ? 'Entire Store' : `${params.row.categoryIds?.length || 0} Categories`}
                </Typography>
            ),
        },
        {
            field: 'usage',
            headerName: 'Usage',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2">{formatUsage(params.row)}</Typography>
            ),
        },
        {
            field: 'dateRange',
            headerName: 'Valid Until',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2">{formatDate(params.row.endDate)}</Typography>
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 100,
            renderCell: (params: GridRenderCellParams) => {
                const status = getCouponStatus(params.row);
                return <Chip label={status.label} size="small" color={status.color} variant="outlined" />;
            },
        },
        {
            field: 'isActive',
            headerName: 'Enabled',
            width: 80,
            renderCell: (params: GridRenderCellParams) => (
                <Switch
                    checked={params.value}
                    size="small"
                    onChange={() => handleToggleActive(params.row._id, params.value)}
                />
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box>
                    <Tooltip title="Edit">
                        <IconButton onClick={() => handleEdit(params.row._id)} size="small" color="primary">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <PermissionGuard deniedRoles={['store_admin']}>
                        <Tooltip title="Delete">
                            <IconButton onClick={() => handleDelete(params.row._id)} size="small" color="error">
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </PermissionGuard>
                </Box>
            ),
        },
    ];

    if (loading) return <LoadingSpinner message="Loading coupons..." />;

    if (coupons.length === 0 && !searchQuery && !filterStore && !filterStatus) {
        return (
            <Box>
                <PageHeader title="Coupons" subtitle="Create and manage discount codes" />
                <EmptyState
                    message="No coupons found. Create your first coupon code!"
                    actionLabel="Create Coupon"
                    onAction={handleCreate}
                />
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Coupons"
                subtitle="Create and manage discount codes"
                actionLabel="Create Coupon"
                onAction={handleCreate}
            />

            <SearchFilterBar
                searchPlaceholder="Search coupons..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filters={[
                    {
                        id: 'status',
                        label: 'Status',
                        type: 'select',
                        options: [
                            { value: 'active', label: 'Active' },
                            { value: 'scheduled', label: 'Scheduled' },
                            { value: 'expired', label: 'Expired' },
                            { value: 'exhausted', label: 'Exhausted' },
                            { value: 'inactive', label: 'Inactive' },
                        ],
                    },
                ]}
                activeFilters={{ status: filterStatus }}
                onFilterChange={(filters) => setFilterStatus(filters.status as string || '')}
                showStoreFilter={user?.role !== 'store_admin'}
                storeFilterValue={filterStore}
                onStoreFilterChange={setFilterStore}
            />

            <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    getRowId={(row) => row._id}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                />
            </Box>
        </Box>
    );
}
