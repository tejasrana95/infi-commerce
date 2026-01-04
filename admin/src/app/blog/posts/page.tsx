'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, IconButton, Typography, useTheme, Chip, Avatar } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '@/lib/api';
import { BlogPost, BlogCategory } from '@/types';
import { PageHeader, EmptyState, SearchFilterBar } from '@/components/molecules';
import { LoadingSpinner, PermissionGuard, SeoScoreBadge } from '@/components/atoms';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { createDataGridStyles } from '@/utils/styles';

export default function BlogPostsPage() {
    const router = useRouter();
    const theme = useTheme();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStore, setFilterStore] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    const [debouncedSearch, setDebouncedSearch] = useState('');

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
        fetchPosts();
    }, [paginationModel, debouncedSearch, filterStore, filterStatus]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', String(paginationModel.page + 1));
            params.append('limit', String(paginationModel.pageSize));
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (filterStore) params.append('storeId', filterStore);
            if (filterStatus) params.append('status', filterStatus);

            const response = await api.get(`/blog/posts?${params.toString()}`);
            setPosts(response.data.data || []);
            setTotalRows(response.data.pagination?.total || 0);
        } catch (err: any) {
            console.error('Failed to fetch posts', err);
            showNotification(err.response?.data?.message || 'Failed to load posts', 'error');
            setPosts([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({ title: 'Delete Post', message: 'Are you sure you want to delete this post?', severity: 'error' })) return;
        try {
            await api.delete(`/blog/posts/${id}`);
            setPosts(posts.filter(p => p._id !== id));
            showNotification('Post deleted successfully', 'success');
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to delete post', 'error');
        }
    };

    const handleEdit = (id: string) => {
        router.push(`/blog/posts/${id}`);
    };

    const handleCreate = () => {
        router.push('/blog/posts/new');
    };

    const getStoreName = (storeId: any) => {
        if (typeof storeId === 'object' && storeId !== null) {
            return storeId.name;
        }
        return '-';
    };

    const getCategoryNames = (categoryIds: any[]) => {
        if (!categoryIds || categoryIds.length === 0) return '-';
        return categoryIds.map(cat => {
            if (typeof cat === 'object' && cat !== null) {
                return cat.name;
            }
            return '';
        }).filter(Boolean).join(', ') || '-';
    };



    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'success';
            case 'draft': return 'default';
            case 'scheduled': return 'info';
            case 'archived': return 'error';
            default: return 'default';
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'featuredImage',
            headerName: '',
            width: 80,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Avatar
                        src={params.value}
                        alt={params.row.title}
                        variant="rounded"
                        sx={{ width: 50, height: 50 }}
                    >
                        {params.row.title?.charAt(0)}
                    </Avatar>
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
            field: 'storeId',
            headerName: 'Store',
            width: 140,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%"><Typography variant="body2">{getStoreName(params.row.storeId)}</Typography></Box>
            ),
        },
        {
            field: 'categoryIds',
            headerName: 'Categories',
            width: 160,
            renderCell: (params: GridRenderCellParams) => {
                const categories = params.value as (string | BlogCategory)[];
                if (!categories || categories.length === 0) return <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%"><Typography variant="caption" color="text.secondary">-</Typography></Box>;
                const catName = typeof categories[0] === 'object' ? (categories[0] as BlogCategory).name : '...';
                const moreCount = categories.length > 1 ? ` +${categories.length - 1}` : '';
                return (
                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%"><Chip label={catName + moreCount} size="small" variant="outlined" /></Box>
                );
            }
        },
        {
            field: 'author',
            headerName: 'Author',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%"><Typography variant="body2">{params.value?.name || '-'}</Typography></Box>
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
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
            field: 'viewCount',
            headerName: 'Views',
            width: 80,
            align: 'center',
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="row" justifyContent="start" alignItems="center" gap={0.5} height="100%">
                    <VisibilityIcon fontSize="small" color="action" />
                    <Typography variant="caption">{params.value || 0}</Typography>
                </Box>
            )
        },
        {
            field: 'publishedAt',
            headerName: 'Published',
            width: 110,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="start" height="100%">
                    <Typography variant="caption" color="text.secondary">
                        {params.value ? new Date(params.value).toLocaleDateString() : '-'}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'seo',
            headerName: 'SEO Score',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <SeoScoreBadge score={params.row.seo?.score} />
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box display="flex" flexDirection="row" justifyContent="start" alignItems="center" gap={0.5} height="100%">
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

    if (!loading && posts.length === 0 && !searchQuery && !filterStore && !filterStatus) {
        return (
            <Box>
                <PageHeader title="Blog Posts" subtitle="Manage your blog articles" actionLabel="Create Post" onAction={handleCreate} />
                <EmptyState
                    message="No blog posts found. Create your first post!"
                    actionLabel="Create Post"
                    onAction={handleCreate}
                />
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Blog Posts"
                subtitle="Manage your blog articles"
                actionLabel="Create Post"
                onAction={handleCreate}
            />

            <SearchFilterBar
                searchPlaceholder="Search posts by title, slug or author..."
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
                            { value: 'scheduled', label: 'Scheduled' },
                            { value: 'archived', label: 'Archived' },
                        ],
                    },
                ]}
                activeFilters={{ status: filterStatus }}
                onFilterChange={(filters) => setFilterStatus(filters.status as string || '')}
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
                    rows={posts}
                    columns={columns}
                    getRowId={(row) => row._id}
                    pageSizeOptions={[10, 25, 50]}
                    paginationMode="server"
                    rowCount={totalRows}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                    rowHeight={70}
                    loading={loading}
                />
            </Box>
        </Box>
    );
}
