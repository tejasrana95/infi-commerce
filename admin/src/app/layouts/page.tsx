'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import api from '@/lib/api';
import { Layout } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';

export default function LayoutsPage() {
    const router = useRouter();
    const theme = useTheme();
    const [layouts, setLayouts] = useState<Layout[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    useEffect(() => {
        fetchLayouts();
    }, []);

    const fetchLayouts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/layouts');
            setLayouts(response.data.data || []);
        } catch (err: any) {
            console.error('Failed to fetch layouts', err);
            showNotification(err.response?.data?.message || 'Failed to load layouts', 'error');
            setLayouts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this layout?')) return;
        try {
            await api.delete(`/layouts/${id}`);
            setLayouts(layouts.filter(l => l._id !== id));
            showNotification('Layout deleted successfully', 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to delete layout', 'error');
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            const response = await api.post(`/layouts/${id}/duplicate`, { name: '' }); // Backend handles name generation
            setLayouts([...layouts, response.data.layout]);
            showNotification('Layout duplicated successfully', 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to duplicate layout', 'error');
        }
    };

    const handleEdit = (id: string) => {
        router.push(`/layouts/${id}`); // Assuming detailed view/edit is at /layouts/[id]
    };

    const handleCreate = () => {
        router.push('/layouts/new');
    };

    const filteredRows = layouts.filter((layout) => {
        const query = searchQuery.toLowerCase();

        // Search filter (name, slug)
        const matchesSearch = !searchQuery || (
            (layout.name && layout.name.toLowerCase().includes(query)) ||
            (layout.slug && layout.slug.toLowerCase().includes(query))
        );

        // Type filter
        const matchesType = !filterType || layout.type === filterType;

        // Status filter
        const matchesStatus = !filterStatus || (
            filterStatus === 'active' ? layout.isActive : !layout.isActive
        );

        return matchesSearch && matchesType && matchesStatus;
    });

    const columns: GridColDef[] = [
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            minWidth: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                    <Typography variant="body2" fontWeight={600} sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }} onClick={() => handleEdit(params.row._id)}>
                        {params.row.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{params.row.slug}</Typography>
                </Box>
            ),
        },
        {
            field: 'type',
            headerName: 'Type',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.value === 'page' ? 'Page' : 'Template'}
                    size="small"
                    color={params.value === 'template' ? 'secondary' : 'default'}
                    variant="outlined"
                />
            ),
        },
        {
            field: 'isDefault',
            headerName: 'Default',
            width: 100,
            align: 'center',
            renderCell: (params: GridRenderCellParams) => (
                params.value ? <StarIcon color="warning" fontSize="small" /> : <StarBorderIcon color="disabled" fontSize="small" />
            ),
        },
        {
            field: 'isActive',
            headerName: 'Active',
            width: 100,
            renderCell: (params: GridRenderCellParams) => <StatusChip active={params.value as boolean} />,
        },
        {
            field: 'createdAt',
            headerName: 'Created',
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="caption" color="text.secondary">
                    {new Date(params.value).toLocaleDateString()}
                </Typography>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box>
                    <Tooltip title="Edit">
                        <IconButton onClick={() => handleEdit(params.row._id)} size="small" color="primary">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Duplicate">
                        <IconButton onClick={() => handleDuplicate(params.row._id)} size="small" color="info">
                            <ContentCopyIcon fontSize="small" />
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

    if (loading) return <LoadingSpinner message="Loading layouts..." />;

    if (layouts.length === 0 && !searchQuery && !filterType && !filterStatus) {
        return (
            <Box>
                <PageHeader title="Layouts" subtitle="Manage your Storefront layouts" actionLabel="Create Layout" onAction={handleCreate} />
                <EmptyState
                    message="No layouts found. Create your first layout!"
                    actionLabel="Create Layout"
                    onAction={handleCreate}
                />
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Layouts"
                subtitle="Manage your Storefront layouts"
                actionLabel="Create Layout"
                onAction={handleCreate}
            />

            <SearchFilterBar
                searchPlaceholder="Search layouts..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filters={[
                    {
                        id: 'type',
                        label: 'Type',
                        type: 'select',
                        options: [
                            { value: 'page', label: 'Page Layout' },
                            { value: 'template', label: 'Theme Template' },
                        ],
                    },
                    {
                        id: 'status',
                        label: 'Status',
                        type: 'select',
                        options: [
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
                        ],
                    },
                ]}
                activeFilters={{
                    type: filterType,
                    status: filterStatus
                }}
                onFilterChange={(filters) => {
                    setFilterType(filters.type as string || '');
                    setFilterStatus(filters.status as string || '');
                }}
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
                    rowHeight={70}
                />
            </Box>
        </Box>
    );
}
