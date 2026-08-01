'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Button, Paper, List, ListItem,
    ListItemAvatar, Avatar, ListItemText, Divider, CircularProgress
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';

interface TopProductsWidgetProps {
    storeId: string;
}

export default function TopProductsWidget({ storeId }: TopProductsWidgetProps) {
    const router = useRouter();
    const { convertAndFormat } = useCurrency();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTopProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/dashboard/widgets/top-products?storeId=${storeId}`);
            setProducts(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch top products widget:', err);
        } finally {
            setLoading(false);
        }
    }, [storeId]);

    useEffect(() => {
        fetchTopProducts();
    }, [fetchTopProducts]);

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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontWeight={600}>Top Selling Products</Typography>
                <Button
                    size="small"
                    endIcon={<ChevronRightIcon />}
                    onClick={() => router.push('/products')}
                    sx={{ textTransform: 'none' }}
                >
                    View All
                </Button>
            </Box>

            <Box flex={1}>
                {loading ? (
                    <Box p={4} display="flex" justifyContent="center"><CircularProgress size={30} /></Box>
                ) : (
                    <List disablePadding>
                        {products.map((product, index) => {
                            const imageUrl = getProductImageUrl(product);
                            return (
                                <Box key={product._id}>
                                    <ListItem
                                        alignItems="center"
                                        sx={{ px: 0, py: 1.2, cursor: 'pointer' }}
                                        onClick={() => router.push(`/products/${product._id}/edit`)}
                                    >
                                        <ListItemAvatar sx={{ mr: 1.5 }}>
                                            <Avatar
                                                src={imageUrl}
                                                variant="rounded"
                                                sx={{
                                                    width: 48,
                                                    height: 48,
                                                    bgcolor: 'primary.50',
                                                    borderRadius: 1.5,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                }}
                                            >
                                                <InventoryIcon color="primary" />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle2" fontWeight={600} noWrap>
                                                    {product.name}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="caption" color="text.secondary">
                                                    SKU: {product.sku || 'N/A'} • <strong>{product.salesCount || 0}</strong> sold
                                                </Typography>
                                            }
                                        />
                                        <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                                            {convertAndFormat(product.price)}
                                        </Typography>
                                    </ListItem>
                                    {index < products.length - 1 && <Divider component="li" />}
                                </Box>
                            );
                        })}
                    </List>
                )}
            </Box>
        </Paper>
    );
}
