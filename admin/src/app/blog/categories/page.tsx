'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/lib/api';
import { BlogCategory } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';

export default function BlogCategoriesPage() {
    const router = useRouter();
    const theme = useTheme();
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await api.get('/blog/categories');
            setCategories(response.data.categories || []);
        } catch (err: any) {
            console.error('Failed to fetch blog categories', err);
            showNotification(err.response?.data?.message || 'Failed to load categories', 'error');
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            await api.delete(`/blog/categories/${id}`);
            setCategories(categories.filter(c => c._id !== id));
            showNotification('Category deleted successfully', 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to delete category', 'error');
        }
    };

    const handleEdit = (id: string) => {
        router.push(`/blog/categories/${id}`);
    };

    const handleCreate = () => {
        router.push('/blog/categories/new');
    };

    const filteredRows = categories.filter((category) => {
        const query = searchQuery.toLowerCase();

        // Search filter
        const matchesSearch = !searchQuery || (
            (category.name && category.name.toLowerCase().includes(query)) ||
            (category.slug && category.slug.toLowerCase().includes(query))
        );

        // Status filter
        const matchesStatus = !filterStatus || (
            filterStatus === 'active' ? category.isActive : !category.isActive
        );

        return matchesSearch && matchesStatus;
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
            field: 'postCount',
            headerName: 'Articles',
            width: 100,
            align: 'center',
            renderCell: (params: GridRenderCellParams) => (
                <Chip label={params.value || 0} size="small" />
                // <Typography variant="body2">{params.value || 0}</Typography>
            ),
        },
        {
            field: 'isActive',
            headerName: 'Active',
            width: 100,
            renderCell: (params: GridRenderCellParams) => <StatusChip active={params.value as boolean} />,
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

    if (loading) return <LoadingSpinner message="Loading categories..." />;

    if (categories.length === 0 && !searchQuery && !filterStatus) {
        return (
            <Box>
                <PageHeader title="Blog Categories" subtitle="Manage blog categories" actionLabel="Create Category" onAction={handleCreate} />
                <EmptyState
                    message="No categories found. Create your first category!"
                    actionLabel="Create Category"
                    onAction={handleCreate}
                />
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Blog Categories"
                subtitle="Manage blog categories"
                actionLabel="Create Category"
                onAction={handleCreate}
            />

            <SearchFilterBar
                searchPlaceholder="Search categories..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filters={[
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
