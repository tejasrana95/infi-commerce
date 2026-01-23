'use client';

import { useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { Download, Print, QrCode2 } from '@mui/icons-material';
import api from '@/lib/api';

interface BarcodeGeneratorProps {
    productId: string;
    productName: string;
    sku: string;
    existingBarcode?: string;
}

export default function BarcodeGenerator({
    productId,
    productName,
    sku,
    existingBarcode,
}: BarcodeGeneratorProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [barcodeImage, setBarcodeImage] = useState<string | null>(null);
    const [barcodeText, setBarcodeText] = useState<string | null>(existingBarcode || null);
    const [showPreview, setShowPreview] = useState(false);

    const generateBarcode = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.post('/admin/barcode/generate', {
                productId,
            });

            setBarcodeImage(response.data.data.image);
            setBarcodeText(response.data.data.barcode);
            setShowPreview(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to generate barcode');
        } finally {
            setLoading(false);
        }
    };

    const downloadBarcode = async () => {
        try {
            const response = await api.get(`/admin/barcode/download/${productId}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `barcode-${sku}.png`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err: any) {
            setError('Failed to download barcode');
        }
    };

    const printBarcode = () => {
        if (!barcodeImage) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Barcode - ${productName}</title>
                        <style>
                            body {
                                margin: 0;
                                padding: 20px;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                font-family: Arial, sans-serif;
                            }
                            .product-name {
                                margin-bottom: 10px;
                                font-size: 14px;
                                font-weight: bold;
                            }
                            img {
                                display: block;
                            }
                            @media print {
                                body {
                                    padding: 0;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="product-name">${productName}</div>
                        <img src="${barcodeImage}" alt="Barcode for ${sku}" />
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 250);
        }
    };

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <QrCode2 sx={{ mr: 1 }} />
                    <Typography variant="h6">Barcode Generator</Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {barcodeText && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Barcode generated: <strong>{barcodeText}</strong>
                    </Alert>
                )}

                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Generate a barcode for this product to use with barcode scanners in the POS system.
                </Typography>

                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        onClick={generateBarcode}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <QrCode2 />}
                    >
                        {loading ? 'Generating...' : 'Generate Barcode'}
                    </Button>

                    {barcodeImage && (
                        <>
                            <Button
                                variant="outlined"
                                onClick={() => setShowPreview(true)}
                            >
                                Preview
                            </Button>
                            <IconButton
                                onClick={downloadBarcode}
                                color="primary"
                                title="Download Barcode"
                            >
                                <Download />
                            </IconButton>
                            <IconButton
                                onClick={printBarcode}
                                color="primary"
                                title="Print Barcode"
                            >
                                <Print />
                            </IconButton>
                        </>
                    )}
                </Box>

                {/* Barcode Preview Dialog */}
                <Dialog
                    open={showPreview}
                    onClose={() => setShowPreview(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Barcode Preview</DialogTitle>
                    <DialogContent>
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                {productName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                SKU: {sku}
                            </Typography>
                            {barcodeImage && (
                                <Box sx={{ mt: 2 }}>
                                    <img
                                        src={barcodeImage}
                                        alt={`Barcode for ${sku}`}
                                        style={{ maxWidth: '100%' }}
                                    />
                                </Box>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={downloadBarcode} startIcon={<Download />}>
                            Download
                        </Button>
                        <Button onClick={printBarcode} startIcon={<Print />}>
                            Print
                        </Button>
                        <Button onClick={() => setShowPreview(false)}>Close</Button>
                    </DialogActions>
                </Dialog>
            </CardContent>
        </Card>
    );
}
