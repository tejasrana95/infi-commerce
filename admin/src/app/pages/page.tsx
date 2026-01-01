'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip, Avatar } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import api from '@/lib/api';
import { Page } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { createDataGridStyles } from '@/utils/styles';
import { useDebounce } from '@/hooks/useDebounce';

export default function PagesPage() {
    const router = useRouter();
    const theme = useTheme();
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // Pagination & Filter states
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
    const [totalRows, setTotalRows] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    const debouncedSearch = useDebounce(searchQuery, 500);

    useEffect(() => {
        fetchPages();
    }, [paginationModel, debouncedSearch, filterStore, filterStatus]);

    const fetchPages = async () => {
        try {
            setLoading(true);
            const params: any = {
                page: paginationModel.page + 1,
                limit: paginationModel.pageSize,
                search: debouncedSearch,
                storeId: filterStore,
                status: filterStatus,
            };

            const response = await api.get('/pages', { params });
            setPages(response.data.pages || []);
            setTotalRows(response.data.pagination?.total || 0);
        } catch (err: any) {
            console.error('Failed to fetch pages', err);
            showNotification(err.response?.data?.message || 'Failed to load pages', 'error');
            setPages([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({ title: 'Delete Page', message: 'Are you sure you want to delete this page?', severity: 'error' })) return;
        try {
            await api.delete(`/pages/${id}`);
            fetchPages();
            showNotification('Page deleted successfully', 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to delete page', 'error');
        }
    };

    const handleEdit = (id: string) => {
        router.push(`/pages/${id}`);
    };

    const handleCreate = () => {
        router.push('/pages/new');
    };

    const getStoreName = (storeId: any) => {
        if (typeof storeId === 'object' && storeId !== null) {
            return storeId.name;
        }
        return '-';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'success';
            case 'draft': return 'default';
            default: return 'default';
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'icon',
            headerName: '',
            width: 60,
            sortable: false,
            display: 'flex',
            renderCell: () => (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%" width="100%">
                    <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}>
                        <DescriptionIcon fontSize="small" color="primary" />
                    </Avatar>
                </Box>
            ),
        },
        {
            field: 'title',
            headerName: 'Title',
            flex: 1,
            minWidth: 200,
            display: 'flex',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                        onClick={() => handleEdit(params.row._id)}
                    >
                        {params.row.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">/{params.row.slug}</Typography>
                </Box>
            ),
        },
        {
            field: 'storeId',
            headerName: 'Store',
            width: 140,
            display: 'flex',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" height="100%">
                    <Typography variant="body2">{getStoreName(params.row.storeId)}</Typography>
                </Box>
            ),
        },
        {
            field: 'template',
            headerName: 'Template',
            width: 120,
            display: 'flex',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" height="100%">
                    <Chip
                        label={params.value || 'default'}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                    />
                </Box>
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            display: 'flex',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" height="100%">
                    <Chip
                        label={params.value}
                        size="small"
                        color={getStatusColor(params.value as string) as any}
                        sx={{ textTransform: 'capitalize' }}
                    />
                </Box>
            ),
        },
        {
            field: 'showInHeader',
            headerName: 'Header',
            width: 80,
            align: 'center',
            headerAlign: 'center',
            display: 'flex',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%" width="100%">
                    <Chip
                        label={params.value ? 'Yes' : 'No'}
                        size="small"
                        color={params.value ? 'success' : 'default'}
                        variant="outlined"
                    />
                </Box>
            ),
        },
        {
            field: 'showInFooter',
            headerName: 'Footer',
            width: 80,
            align: 'center',
            headerAlign: 'center',
            display: 'flex',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%" width="100%">
                    <Chip
                        label={params.value ? 'Yes' : 'No'}
                        size="small"
                        color={params.value ? 'success' : 'default'}
                        variant="outlined"
                    />
                </Box>
            ),
        },
        {
            field: 'updatedAt',
            headerName: 'Updated',
            width: 110,
            display: 'flex',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" height="100%">
                    <Typography variant="caption" color="text.secondary">
                        {new Date(params.value).toLocaleDateString()}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            display: 'flex',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" height="100%">
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

    if (!loading && pages.length === 0 && !searchQuery && !filterStore && !filterStatus) {
        return (
            <Box>
                <PageHeader title="Pages" subtitle="Manage static pages like About, Contact, Privacy" actionLabel="Create Page" onAction={handleCreate} />
                <EmptyState
                    message="No pages found. Create your first static page!"
                    actionLabel="Create Page"
                    onAction={handleCreate}
                />
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Pages"
                subtitle="Manage static pages like About, Contact, Privacy"
                actionLabel="Create Page"
                onAction={handleCreate}
            />

            <SearchFilterBar
                searchPlaceholder="Search pages by title or slug..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filters={[
                    {
                        id: 'status',
                        label: 'Status',
                        type: 'select',
                        options: [
                            { value: 'published', label: 'Published' },
                            { value: 'draft', label: 'Draft' },
                        ],
                    },
                ]}
                activeFilters={{ status: filterStatus }}
                onFilterChange={(filters) => setFilterStatus(filters.status as string || '')}
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
                    rows={pages}
                    columns={columns}
                    getRowId={(row) => row._id}
                    paginationMode="server"
                    rowCount={totalRows}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[10, 25, 50]}
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                    rowHeight={60}
                    loading={loading}
                />
            </Box>
        </Box>
    );
}
