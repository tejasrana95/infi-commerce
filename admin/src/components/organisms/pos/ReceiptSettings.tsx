
import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    TextField,
    FormControlLabel,
    Switch,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { POSSettings } from '@/types/pos';

interface ReceiptSettingsProps {
    settings: POSSettings;
    onChange: (settings: POSSettings) => void;
}

export default function ReceiptSettings({ settings, onChange }: ReceiptSettingsProps) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Receipt Settings
                </Typography>
                <TextField
                    fullWidth
                    label="Header Text"
                    value={settings.receiptSettings.headerText || ''}
                    onChange={(e) =>
                        onChange({
                            ...settings,
                            receiptSettings: {
                                ...settings.receiptSettings,
                                headerText: e.target.value,
                            },
                        })
                    }
                    placeholder="Thank you for shopping with us!"
                    sx={{ mb: 2, mt: 1 }}
                />

                <TextField
                    fullWidth
                    label="Footer Text"
                    value={settings.receiptSettings.footerText || ''}
                    onChange={(e) =>
                        onChange({
                            ...settings,
                            receiptSettings: {
                                ...settings.receiptSettings,
                                footerText: e.target.value,
                            },
                        })
                    }
                    placeholder="Visit us again!"
                    sx={{ mb: 2 }}
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.receiptSettings.showLogo}
                            onChange={(e) =>
                                onChange({
                                    ...settings,
                                    receiptSettings: {
                                        ...settings.receiptSettings,
                                        showLogo: e.target.checked,
                                    },
                                })
                            }
                        />
                    }
                    label="Show Logo on Receipt"
                />

                <Box sx={{ mt: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel>Paper Width</InputLabel>
                        <Select
                            value={settings.receiptSettings.paperWidth}
                            label="Paper Width"
                            onChange={(e) =>
                                onChange({
                                    ...settings,
                                    receiptSettings: {
                                        ...settings.receiptSettings,
                                        paperWidth: e.target.value as any,
                                    },
                                })
                            }
                        >
                            <MenuItem value="58mm">58mm</MenuItem>
                            <MenuItem value="80mm">80mm (Standard)</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </CardContent>
        </Card>
    );
}
