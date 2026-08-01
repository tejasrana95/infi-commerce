'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Avatar
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InventoryIcon from '@mui/icons-material/Inventory';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface LowStockWidgetProps {
    storeId: string;
}

export default function LowStockWidget({ storeId }: LowStockWidgetProps) {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLowStock = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/dashboard/widgets/low-stock?storeId=${storeId}`);
            setProducts(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch low stock widget:', err);
        } finally {
            setLoading(false);
        }
    }, [storeId]);

    useEffect(() => {
        fetchLowStock();
    }, [fetchLowStock]);

    const getProductImageUrl = (product: any): string => {
        if (!product) return '';
        const img = product.featuredImage || product.images?.[0] || product.image;
        if (!img) return '';
        if (typeof img === 'string') return img;
        if (typeof img === 'object' && img.url) return img.url;
        if (Array.isArray(img) && img.length > 0) {
            const first = img[0];
            return typeof first === 'string' ? first : first?.url || '';
        }
        return '';
    };

    return (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                    <WarningAmberIcon color="warning" />
                    <Typography variant="h6" fontWeight={600}>Low Stock Alert</Typography>
                </Box>
                <Button
                    size="small"
                    endIcon={<ChevronRightIcon />}
                    onClick={() => router.push('/products')}
                    sx={{ textTransform: 'none' }}
                >
                    View Products
                </Button>
            </Box>

            <TableContainer sx={{ flex: 1, maxHeight: 300 }}>
                {loading ? (
                    <Box p={4} display="flex" justifyContent="center"><CircularProgress size={30} /></Box>
                ) : products.length === 0 ? (
                    <Box p={3} textAlign="center">
                        <Typography variant="body2" color="text.secondary">All products have sufficient stock levels! 👍</Typography>
                    </Box>
                ) : (
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>SKU</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Stock Left</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map((product) => {
                                const imageUrl = getProductImageUrl(product);
                                return (
                                    <TableRow
                                        key={product._id}
                                        hover
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => router.push(`/products/${product._id}/edit`)}
                                    >
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1.5}>
                                                <Avatar
                                                    src={imageUrl}
                                                    variant="rounded"
                                                    sx={{ width: 34, height: 34, bgcolor: 'warning.50', borderRadius: 1 }}
                                                >
                                                    <InventoryIcon fontSize="small" color="warning" />
                                                </Avatar>
                                                <Typography variant="body2" fontWeight={600}>{product.name}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{product.sku || 'N/A'}</TableCell>
                                        <TableCell align="right">
                                            <Chip
                                                label={`${product.stock} left`}
                                                size="small"
                                                color={product.stock === 0 ? 'error' : 'warning'}
                                                sx={{ fontWeight: 700 }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </TableContainer>
        </Paper>
    );
}
