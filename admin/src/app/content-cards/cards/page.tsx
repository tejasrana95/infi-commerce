'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip, Avatar } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ImageIcon from '@mui/icons-material/Image';
import api from '@/lib/api';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, StatusChip, PermissionGuard } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { createDataGridStyles } from '@/utils/styles';
import { useDebounce } from '@/hooks/useDebounce';
import DynamicIcon from '@/components/atoms/DynamicIcon';

export default function ContentCardsPage() {
    const router = useRouter();
    const theme = useTheme();
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
    const [totalRows, setTotalRows] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [categories, setCategories] = useState<any[]>([]);

    const debouncedSearch = useDebounce(searchQuery, 500);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/content-cards/categories', { params: { isActive: true } });
            setCategories(response.data.data || []);
        } catch (err) {
            console.error('Failed to fetch categories', err);
        }
    };

    const fetchCards = async () => {
        try {
            setLoading(true);
            const params: any = {
                limit: paginationModel.pageSize,
                skip: paginationModel.page * paginationModel.pageSize,
                storeId: filterStore,
            };

            if (debouncedSearch) {
                params.search = debouncedSearch;
            }

            if (filterStatus) {
                params.status = filterStatus;
            }

            if (filterCategory) {
                params.categoryId = filterCategory;
            }

            const response = await api.get('/content-cards/cards', { params });
            setCards(response.data.data || []);
            setTotalRows(response.data.pagination?.total || 0);
        } catch (err: any) {
            console.error('Failed to fetch content cards', err);
            showNotification(err.response?.data?.message || 'Failed to load content cards', 'error');
            setCards([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCards();
    }, [paginationModel, debouncedSearch, filterStore, filterStatus, filterCategory]);

    const handleDelete = async (id: string) => {
        if (!await confirm({ title: 'Delete Content Card', message: 'Are you sure you want to delete this content card?', severity: 'error' })) return;
        try {
            await api.delete(`/content-cards/cards/${id}`);
            fetchCards();
            showNotification('Content card deleted successfully', 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to delete content card', 'error');
        }
    };

    const handleEdit = (id: string) => {
        router.push(`/content-cards/cards/${id}`);
    };

    const handleCreate = () => {
        router.push('/content-cards/cards/new');
    };

    const handleClone = async (id: string) => {
        try {
            await api.post(`/content-cards/cards/${id}/clone`);
            fetchCards();
            showNotification('Content card cloned successfully', 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to clone content card', 'error');
        }
    };

    const getStoreName = (storeId: any) => {
        if (typeof storeId === 'object' && storeId !== null) {
            return storeId.name;
        }
        return '-';
    };

    const getCategoryName = (categoryId: any) => {
        if (typeof categoryId === 'object' && categoryId !== null) {
            return categoryId.name;
        }
        return '-';
    };

    const renderIcon = (iconName: string, size = 24) => {
        return <DynamicIcon name={iconName} size={size} />;
    };

    const columns: GridColDef[] = [
        {
            field: 'visual',
            headerName: '',
            width: 70,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    {params.row.visualType === 'image' ? (
                        <Avatar
                            src={params.row.image}
                            alt={params.row.title}
                            variant="rounded"
                            sx={{ width: 40, height: 40 }}
                        >
                            <ImageIcon />
                        </Avatar>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, bgcolor: 'action.hover', borderRadius: 1 }}>
                            {renderIcon(params.row.icon, 24)}
                        </Box>
                    )}
                </Box>
            ),
        },
        {
            field: 'title',
            headerName: 'Title',
            flex: 1,
            minWidth: 250,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                        onClick={() => handleEdit(params.row._id)}
                    >
                        {params.row.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{params.row.slug}</Typography>
                </Box>
            ),
        },
        {
            field: 'categoryId',
            headerName: 'Category',
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Typography variant="body2">{getCategoryName(params.row.categoryId)}</Typography>
                </Box>
            ),
        },
        {
            field: 'storeId',
            headerName: 'Store',
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Typography variant="body2">{getStoreName(params.row.storeId)}</Typography>
                </Box>
            ),
        },
        {
            field: 'tags',
            headerName: 'Tags',
            width: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexWrap="wrap" gap={0.5} alignItems="center" height="100%">
                    {params.row.tags?.slice(0, 2).map((tag: string, idx: number) => (
                        <Chip key={idx} label={tag} size="small" variant="outlined" />
                    ))}
                    {params.row.tags?.length > 2 && (
                        <Typography variant="caption" color="text.secondary">+{params.row.tags.length - 2}</Typography>
                    )}
                </Box>
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Chip
                        label={params.value}
                        size="small"
                        color={params.value === 'published' ? 'success' : params.value === 'draft' ? 'warning' : 'default'}
                    />
                </Box>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 160,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="row" justifyContent="start" alignItems="center" height="100%">
                    <Tooltip title="Edit">
                        <IconButton onClick={() => handleEdit(params.row._id)} size="small" color="primary">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Clone">
                        <IconButton onClick={() => handleClone(params.row._id)} size="small" color="info">
                            <ContentCopyIcon fontSize="small" />
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

    if (!loading && cards.length === 0 && !searchQuery && !filterStore && !filterStatus && !filterCategory) {
        return (
            <Box>
                <PageHeader title="Content Cards" subtitle="Manage your content listings" actionLabel="Create Content Card" onAction={handleCreate} />
                <EmptyState
                    message="No content cards found. Create your first content card!"
                    actionLabel="Create Content Card"
                    onAction={handleCreate}
                />
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Content Cards"
                subtitle="Manage your content listings"
                actionLabel="Create Content Card"
                onAction={handleCreate}
            />

            <SearchFilterBar
                searchPlaceholder="Search content cards..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filters={[
                    {
                        id: 'status',
                        label: 'Status',
                        type: 'select',
                        options: [
                            { value: 'draft', label: 'Draft' },
                            { value: 'published', label: 'Published' },
                            { value: 'archived', label: 'Archived' },
                        ],
                    },
                    {
                        id: 'category',
                        label: 'Category',
                        type: 'select',
                        options: categories.map(cat => ({ value: cat._id, label: cat.name })),
                    },
                ]}
                activeFilters={{ status: filterStatus, category: filterCategory }}
                onFilterChange={(filters) => {
                    setFilterStatus(filters.status as string || '');
                    setFilterCategory(filters.category as string || '');
                }}
                showStoreFilter={user?.role !== 'store_admin'}
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
                    rows={cards}
                    columns={columns}
                    getRowId={(row) => row._id}
                    pageSizeOptions={[10, 25, 50]}
                    paginationMode="server"
                    rowCount={totalRows}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                    rowHeight={60}
                    loading={loading}
                />
            </Box>
        </Box>
    );
}
