'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '@/lib/api';
import { Page } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner } from '@/components/atoms';
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
    const [filterStatus, setFilterStatus] = useState<string>('');

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            setLoading(true);
            const response = await api.get('/pages');
            setPages(response.data.data || []);
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

    const filteredRows = pages.filter((page) => {
        const query = searchQuery.toLowerCase();

        // Search filter
        const matchesSearch = !searchQuery || (
            (page.title && page.title.toLowerCase().includes(query)) ||
            (page.slug && page.slug.toLowerCase().includes(query))
        );

        // Status filter
        const matchesStatus = !filterStatus || page.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'success';
            case 'draft': return 'default';
            case 'archived': return 'error';
            default: return 'default';
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'title',
            headerName: 'Title',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={600} sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }} onClick={() => handleEdit(params.row._id)}>
                        {params.row.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{params.row.slug}</Typography>
                </Box>
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.value}
                    size="small"
                    color={getStatusColor(params.value as string) as any}
                    variant="outlined"
                    sx={{ textTransform: 'capitalize' }}
                />
            ),
        },
        {
            field: 'contentMode',
            headerName: 'Mode',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.value === 'builder' ? 'Builder' : 'Rich Text'}
                    size="small"
                    color="info"
                    variant="filled"
                    sx={{ height: 24, fontSize: '0.7rem' }}
                />
            ),
        },
        {
            field: 'visibility',
            headerName: 'Visibility',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" alignItems="center" gap={0.5}>
                    <VisibilityIcon fontSize="inherit" color="action" />
                    <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{params.value}</Typography>
                </Box>
            ),
        },
        {
            field: 'updatedAt',
            headerName: 'Last Updated',
            width: 150,
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

    if (pages.length === 0 && !searchQuery && !filterStatus) {
        return (
            <Box>
                <PageHeader title="Pages" subtitle="Manage static pages" actionLabel="Create Page" onAction={handleCreate} />
                <EmptyState
                    message="No pages found. Create your first page!"
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
                subtitle="Manage static pages"
                actionLabel="Create Page"
                onAction={handleCreate}
            />

            <SearchFilterBar
                searchPlaceholder="Search pages..."
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
                            { value: 'archived', label: 'Archived' },
                        ],
                    },
                ]}
                activeFilters={{ status: filterStatus }}
                onFilterChange={(filters) => setFilterStatus(filters.status as string || '')}
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
                    rowHeight={60}
                />
            </Box>
        </Box>
    );
}
