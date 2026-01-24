
import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    FormControlLabel,
    Switch,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { POSSettings } from '@/types/pos';

interface GeneralSettingsProps {
    settings: POSSettings;
    onChange: (settings: POSSettings) => void;
}

export default function GeneralSettings({ settings, onChange }: GeneralSettingsProps) {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    General Settings
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.enabled}
                            onChange={(e) =>
                                onChange({ ...settings, enabled: e.target.checked })
                            }
                        />
                    }
                    label="Enable POS System"
                />
                <Box sx={{ mt: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.allowQuickCheckout}
                                onChange={(e) =>
                                    onChange({
                                        ...settings,
                                        allowQuickCheckout: e.target.checked,
                                    })
                                }
                            />
                        }
                        label="Allow Quick Checkout"
                    />
                </Box>
                <Box sx={{ mt: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.requireCustomerDetails}
                                onChange={(e) =>
                                    onChange({
                                        ...settings,
                                        requireCustomerDetails: e.target.checked,
                                    })
                                }
                            />
                        }
                        label="Require Customer Details"
                    />
                </Box>
                <Box sx={{ mt: 3 }}>
                    <FormControl fullWidth>
                        <InputLabel>Default Payment Method</InputLabel>
                        <Select
                            value={settings.defaultPaymentMethod}
                            label="Default Payment Method"
                            onChange={(e) =>
                                onChange({
                                    ...settings,
                                    defaultPaymentMethod: e.target.value as any,
                                })
                            }
                        >
                            <MenuItem value="cash">Cash</MenuItem>
                            <MenuItem value="card">Card</MenuItem>
                            <MenuItem value="qr">QR</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </CardContent>
        </Card>
    );
}
