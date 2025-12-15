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
import { createDataGridStyles } from '@/utils/styles';

export default function PagesPage() {
    const router = useRouter();
    const theme = useTheme();
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            setLoading(true);
            const response = await api.get('/pages');
            setPages(response.data.pages || []);
        } catch (err: any) {
            console.error('Failed to fetch pages', err);
            showNotification(err.response?.data?.message || 'Failed to load pages', 'error');
            setPages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this page?')) return;
        try {
            await api.delete(`/pages/${id}`);
            setPages(pages.filter(p => p._id !== id));
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

    const filteredRows = pages.filter((page) => {
        const query = searchQuery.toLowerCase();

        // Search filter
        const matchesSearch = !searchQuery || (
            (page.title && page.title.toLowerCase().includes(query)) ||
            (page.slug && page.slug.toLowerCase().includes(query))
        );

        // Store filter
        const pageStoreId = typeof page.storeId === 'object' && page.storeId !== null
            ? page.storeId._id
            : page.storeId;
        const matchesStore = !filterStore || pageStoreId === filterStore;

        // Status filter
        const matchesStatus = !filterStatus || page.status === filterStatus;

        return matchesSearch && matchesStore && matchesStatus;
    });

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
            renderCell: () => (
                <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}>
                    <DescriptionIcon fontSize="small" color="primary" />
                </Avatar>
            ),
        },
        {
            field: 'title',
            headerName: 'Title',
            flex: 1,
            minWidth: 200,
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
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2">{getStoreName(params.row.storeId)}</Typography>
            ),
        },
        {
            field: 'template',
            headerName: 'Template',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.value || 'default'}
                    size="small"
                    variant="outlined"
                    sx={{ textTransform: 'capitalize' }}
                />
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.value}
                    size="small"
                    color={getStatusColor(params.value as string) as any}
                    sx={{ textTransform: 'capitalize' }}
                />
            ),
        },
        {
            field: 'showInHeader',
            headerName: 'Header',
            width: 80,
            align: 'center',
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.value ? 'Yes' : 'No'}
                    size="small"
                    color={params.value ? 'success' : 'default'}
                    variant="outlined"
                />
            ),
        },
        {
            field: 'showInFooter',
            headerName: 'Footer',
            width: 80,
            align: 'center',
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.value ? 'Yes' : 'No'}
                    size="small"
                    color={params.value ? 'success' : 'default'}
                    variant="outlined"
                />
            ),
        },
        {
            field: 'updatedAt',
            headerName: 'Updated',
            width: 110,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="caption" color="text.secondary">
                    {new Date(params.value).toLocaleDateString()}
                </Typography>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box>
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

    if (loading) return <LoadingSpinner message="Loading pages..." />;

    if (pages.length === 0 && !searchQuery && !filterStore && !filterStatus) {
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

            <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    getRowId={(row) => row._id}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                    rowHeight={60}
                />
            </Box>
        </Box>
    );
}
