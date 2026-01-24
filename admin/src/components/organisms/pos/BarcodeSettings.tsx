
import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { POSSettings } from '@/types/pos';

interface BarcodeSettingsProps {
    settings: POSSettings;
    onChange: (settings: POSSettings) => void;
}

export default function BarcodeSettings({ settings, onChange }: BarcodeSettingsProps) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Barcode Settings
                </Typography>
                <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
                    <InputLabel>Barcode Format</InputLabel>
                    <Select
                        value={settings.barcodeSettings.format}
                        label="Barcode Format"
                        onChange={(e) =>
                            onChange({
                                ...settings,
                                barcodeSettings: {
                                    ...settings.barcodeSettings,
                                    format: e.target.value as any,
                                },
                            })
                        }
                    >
                        <MenuItem value="CODE128">CODE128 (Recommended)</MenuItem>
                        <MenuItem value="EAN13">EAN-13</MenuItem>
                        <MenuItem value="QR">QR Code</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    type="number"
                    label="Print Width (mm)"
                    value={settings.barcodeSettings.printWidth}
                    onChange={(e) =>
                        onChange({
                            ...settings,
                            barcodeSettings: {
                                ...settings.barcodeSettings,
                                printWidth: parseInt(e.target.value) || 40,
                            },
                        })
                    }
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    type="number"
                    label="Print Height (mm)"
                    value={settings.barcodeSettings.printHeight}
                    onChange={(e) =>
                        onChange({
                            ...settings,
                            barcodeSettings: {
                                ...settings.barcodeSettings,
                                printHeight: parseInt(e.target.value) || 30,
                            },
                        })
                    }
                />
            </CardContent>
        </Card>
    );
}
