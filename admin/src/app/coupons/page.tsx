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
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    // Pagination state
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    const [totalRows, setTotalRows] = useState(0);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchCoupons();
    }, [paginationModel, debouncedSearch, filterStore, filterStatus]);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', String(paginationModel.page + 1));
            params.append('limit', String(paginationModel.pageSize));
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (filterStore) params.append('storeId', filterStore);
            if (filterStatus) params.append('isActive', filterStatus === 'active' ? 'true' : filterStatus === 'inactive' ? 'false' : '');

            const response = await api.get(`/coupons?${params.toString()}`);
            setCoupons(response.data.data || []);
            setTotalRows(response.data.pagination?.total || 0);
        } catch (err) {
            console.error('Failed to fetch coupons');
            showNotification('Failed to load coupons', 'error');
            setCoupons([]);
            setTotalRows(0);
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
                <Box display="flex" flexDirection="row" gap={1} alignItems="center" justifyContent="start" height="100%">
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
                <Box display="flex" flexDirection="column" gap={1} alignItems="start" justifyContent="center" height="100%">
                    <Typography variant="body2" noWrap>{params.value || '-'}</Typography>
                </Box>
            ),
        },
        {
            field: 'discountValue',
            headerName: 'Discount',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" gap={1} alignItems="start" justifyContent="center" height="100%">
                    <Chip
                        label={formatDiscount(params.row)}
                        size="small"
                        color={params.row.discountType === 'percentage' ? 'secondary' : 'info'}
                        variant="outlined"
                    />
                </Box>
            ),
        },
        {
            field: 'applyTo',
            headerName: 'Applies To',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" gap={1} alignItems="start" justifyContent="center" height="100%">
                    <Typography variant="body2">
                        {params.value === 'store' ? 'Entire Store' : `${params.row.categoryIds?.length || 0} Categories`}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'usage',
            headerName: 'Usage',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" gap={1} alignItems="start" justifyContent="center" height="100%">
                    <Typography variant="body2">{formatUsage(params.row)}</Typography>
                </Box>
            ),
        },
        {
            field: 'dateRange',
            headerName: 'Valid Until',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" gap={1} alignItems="start" justifyContent="center" height="100%">
                    <Typography variant="body2">{formatDate(params.row.endDate)}</Typography>
                </Box>
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 100,
            renderCell: (params: GridRenderCellParams) => {
                const status = getCouponStatus(params.row);
                return (
                    <Box display="flex" flexDirection="column" gap={1} alignItems="start" justifyContent="center" height="100%">
                        <Chip label={status.label} size="small" color={status.color} variant="outlined" />
                    </Box>
                );
            },
        },
        {
            field: 'isActive',
            headerName: 'Enabled',
            width: 80,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" gap={1} alignItems="start" justifyContent="center" height="100%">
                    <Switch
                        checked={params.value}
                        size="small"
                        onChange={() => handleToggleActive(params.row._id, params.value)}
                    />
                </Box>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="row" gap={1} alignItems="center" justifyContent="center" height="100%">
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

            <Box sx={{ width: '100%' }}>
                {loading ? <LoadingSpinner message="Loading coupons..." /> :
                    <DataGrid
                        rows={coupons}
                        columns={columns}
                        getRowId={(row) => row._id}
                        pageSizeOptions={[10, 25, 50]}
                        paginationMode="server"
                        rowCount={totalRows}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        disableRowSelectionOnClick
                        sx={dataGridStyles}
                        loading={loading}
                    />
                }
            </Box>
        </Box>
    );
}
