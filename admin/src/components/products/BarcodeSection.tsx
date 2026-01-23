'use client';

import { useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Stack,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    Divider,
    Grid,
} from '@mui/material';
import { Download, Printer, QrCode } from 'lucide-react';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';

interface BarcodeSectionProps {
    productId: string;
    productName: string;
    sku: string;
}

type BarcodeFormat = 'CODE128' | 'EAN13' | 'QR';

interface GeneratedBarcode {
    name: string;
    sku: string;
    barcode: string;
    image: string; // base64 data URL
}

export default function BarcodeSection({ productId, productName, sku }: BarcodeSectionProps) {
    const [format, setFormat] = useState<BarcodeFormat>('CODE128');
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState<GeneratedBarcode[]>([]);
    const { showNotification } = useNotification();

    const handleGenerate = async () => {
        try {
            setLoading(true);
            const response = await api.post('/barcode/generate', {
                productId,
                format: format === 'EAN13' ? 'ean13' : format === 'CODE128' ? 'code128' : 'qrcode',
            });

            if (response.data.success) {
                setGenerated(response.data.data);
                showNotification('Barcode generated successfully', 'success');
            }
        } catch (error: any) {
            showNotification(
                error.response?.data?.message || 'Failed to generate barcode',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPNG = (barcode: GeneratedBarcode) => {
        const link = document.createElement('a');
        link.href = barcode.image;
        link.download = `barcode-${barcode.sku}.png`;
        link.click();
        showNotification('Barcode downloaded successfully', 'success');
    };

    const handlePrint = () => {
        if (generated.length === 0) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showNotification('Failed to open print window', 'error');
            return;
        }

        const barcodesHtml = generated.map(bc => `
            <div class="barcode-container">
                <div class="product-name">${bc.name}</div>
                <div class="sku">SKU: ${bc.sku}</div>
                <img src="${bc.image}" alt="Barcode" class="barcode-image" />
                <div class="barcode-value">${bc.barcode}</div>
            </div>
        `).join('');

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${productName} - Barcodes</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 20px;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .barcode-container {
            text-align: center;
            padding: 20px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            max-width: 300px;
            page-break-inside: avoid;
          }
          .product-name {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 4px;
            color: #1f2937;
          }
          .sku {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 10px;
          }
          .barcode-image {
            margin: 10px 0;
            max-width: 100%;
            height: auto;
          }
          .barcode-value {
            font-size: 12px;
            color: #1f2937;
            margin-top: 8px;
            font-family: monospace;
            letter-spacing: 1px;
            font-weight: 600;
          }
          @media print {
            body { background: white; }
          }
        </style>
      </head>
      <body>
        ${barcodesHtml}
      </body>
      </html>
    `);

        printWindow.document.close();
        printWindow.print();
        showNotification('Print dialog opened', 'success');
    };

    return (
        <Card>
            <CardHeader
                title="Product Barcode"
                subheader="Generate and print barcode labels"
            />
            <CardContent>
                <Stack spacing={3}>
                    {/* Format Selector */}
                    <FormControl fullWidth size="small">
                        <InputLabel>Barcode Format</InputLabel>
                        <Select
                            value={format}
                            onChange={(e) => setFormat(e.target.value as BarcodeFormat)}
                            label="Barcode Format"
                        >
                            <MenuItem value="CODE128">CODE 128</MenuItem>
                            <MenuItem value="EAN13">EAN-13</MenuItem>
                            <MenuItem value="QR">QR Code</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Generate Button */}
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleGenerate}
                        disabled={loading}
                        startIcon={loading ? null : <QrCode size={18} />}
                    >
                        {loading ? 'Generating...' : 'Generate Barcode'}
                    </Button>

                    {/* Preview */}
                    {generated.length > 0 && (
                        <>
                            <Divider />
                            <Typography variant="subtitle2" color="text.secondary">
                                {generated.length > 1
                                    ? `${generated.length} Variant Barcodes Generated`
                                    : 'Barcode Generated'}
                            </Typography>
                            <Grid container spacing={2}>
                                {generated.map((bc, index) => (
                                    <Grid key={index} size={{ xs: 12, sm: generated.length > 1 ? 6 : 12 }}>
                                        <Paper
                                            sx={{
                                                p: 2,
                                                backgroundColor: '#f9fafb',
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 1,
                                            }}
                                        >
                                            <Typography variant="body2" fontWeight={600} color="text.primary" textAlign="center">
                                                {bc.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                SKU: {bc.sku}
                                            </Typography>
                                            <Box
                                                component="img"
                                                src={bc.image}
                                                alt="Barcode"
                                                sx={{ maxWidth: '100%', height: 'auto', my: 1 }}
                                            />
                                            <Typography
                                                variant="caption"
                                                fontWeight={600}
                                                sx={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                                            >
                                                {bc.barcode}
                                            </Typography>
                                            <Button
                                                size="small"
                                                variant="text"
                                                startIcon={<Download size={14} />}
                                                onClick={() => handleDownloadPNG(bc)}
                                            >
                                                Download
                                            </Button>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>

                            {/* Action Buttons */}
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<Printer size={18} />}
                                onClick={handlePrint}
                                disabled={loading}
                            >
                                Print All
                            </Button>
                        </>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}
