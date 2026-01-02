'use client';

import { useState, useEffect } from 'react';
import { useConfirm } from '@/contexts/ConfirmContext';
import {
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Autocomplete,
    TextField,
    Box,
    Chip,
    Typography,
    Button,
    Alert,
    CircularProgress,
    Paper,
    alpha,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Collapse
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import FolderIcon from '@mui/icons-material/Folder';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import StarIcon from '@mui/icons-material/Star';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import DatasetIcon from '@mui/icons-material/Dataset';
import api from '@/lib/api';

interface ExportSectionProps { }

const ENTITIES = [
    { value: 'products', label: 'Products', icon: InventoryIcon, color: '#6366f1', description: 'Export all product data' },
    { value: 'orders', label: 'Orders', icon: ShoppingCartIcon, color: '#10b981', description: 'Export order history' },
    { value: 'customers', label: 'Customers', icon: PeopleIcon, color: '#f59e0b', description: 'Export customer records' },
    { value: 'categories', label: 'Categories', icon: FolderIcon, color: '#8b5cf6', description: 'Export category tree' },
    { value: 'brands', label: 'Brands', icon: LoyaltyIcon, color: '#ec4899', description: 'Export brand data' },
    { value: 'coupons', label: 'Coupons', icon: ConfirmationNumberIcon, color: '#14b8a6', description: 'Export coupon codes' },
    { value: 'reviews', label: 'Reviews', icon: StarIcon, color: '#f97316', description: 'Export product reviews' }
];

export default function ExportSection({ }: ExportSectionProps) {
    const { confirm } = useConfirm();
    const [selectedEntity, setSelectedEntity] = useState('products');
    const [storeId, setStoreId] = useState('');
    const [categoryIds, setCategoryIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [stores, setStores] = useState<Array<{ _id: string; name: string }>>([]);
    const [categories, setCategories] = useState<Array<{ _id: string; title: string; storeId: string }>>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);

    const selectedEntityData = ENTITIES.find(e => e.value === selectedEntity);

    useEffect(() => {
        const fetchStores = async () => {
            setLoadingData(true);
            try {
                const storesRes = await api.get('/stores');
                setStores(storesRes.data.stores || storesRes.data || []);
            } catch (error) {
                console.error('Failed to fetch stores:', error);
            } finally {
                setLoadingData(false);
            }
        };
        fetchStores();
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoadingCategories(true);
            try {
                const params = new URLSearchParams();
                if (storeId) params.append('storeId', storeId);
                params.append('limit', '100');
                params.append('status', 'active');

                const response = await api.get(`/categories?${params.toString()}`);
                const cats = response.data.categories || [];
                setCategories(cats);
                setCategoryIds(prev => prev.filter(id => cats.some((c: any) => c._id === id)));
            } catch (error) {
                console.error('Failed to fetch categories:', error);
                setCategories([]);
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, [storeId]);

    const handleExport = async () => {
        setLoading(true);
        setMessage(null);

        try {
            const filters: any = {};
            if (storeId) filters.storeId = storeId;
            if (selectedEntity === 'products' && categoryIds.length > 0) {
                filters.categoryId = categoryIds[0];
            }

            const token = localStorage.getItem('accesstoken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backup/export/${selectedEntity}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedEntity}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setMessage({ type: 'success', text: 'Export successful! Your file has been downloaded.' });
        } catch (error) {
            console.error('Export error:', error);
            setMessage({ type: 'error', text: 'Export failed. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: alpha('#6366f1', 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <FileDownloadIcon sx={{ color: '#6366f1', fontSize: 26 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            Export Data to Excel
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Select an entity and optionally apply filters before exporting
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {message && (
                <Alert
                    severity={message.type}
                    sx={{ mb: 3, borderRadius: 2 }}
                    onClose={() => setMessage(null)}
                >
                    {message.text}
                </Alert>
            )}

            {/* Step 1: Select Entity */}
            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    borderColor: selectedEntity ? 'primary.main' : 'divider',
                    borderWidth: selectedEntity ? 2 : 1
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box
                        sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 700
                        }}
                    >
                        1
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Select Data Type
                    </Typography>
                    {selectedEntity && (
                        <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                            label={selectedEntityData?.label}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    )}
                </Box>

                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: 'repeat(2, 1fr)',
                        sm: 'repeat(4, 1fr)',
                        md: 'repeat(7, 1fr)'
                    },
                    gap: 2
                }}>
                    {ENTITIES.map(entity => {
                        const IconComponent = entity.icon;
                        const isSelected = selectedEntity === entity.value;
                        return (
                            <Paper
                                key={entity.value}
                                variant="outlined"
                                onClick={() => setSelectedEntity(entity.value)}
                                sx={{
                                    p: 2,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    position: 'relative',
                                    height: 130,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: isSelected ? 2 : 1,
                                    borderColor: isSelected ? entity.color : 'divider',
                                    bgcolor: isSelected ? alpha(entity.color, 0.04) : 'background.paper',
                                    transition: 'all 0.2s ease',
                                    borderRadius: 2,
                                    '&:hover': {
                                        borderColor: entity.color,
                                        transform: 'translateY(-2px)',
                                        boxShadow: `0 4px 12px ${alpha(entity.color, 0.15)}`
                                    }
                                }}
                            >
                                {isSelected && (
                                    <CheckCircleIcon
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            fontSize: 18,
                                            color: entity.color
                                        }}
                                    />
                                )}
                                <Box
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 2,
                                        bgcolor: alpha(entity.color, 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 1.5
                                    }}
                                >
                                    <IconComponent sx={{ fontSize: 24, color: entity.color }} />
                                </Box>
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        fontWeight: isSelected ? 700 : 600,
                                        color: isSelected ? entity.color : 'text.primary',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    {entity.label}
                                </Typography>
                            </Paper>
                        );
                    })}
                </Box>
            </Paper>

            {/* Step 2: Apply Filters */}
            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    bgcolor: 'grey.50'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box
                        sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: 'grey.400',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 700
                        }}
                    >
                        2
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Apply Filters
                    </Typography>
                    <Chip label="Optional" size="small" variant="outlined" />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Filter by Store</InputLabel>
                        <Select
                            value={storeId}
                            onChange={(e) => setStoreId(e.target.value)}
                            label="Filter by Store"
                            disabled={loadingData}
                            sx={{ bgcolor: 'background.paper' }}
                        >
                            <MenuItem value="">
                                <em>All Stores</em>
                            </MenuItem>
                            {stores.map(store => (
                                <MenuItem key={store._id} value={store._id}>
                                    {store.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {selectedEntity === 'products' && (
                        <Autocomplete
                            multiple
                            size="small"
                            options={categories}
                            loading={loadingCategories}
                            getOptionLabel={(option) => option.title}
                            value={categories.filter(cat => categoryIds.includes(cat._id))}
                            onChange={(_, newValue) => {
                                setCategoryIds(newValue.map(cat => cat._id));
                            }}
                            disabled={loadingData || loadingCategories}
                            sx={{ minWidth: 250, maxWidth: 400 }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Filter by Categories"
                                    placeholder={storeId ? "Select categories" : "Select a store first"}
                                    sx={{ bgcolor: 'background.paper' }}
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {loadingCategories ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip
                                        label={option.title}
                                        {...getTagProps({ index })}
                                        size="small"
                                        key={option._id}
                                    />
                                ))
                            }
                        />
                    )}
                </Box>
            </Paper>

            {/* Step 3: Export */}
            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha('#6366f1', 0.02)} 0%, ${alpha('#6366f1', 0.06)} 100%)`,
                    borderColor: alpha('#6366f1', 0.2)
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                        sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 700
                        }}
                    >
                        3
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Download Export
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Ready to export <strong>{selectedEntityData?.label}</strong>
                            {storeId && stores.find(s => s._id === storeId) &&
                                ` from ${stores.find(s => s._id === storeId)?.name}`
                            }
                            {categoryIds.length > 0 && ` (${categoryIds.length} categories selected)`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            File will be downloaded in .xlsx format
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                        onClick={handleExport}
                        disabled={loading}
                        sx={{
                            px: 5,
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: 700,
                            fontSize: '1rem',
                            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                            '&:hover': {
                                boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)'
                            }
                        }}
                    >
                        {loading ? 'Exporting...' : `Export ${selectedEntityData?.label}`}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
