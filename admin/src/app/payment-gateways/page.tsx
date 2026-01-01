'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip, Switch } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/lib/api';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { createDataGridStyles } from '@/utils/styles';
import { useDebounce } from '@/hooks/useDebounce';

interface PaymentGateway {
    _id: string;
    storeId: { _id: string; name: string } | string;
    gatewayType: string;
    gatewayName: string;
    geoGroupId?: { _id: string; name: string } | string;
    isActive: boolean;
    isTestMode: boolean;
    priority: number;
    features: {
        supportsRefund: boolean;
        supportsPartialRefund: boolean;
        supportsRecurring: boolean;
        supportedCurrencies: string[];
    };
    description?: string;
}

export default function PaymentGatewaysPage() {
    const router = useRouter();
    const theme = useTheme();
    const [gateways, setGateways] = useState<PaymentGateway[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // Pagination & Filter states
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
    const [totalRows, setTotalRows] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('');

    const debouncedSearch = useDebounce(searchQuery, 500);

    useEffect(() => {
        fetchGateways();
    }, [paginationModel, debouncedSearch, filterStore, filterType]);

    const fetchGateways = async () => {
        try {
            setLoading(true);
            const params: any = {
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: debouncedSearch,
                storeId: filterStore,
                type: filterType
            };
            const response = await api.get('/payment-gateways', { params });
            setGateways(response.data.data || []);
            setTotalRows(response.data.pagination?.total || 0);
        } catch (err: any) {
            console.error('Failed to fetch payment gateways', err);
            showNotification(err.response?.data?.message || 'Failed to load payment gateways', 'error');
            setGateways([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({ title: 'Delete Gateway', message: 'Are you sure you want to delete this payment gateway?', severity: 'error' })) return;
        try {
            await api.delete(`/payment-gateways/${id}`);
            setGateways(gateways.filter(g => g._id !== id));
            showNotification('Payment gateway deleted successfully', 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to delete', 'error');
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await api.put(`/payment-gateways/${id}`, { isActive: !currentStatus });
            setGateways(gateways.map(g => g._id === id ? { ...g, isActive: !currentStatus } : g));
            showNotification(`Gateway ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to update status', 'error');
        }
    };

    const handleEdit = (id: string) => {
        router.push(`/payment-gateways/${id}/edit`);
    };

    const handleCreate = () => {
        router.push('/payment-gateways/new');
    };

    const getStoreName = (storeId: any) => {
        if (typeof storeId === 'object' && storeId !== null) return storeId.name;
        return '-';
    };

    const getGeoGroupName = (geoGroupId: any) => {
        if (typeof geoGroupId === 'object' && geoGroupId !== null) return geoGroupId.name;
        if (!geoGroupId) return 'All Countries';
        return '-';
    };

    const getGatewayTypeColor = (type: string): 'primary' | 'secondary' | 'success' | 'info' | 'warning' => {
        const colors: Record<string, 'primary' | 'secondary' | 'success' | 'info' | 'warning'> = {
            stripe: 'primary',
            razorpay: 'info',
            paypal: 'warning',
        };
        return colors[type] || 'secondary';
    };

    const columns: GridColDef[] = [
        {
            field: 'gatewayName',
            headerName: 'Name',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={600}>{params.row.gatewayName}</Typography>
                    <Typography variant="caption" color="text.secondary">{params.row.description || '-'}</Typography>
                </Box>
            ),
        },
        {
            field: 'gatewayType',
            headerName: 'Type',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (

                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Chip
                        label={params.value.toUpperCase()}
                        size="small"
                        color={getGatewayTypeColor(params.value)}
                        variant="outlined"
                    />
                </Box>
            ),
        },
        {
            field: 'geoGroupId',
            headerName: 'Geo Group',
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2">{getGeoGroupName(params.row.geoGroupId)}</Typography>
                </Box>
            ),
        },
        {
            field: 'storeId',
            headerName: 'Store',
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2">{getStoreName(params.row.storeId)}</Typography>
                </Box>
            ),
        },
        {
            field: 'isTestMode',
            headerName: 'Mode',
            width: 90,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Chip
                        label={params.value ? 'Test' : 'Live'}
                        size="small"
                        color={params.value ? 'warning' : 'success'}
                        variant="filled"
                    />
                </Box>
            ),
        },
        {
            field: 'priority',
            headerName: 'Priority',
            width: 80,
            align: 'center',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2">{params.value}</Typography>
                </Box>
            ),
        },
        {
            field: 'isActive',
            headerName: 'Active',
            width: 80,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
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
                <Box display="flex" flexDirection="row" justifyContent="center" height="100%">
                    <Tooltip title="Edit">
                        <IconButton onClick={() => handleEdit(params.row._id)} size="small" color="primary">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton onClick={() => handleDelete(params.row._id)} size="small" color="error">
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];



    if (gateways.length === 0 && !searchQuery && !filterStore && !filterType) {
        return (
            <Box>
                <PageHeader title="Payment Gateways" subtitle="Configure payment gateways for your stores" />
                <EmptyState
                    message="No payment gateways configured. Add your first payment gateway!"
                    actionLabel="Add Gateway"
                    onAction={handleCreate}
                />
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Payment Gateways"
                subtitle="Configure payment gateways for your stores"
                actionLabel="Add Gateway"
                onAction={handleCreate}
            />

            <SearchFilterBar
                searchPlaceholder="Search gateways..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filters={[
                    {
                        id: 'type',
                        label: 'Type',
                        type: 'select',
                        options: [
                            { value: 'stripe', label: 'Stripe' },
                            { value: 'razorpay', label: 'Razorpay' },
                            { value: 'paypal', label: 'PayPal' },
                        ],
                    },
                ]}
                activeFilters={{ type: filterType }}
                onFilterChange={(filters) => setFilterType(filters.type as string || '')}
                showStoreFilter
                storeFilterValue={filterStore}
                onStoreFilterChange={setFilterStore}
            />

            <Box sx={{ width: '100%', position: 'relative' }}>
                {loading && (
                    <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.5)'
                    }}>
                        <LoadingSpinner />
                    </Box>
                )}
                <DataGrid
                    rows={gateways}
                    columns={columns}
                    getRowId={(row) => row._id}
                    paginationMode="server"
                    rowCount={totalRows}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[10, 25, 50]}
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                    loading={loading}
                />
            </Box>
        </Box>
    );
}
