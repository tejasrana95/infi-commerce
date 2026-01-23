'use client';

import { useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Chip,
} from '@mui/material';
import { Download, Print, QrCode2, CheckCircle, Error } from '@mui/icons-material';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import api from '@/lib/api';

interface Product {
    _id: string;
    name: string;
    sku: string;
    barcode?: string;
    barcodeGenerated?: boolean;
}

export default function BulkBarcodeGeneratorPage() {
    const searchParams = useSearchParams();
    const storeId = searchParams.get('storeId');

    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [layout, setLayout] = useState<'2x3' | '3x4' | '4x5'>('3x4');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [generationResults, setGenerationResults] = useState<any[]>([]);

    useEffect(() => {
        if (storeId) {
            fetchProducts();
        }
    }, [storeId]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/products?storeId=${storeId}&limit=100`);
            setProducts(response.data.data.products || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedProducts(products.map((p) => p._id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (productId: string) => {
        setSelectedProducts((prev) =>
            prev.includes(productId)
                ? prev.filter((id) => id !== productId)
                : [...prev, productId]
        );
    };

    const handleBulkGenerate = async () => {
        if (selectedProducts.length === 0) {
            setError('Please select at least one product');
            return;
        }

        try {
            setGenerating(true);
            setError('');
            setSuccess('');

            const response = await api.post('/admin/barcode/bulk-generate', {
                productIds: selectedProducts,
            });

            setGenerationResults(response.data.data);
            setSuccess(`Successfully generated barcodes for ${selectedProducts.length} products!`);

            // Refresh products to show updated barcode status
            fetchProducts();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to generate barcodes');
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerateSheet = async () => {
        if (selectedProducts.length === 0) {
            setError('Please select at least one product');
            return;
        }

        try {
            setGenerating(true);
            setError('');

            const response = await api.post('/admin/barcode/print-batch', {
                productIds: selectedProducts,
                layout,
            });

            // Create printable HTML with the barcode sheet
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                const barcodes = response.data.data.barcodes;
                const cols = layout === '2x3' ? 2 : layout === '3x4' ? 3 : 4;

                let html = `
                    <html>
                        <head>
                            <title>Barcode Sheet - ${layout}</title>
                            <style>
                                body {
                                    margin: 0;
                                    padding: 20px;
                                    font-family: Arial, sans-serif;
                                }
                                .grid {
                                    display: grid;
                                    grid-template-columns: repeat(${cols}, 1fr);
                                    gap: 10px;
                                }
                                .barcode-cell {
                                    border: 1px solid #ddd;
                                    padding: 10px;
                                    text-align: center;
                                    page-break-inside: avoid;
                                }
                                .product-name {
                                    font-size: 12px;
                                    font-weight: bold;
                                    margin-bottom: 5px;
                                }
                                .sku {
                                    font-size: 10px;
                                    color: #666;
                                    margin-bottom: 5px;
                                }
                                img {
                                    max-width: 100%;
                                }
                                @media print {
                                    body { padding: 0; }
                                    @page { margin: 10mm; }
                                }
                            </style>
                        </head>
                        <body>
                            <div class="grid">
                `;

                barcodes.forEach((item: any) => {
                    html += `
                        <div class="barcode-cell">
                            <div class="product-name">${item.name}</div>
                            <div class="sku">SKU: ${item.sku}</div>
                            <img src="data:image/png;base64,${item.image}" alt="${item.barcode}" />
                        </div>
                    `;
                });

                html += `
                            </div>
                        </body>
                    </html>
                `;

                printWindow.document.write(html);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to generate barcode sheet');
        } finally {
            setGenerating(false);
        }
    };

    if (!storeId) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Store ID is required</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    <QrCode2 sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Bulk Barcode Generator
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Generate barcodes for multiple products at once
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            onClick={handleBulkGenerate}
                            disabled={generating || selectedProducts.length === 0}
                            startIcon={generating ? <CircularProgress size={20} /> : <QrCode2 />}
                        >
                            {generating ? 'Generating...' : `Generate (${selectedProducts.length})`}
                        </Button>

                        <FormControl sx={{ minWidth: 120 }}>
                            <InputLabel>Layout</InputLabel>
                            <Select
                                value={layout}
                                label="Layout"
                                onChange={(e) => setLayout(e.target.value as any)}
                            >
                                <MenuItem value="2x3">2 x 3</MenuItem>
                                <MenuItem value="3x4">3 x 4</MenuItem>
                                <MenuItem value="4x5">4 x 5</MenuItem>
                            </Select>
                        </FormControl>

                        <Button
                            variant="outlined"
                            onClick={handleGenerateSheet}
                            disabled={generating || selectedProducts.length === 0}
                            startIcon={<Print />}
                        >
                            Print Sheet
                        </Button>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                        Select products to generate barcodes. Use "Print Sheet" to create a printable
                        page with multiple barcodes.
                    </Typography>
                </CardContent>
            </Card>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={
                                        products.length > 0 &&
                                        selectedProducts.length === products.length
                                    }
                                    indeterminate={
                                        selectedProducts.length > 0 &&
                                        selectedProducts.length < products.length
                                    }
                                    onChange={handleSelectAll}
                                />
                            </TableCell>
                            <TableCell>Product Name</TableCell>
                            <TableCell>SKU</TableCell>
                            <TableCell>Barcode</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    No products found
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product._id}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedProducts.includes(product._id)}
                                            onChange={() => handleSelectProduct(product._id)}
                                        />
                                    </TableCell>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>{product.sku}</TableCell>
                                    <TableCell>{product.barcode || product.sku}</TableCell>
                                    <TableCell>
                                        {product.barcodeGenerated ? (
                                            <Chip
                                                icon={<CheckCircle />}
                                                label="Generated"
                                                color="success"
                                                size="small"
                                            />
                                        ) : (
                                            <Chip label="Not Generated" size="small" />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
