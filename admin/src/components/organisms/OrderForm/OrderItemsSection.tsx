'use client';

import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useOrderForm } from './OrderFormContext';
import { ProductAutoComplete } from '@/components/molecules';
import { ProductOption } from '@/components/molecules/ProductAutoComplete';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Variant {
    _id: string;
    sku: string;
    price?: number;
    salePrice?: number;
    attributes?: Record<string, string>;
    stock?: number;
    weight?: number;
}

export default function OrderItemsSection() {
    const {
        storeId,
        items,
        addItem,
        updateItemQuantity,
        removeItem,
        subtotal,
        currency,
    } = useOrderForm();

    const { formatPrice, convertPrice, baseCurrency } = useCurrency();

    // Variant selection dialog state
    const [variantDialogOpen, setVariantDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
    const [selectedVariantId, setSelectedVariantId] = useState<string>('');
    const [quantity, setQuantity] = useState(1);

    const handleProductSelect = (product: ProductOption | null) => {
        if (!product) return;

        // If product has variants, show variant selection dialog
        if (product.variants && product.variants.length > 0) {
            setSelectedProduct(product);
            setSelectedVariantId(product.variants[0]._id);
            setQuantity(1);
            setVariantDialogOpen(true);
        } else {
            // Simple product - add directly
            addItem(product, 1);
        }
    };

    const handleAddVariant = () => {
        if (selectedProduct && selectedVariantId) {
            addItem(selectedProduct, quantity, selectedVariantId);
            handleCloseVariantDialog();
        }
    };

    const handleCloseVariantDialog = () => {
        setVariantDialogOpen(false);
        setSelectedProduct(null);
        setSelectedVariantId('');
        setQuantity(1);
    };

    const getSelectedVariant = (): Variant | undefined => {
        if (!selectedProduct || !selectedVariantId) return undefined;
        return selectedProduct.variants?.find(v => v._id === selectedVariantId);
    };

    // Check if a key looks like a MongoDB ObjectId (24 hex chars)
    const isObjectId = (key: string) => /^[a-f0-9]{24}$/i.test(key);

    const formatVariantLabel = (variant: Variant) => {
        if (!variant.attributes) return variant.sku;
        // Filter out ObjectId keys, only show human-readable attribute names
        return Object.entries(variant.attributes)
            .filter(([key]) => !isObjectId(key))
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ') || variant.sku;
    };

    // Get human-readable attributes only
    const getDisplayAttributes = (attributes?: Record<string, string>) => {
        if (!attributes) return {};
        return Object.fromEntries(
            Object.entries(attributes).filter(([key]) => !isObjectId(key))
        );
    };

    // Convert from base currency to selected currency and format
    const formatConvertedPrice = (amount: number) => {
        // If same as base or no currency selected, just format
        if (!currency || currency === baseCurrency?.code) {
            return formatPrice(amount);
        }
        // Convert and format
        const converted = convertPrice(amount, currency);
        return formatPrice(converted, currency);
    };

    const selectedVariant = getSelectedVariant();

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Order Items</Typography>

            <ProductAutoComplete
                storeId={storeId}
                value={null}
                onChange={handleProductSelect}
                label="Add Product"
                placeholder="Search products by name or SKU..."
                currency={currency}
            />

            {items.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                    No items added yet. Search and select products above.
                </Alert>
            ) : (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>PRODUCT</TableCell>
                                <TableCell align="right">PRICE</TableCell>
                                <TableCell align="center" width={100}>QTY</TableCell>
                                <TableCell align="right">TOTAL</TableCell>
                                <TableCell width={50}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((item, index) => (
                                <TableRow key={`${item.productId}-${item.variantId || index}`}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>
                                            {item.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            SKU: {item.sku}
                                            {item.variantId && <Chip size="small" label="Variant" sx={{ ml: 1, height: 18 }} />}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        {formatConvertedPrice(item.price)}
                                    </TableCell>
                                    <TableCell align="center">
                                        <TextField
                                            type="number"
                                            size="small"
                                            value={item.quantity}
                                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                                            inputProps={{ min: 1, style: { textAlign: 'center', width: 50 } }}
                                            sx={{ width: 70 }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography fontWeight={500}>
                                            {formatConvertedPrice(item.price * item.quantity)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small" color="error" onClick={() => removeItem(index)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Subtotal Display */}
            <Paper sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }}>
                <Box display="flex" justifyContent="space-between">
                    <Typography variant="subtitle1" fontWeight={500}>Subtotal ({items.length} items):</Typography>
                    <Typography variant="subtitle1" fontWeight={600}>{formatConvertedPrice(subtotal)}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                    Shipping, tax, and discount will be calculated in the Payment step
                </Typography>
            </Paper>

            {/* Variant Selection Dialog */}
            <Dialog open={variantDialogOpen} onClose={handleCloseVariantDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Select Variant
                    {selectedProduct && (
                        <Typography variant="body2" color="text.secondary">
                            {selectedProduct.name}
                        </Typography>
                    )}
                </DialogTitle>
                <DialogContent dividers>
                    {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
                        <Box>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Variant</InputLabel>
                                <Select
                                    value={selectedVariantId}
                                    label="Variant"
                                    onChange={(e) => setSelectedVariantId(e.target.value)}
                                >
                                    {selectedProduct.variants.map((variant) => (
                                        <MenuItem key={variant._id} value={variant._id}>
                                            <Box>
                                                <Typography variant="body2">
                                                    {formatVariantLabel(variant)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    SKU: {variant.sku} | Price: {formatConvertedPrice(variant.salePrice || variant.price || selectedProduct.price)}
                                                    {variant.stock !== undefined && ` | Stock: ${variant.stock}`}
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {selectedVariant && (
                                <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.50' }}>
                                    <Typography variant="subtitle2" gutterBottom>Selected Variant Details</Typography>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 6 }}>
                                            <Typography variant="caption" color="text.secondary">SKU</Typography>
                                            <Typography variant="body2">{selectedVariant.sku}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 6 }}>
                                            <Typography variant="caption" color="text.secondary">Price</Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {formatConvertedPrice(selectedVariant.salePrice || selectedVariant.price || selectedProduct?.price || 0)}
                                            </Typography>
                                        </Grid>
                                        {selectedVariant.weight && (
                                            <Grid size={{ xs: 6 }}>
                                                <Typography variant="caption" color="text.secondary">Weight</Typography>
                                                <Typography variant="body2">{selectedVariant.weight} kg</Typography>
                                            </Grid>
                                        )}
                                        {selectedVariant.stock !== undefined && (
                                            <Grid size={{ xs: 6 }}>
                                                <Typography variant="caption" color="text.secondary">Stock</Typography>
                                                <Typography variant="body2">{selectedVariant.stock}</Typography>
                                            </Grid>
                                        )}
                                        {selectedVariant.attributes && Object.keys(getDisplayAttributes(selectedVariant.attributes)).length > 0 && (
                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="caption" color="text.secondary">Attributes</Typography>
                                                <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                                                    {Object.entries(getDisplayAttributes(selectedVariant.attributes)).map(([key, value]) => (
                                                        <Chip
                                                            key={key}
                                                            label={`${key}: ${value}`}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    ))}
                                                </Box>
                                            </Grid>
                                        )}
                                    </Grid>
                                </Paper>
                            )}

                            <TextField
                                fullWidth
                                label="Quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                inputProps={{ min: 1 }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseVariantDialog}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleAddVariant}
                        disabled={!selectedVariantId}
                    >
                        Add to Order
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
