'use client';

import { useState, useRef, useEffect } from 'react';
import { useConfirm } from '@/contexts/ConfirmContext';
import {
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Autocomplete,
    TextField,
    Chip,
    Box,
    Typography,
    Button,
    Alert,
    AlertTitle,
    Paper,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    alpha,
    Collapse
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import FolderIcon from '@mui/icons-material/Folder';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import StarIcon from '@mui/icons-material/Star';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import VerifiedIcon from '@mui/icons-material/Verified';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import api from '@/lib/api';

const ENTITIES = [
    { value: 'products', label: 'Products', icon: InventoryIcon, color: '#6366f1', description: 'Import product data' },
    { value: 'orders', label: 'Orders', icon: ShoppingCartIcon, color: '#10b981', description: 'Import order records' },
    { value: 'customers', label: 'Customers', icon: PeopleIcon, color: '#f59e0b', description: 'Import customer data' },
    { value: 'categories', label: 'Categories', icon: FolderIcon, color: '#8b5cf6', description: 'Import categories' },
    { value: 'brands', label: 'Brands', icon: LoyaltyIcon, color: '#ec4899', description: 'Import brand data' },
    { value: 'coupons', label: 'Coupons', icon: ConfirmationNumberIcon, color: '#14b8a6', description: 'Import coupon codes' },
    { value: 'reviews', label: 'Reviews', icon: StarIcon, color: '#f97316', description: 'Import product reviews' }
];

export default function ImportSection() {
    const { confirm } = useConfirm();
    const [selectedEntity, setSelectedEntity] = useState('products');
    const [storeId, setStoreId] = useState('');
    const [categoryIds, setCategoryIds] = useState<string[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [result, setResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
                setFile(droppedFile);
                setResult(null);
            }
        }
    };

    const handleValidate = async () => {
        if (!file) return;

        setValidating(true);
        setResult(null);

        try {
            const token = localStorage.getItem('accesstoken');
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backup/validate/${selectedEntity}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Validation error:', error);
        } finally {
            setValidating(false);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        const confirmed = await confirm({
            title: 'Confirm Import',
            message: 'Are you sure you want to import this data? This will create new records or update existing ones. Make sure you have a database backup before proceeding.',
            severity: 'warning',
            confirmLabel: 'Import',
            cancelLabel: 'Cancel'
        });

        if (!confirmed) return;

        setLoading(true);
        setResult(null);

        try {
            const token = localStorage.getItem('accesstoken');
            const formData = new FormData();
            formData.append('file', file);
            if (storeId) formData.append('storeId', storeId);
            if (selectedEntity === 'products' && categoryIds.length > 0) {
                formData.append('categoryId', categoryIds[0]);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backup/import/${selectedEntity}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            setResult(data);

            if (data.success) {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Import error:', error);
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
                            bgcolor: alpha('#10b981', 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <FileUploadIcon sx={{ color: '#10b981', fontSize: 26 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            Import Data from Excel
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Upload an Excel file matching the export format
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Safety Warning */}
            <Paper
                elevation={0}
                sx={{
                    mb: 4,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha('#f59e0b', 0.08),
                    border: '1px solid',
                    borderColor: alpha('#f59e0b', 0.3),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                }}
            >
                <WarningAmberIcon sx={{ color: '#d97706', fontSize: 24 }} />
                <Typography variant="body2" sx={{ color: '#92400e' }}>
                    Always create a <strong>database backup</strong> before importing data. If there are validation errors, the entire import will be rejected.
                </Typography>
            </Paper>

            {/* Step 1: Select Entity */}
            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    borderColor: selectedEntity ? 'success.main' : 'divider',
                    borderWidth: selectedEntity ? 2 : 1
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box
                        sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: 'success.main',
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
                            color="success"
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

            {/* Step 2: Upload File */}
            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    borderColor: file ? 'success.main' : 'divider',
                    borderWidth: file ? 2 : 1
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box
                        sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: file ? 'success.main' : 'grey.400',
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
                        Upload Excel File
                    </Typography>
                    {file && (
                        <Chip
                            icon={<DescriptionIcon sx={{ fontSize: 16 }} />}
                            label={file.name}
                            size="small"
                            color="success"
                            variant="outlined"
                            onDelete={() => {
                                setFile(null);
                                setResult(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                        />
                    )}
                </Box>

                <input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />

                <Paper
                    variant="outlined"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        cursor: 'pointer',
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        borderColor: file ? 'success.main' : 'divider',
                        bgcolor: file ? alpha('#10b981', 0.04) : 'grey.50',
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            bgcolor: file ? alpha('#10b981', 0.08) : 'grey.100',
                            borderColor: 'success.main'
                        }
                    }}
                >
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            bgcolor: file ? alpha('#10b981', 0.15) : 'grey.200',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2
                        }}
                    >
                        <CloudUploadIcon sx={{ fontSize: 32, color: file ? '#10b981' : 'text.secondary' }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {file ? 'Click to replace file' : 'Drop your Excel file here'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {file ? file.name : 'or click to browse • Supports .xlsx, .xls'}
                    </Typography>
                </Paper>
            </Paper>

            {/* Step 3: Import Options */}
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
                        3
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Import Options
                    </Typography>
                    <Chip label="Optional" size="small" variant="outlined" />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Assign to Store</InputLabel>
                        <Select
                            value={storeId}
                            onChange={(e) => setStoreId(e.target.value)}
                            label="Assign to Store"
                            disabled={loadingData}
                            sx={{ bgcolor: 'background.paper' }}
                        >
                            <MenuItem value="">
                                <em>Auto-detect from file</em>
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
                                    label="Assign to Categories"
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

            {/* Validation/Import Results */}
            {result && (
                <Paper
                    variant="outlined"
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                        overflow: 'hidden',
                        borderColor: result.success ? 'success.main' : 'error.main',
                        borderWidth: 2
                    }}
                >
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: result.success ? alpha('#10b981', 0.08) : alpha('#ef4444', 0.08),
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                        }}
                    >
                        {result.success ? (
                            <CheckCircleIcon sx={{ color: '#10b981', fontSize: 24 }} />
                        ) : (
                            <ErrorIcon sx={{ color: '#ef4444', fontSize: 24 }} />
                        )}
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: result.success ? '#065f46' : '#991b1b' }}>
                                {result.success ? 'Success' : 'Validation Errors Found'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: result.success ? '#047857' : '#b91c1c' }}>
                                {result.message}
                            </Typography>
                        </Box>
                        {result.success && result.created !== undefined && (
                            <Box sx={{ display: 'flex', gap: 3 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#10b981' }}>{result.created}</Typography>
                                    <Typography variant="caption" color="text.secondary">Created</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#6366f1' }}>{result.updated}</Typography>
                                    <Typography variant="caption" color="text.secondary">Updated</Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>

                    {result.errors && result.errors.length > 0 && (
                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                            <List dense disablePadding>
                                {result.errors.map((err: any, idx: number) => (
                                    <ListItem
                                        key={idx}
                                        divider={idx < result.errors.length - 1}
                                        sx={{ py: 1.5, px: 2 }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <ErrorIcon color="error" fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                                                    Row {err.row}
                                                </Typography>
                                            }
                                            secondary={err.errors.join(' • ')}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                </Paper>
            )}

            {/* Step 4: Actions */}
            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha('#10b981', 0.02)} 0%, ${alpha('#10b981', 0.06)} 100%)`,
                    borderColor: alpha('#10b981', 0.2)
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                        sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: file ? 'success.main' : 'grey.400',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 700
                        }}
                    >
                        4
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Validate & Import
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                        variant="outlined"
                        size="large"
                        startIcon={validating ? <CircularProgress size={20} /> : <VerifiedIcon />}
                        onClick={handleValidate}
                        disabled={!file || validating || loading}
                        sx={{ px: 4, borderRadius: 2, fontWeight: 600 }}
                    >
                        {validating ? 'Validating...' : 'Validate File'}
                    </Button>

                    <Button
                        variant="contained"
                        color="success"
                        size="large"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                        onClick={handleImport}
                        disabled={!file || loading || validating}
                        sx={{
                            px: 5,
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: 700,
                            fontSize: '1rem',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                            '&:hover': {
                                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
                            }
                        }}
                    >
                        {loading ? 'Importing...' : `Import ${selectedEntityData?.label}`}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
