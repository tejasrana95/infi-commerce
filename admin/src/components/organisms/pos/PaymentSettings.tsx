
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
    FormGroup,
    Checkbox,
    TextField,
    InputAdornment,
    Divider,
    Alert,
} from '@mui/material';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { POSSettings, PosPaymentSettings } from '@/types/pos';

interface GatewayConfig {
    _id: string;
    provider: string;
    gatewayName?: string;
    gatewayType?: string;
    isTestMode: boolean;
}

interface PaymentSettingsProps {
    settings: POSSettings;
    gatewayConfigs: GatewayConfig[];
    onChange: (settings: POSSettings) => void;
}

export default function PaymentSettings({ settings, gatewayConfigs, onChange }: PaymentSettingsProps) {
    const paymentSettings = settings.paymentSettings || {
        enabledMethods: { cash: true, card: false, qr: false },
        qrSettings: { mode: 'custom', verification: { mode: 'manual' }, displaySettings: { showAmount: true, instructions: '' } },
        cashSettings: { enableRoundOff: false, roundOffTo: 'nearest10', requireExactAmount: false }
    };

    const handleUpdate = (updatedPaymentSettings: PosPaymentSettings) => {
        onChange({ ...settings, paymentSettings: updatedPaymentSettings });
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Payment Settings
                </Typography>

                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Enabled Methods</Typography>
                <FormGroup row>
                    <FormControlLabel
                        control={<Checkbox checked={paymentSettings.enabledMethods.cash} onChange={(e) => handleUpdate({ ...paymentSettings, enabledMethods: { ...paymentSettings.enabledMethods, cash: e.target.checked } })} />}
                        label="Cash"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={paymentSettings.enabledMethods.card} onChange={(e) => handleUpdate({ ...paymentSettings, enabledMethods: { ...paymentSettings.enabledMethods, card: e.target.checked } })} />}
                        label="Card"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={paymentSettings.enabledMethods.qr} onChange={(e) => handleUpdate({ ...paymentSettings, enabledMethods: { ...paymentSettings.enabledMethods, qr: e.target.checked } })} />}
                        label="QR Code"
                    />
                </FormGroup>

                {/* Cash Settings */}
                {paymentSettings.enabledMethods.cash && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="subtitle1" gutterBottom>Cash Configuration</Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={paymentSettings.cashSettings?.enableRoundOff || false}
                                    onChange={(e) => handleUpdate({
                                        ...paymentSettings,
                                        cashSettings: {
                                            ...paymentSettings.cashSettings,
                                            enableRoundOff: e.target.checked,
                                            roundOffTo: paymentSettings.cashSettings?.roundOffTo || 'nearest10',
                                            requireExactAmount: paymentSettings.cashSettings?.requireExactAmount || false
                                        }
                                    })}
                                />
                            }
                            label="Enable Round-off"
                        />
                        {paymentSettings.cashSettings?.enableRoundOff && (
                            <Box sx={{ mt: 2, ml: 4 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Round Off To</InputLabel>
                                    <Select
                                        value={paymentSettings.cashSettings?.roundOffTo || 'nearest10'}
                                        label="Round Off To"
                                        onChange={(e) => handleUpdate({
                                            ...paymentSettings,
                                            cashSettings: {
                                                ...paymentSettings.cashSettings!,
                                                roundOffTo: e.target.value as any
                                            }
                                        })}
                                    >
                                        <MenuItem value="nearest1">Nearest 1.00</MenuItem>
                                        <MenuItem value="nearest5">Nearest 5.00</MenuItem>
                                        <MenuItem value="nearest10">Nearest 10.00</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        )}
                        <Box sx={{ mt: 1 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={paymentSettings.cashSettings?.requireExactAmount || false}
                                        onChange={(e) => handleUpdate({
                                            ...paymentSettings,
                                            cashSettings: {
                                                ...paymentSettings.cashSettings!,
                                                requireExactAmount: e.target.checked
                                            }
                                        })}
                                    />
                                }
                                label="Require Exact Amount Only"
                            />
                        </Box>
                    </Box>
                )}


                {/* QR Settings */}
                {paymentSettings.enabledMethods.qr && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="subtitle1" gutterBottom>QR Payment Configuration</Typography>

                        <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
                            <InputLabel id="qr-mode-label">Mode</InputLabel>
                            <Select
                                labelId="qr-mode-label"
                                value={paymentSettings.qrSettings?.mode || 'custom'}
                                label="Mode"
                                onChange={(e) => handleUpdate({
                                    ...paymentSettings,
                                    qrSettings: {
                                        ...paymentSettings.qrSettings!,
                                        mode: e.target.value as 'gateway' | 'custom'
                                    }
                                })}
                            >
                                <MenuItem value="gateway">Payment Gateway (Razorpay/Stripe/PayPal)</MenuItem>
                                <MenuItem value="custom">Custom (Static QR)</MenuItem>
                            </Select>
                        </FormControl>

                        {paymentSettings.qrSettings?.mode === 'gateway' && (
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Select Gateway</InputLabel>
                                <Select
                                    value={paymentSettings.qrSettings.gatewayConfig?.gatewayId || ''}
                                    label="Select Gateway"
                                    onChange={(e) => {
                                        const config = gatewayConfigs.find(g => g._id === e.target.value);
                                        handleUpdate({
                                            ...paymentSettings,
                                            qrSettings: {
                                                ...paymentSettings.qrSettings!,
                                                gatewayConfig: {
                                                    gatewayId: e.target.value,
                                                    gatewayType: config?.provider as any
                                                }
                                            }
                                        });
                                    }}
                                >
                                    {gatewayConfigs.map((config) => (
                                        <MenuItem key={config._id} value={config._id}>
                                            {config.gatewayName} - {config.gatewayType} ({config.isTestMode ? 'Test' : 'Live'})
                                        </MenuItem>
                                    ))}
                                </Select>
                                {gatewayConfigs.length === 0 && (
                                    <Typography variant="caption" color="error">
                                        No compatible payment gateways found for this store.
                                    </Typography>
                                )}
                            </FormControl>
                        )}

                        {paymentSettings.qrSettings?.mode === 'custom' && (
                            <Box>
                                <TextField
                                    fullWidth
                                    label="QR Code Image URL"
                                    value={paymentSettings.qrSettings.customConfig?.qrCodeImage || ''}
                                    onChange={(e) => handleUpdate({
                                        ...paymentSettings,
                                        qrSettings: {
                                            ...paymentSettings.qrSettings!,
                                            customConfig: {
                                                ...paymentSettings.qrSettings!.customConfig,
                                                qrCodeImage: e.target.value
                                            }
                                        }
                                    })}
                                    helperText="Enter URL or upload an image"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <FileManagerButton
                                                    onSelect={(files) => {
                                                        if (files.length > 0) {
                                                            handleUpdate({
                                                                ...paymentSettings,
                                                                qrSettings: {
                                                                    ...paymentSettings.qrSettings!,
                                                                    customConfig: {
                                                                        ...paymentSettings.qrSettings!.customConfig,
                                                                        qrCodeImage: files[0].url
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    }}
                                                    accept="image/*"
                                                    category="pos-qr"

                                                />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    fullWidth
                                    label="Instructions"
                                    multiline
                                    rows={2}
                                    value={paymentSettings.qrSettings.displaySettings.instructions || ''}
                                    onChange={(e) => handleUpdate({
                                        ...paymentSettings,
                                        qrSettings: {
                                            ...paymentSettings.qrSettings!,
                                            displaySettings: {
                                                ...paymentSettings.qrSettings!.displaySettings,
                                                instructions: e.target.value
                                            }
                                        }
                                    })}
                                    placeholder="Example: Scan to pay. Show screen to cashier."
                                />
                            </Box>
                        )}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
