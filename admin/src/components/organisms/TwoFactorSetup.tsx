'use client';

import React, { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    Divider,
    TextField,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import GppGoodIcon from '@mui/icons-material/GppGood';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function TwoFactorSetup() {
    const { user, refreshUser, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [showSetupDialog, setShowSetupDialog] = useState(false);
    const [showDisableDialog, setShowDisableDialog] = useState(false);

    const handleInitiate = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/admin/2fa/setup');
            setSetupData(response.data);
            setShowSetupDialog(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to initiate 2FA setup');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/admin/2fa/verify', { code: verificationCode });
            setBackupCodes(response.data.backupCodes);
            setSetupData(null);
            await refreshUser();
            // After successful verification, we stay in the setup dialog to show backup codes
        } catch (err: any) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/admin/2fa/disable', { code: verificationCode });
            setShowDisableDialog(false);
            setVerificationCode('');
            await refreshUser();
            logout();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to disable 2FA');
        } finally {
            setLoading(false);
        }
    };

    const copyBackupCodes = () => {
        navigator.clipboard.writeText(backupCodes.join('\n'));
    };

    const handleCloseSetup = () => {
        if (backupCodes.length > 0) {
            logout();
        } else {
            setShowSetupDialog(false);
            setSetupData(null);
            setVerificationCode('');
            setError('');
        }
    };

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        bgcolor: user?.twoFactorEnabled ? 'success.50' : 'primary.50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {user?.twoFactorEnabled ? (
                        <GppGoodIcon sx={{ color: 'success.main' }} />
                    ) : (
                        <LockIcon sx={{ color: 'primary.main' }} />
                    )}
                </Box>
                <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                        Two-Factor Authentication (2FA)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {user?.twoFactorEnabled
                            ? 'Your account is secured with two-factor authentication.'
                            : 'Add an extra layer of security to your account.'}
                    </Typography>
                </Box>
            </Box>

            {error && !showSetupDialog && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {!user?.twoFactorEnabled ? (
                <Button variant="contained" onClick={handleInitiate} disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Enable 2FA'}
                </Button>
            ) : (
                <Button variant="outlined" color="error" onClick={() => setShowDisableDialog(true)}>
                    Disable 2FA
                </Button>
            )}

            {/* Setup Dialog */}
            <Dialog
                open={showSetupDialog}
                onClose={handleCloseSetup}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {backupCodes.length > 0 ? '2FA Enabled Successfully!' : 'Set Up Two-Factor Authentication'}
                </DialogTitle>
                <DialogContent>
                    {backupCodes.length > 0 ? (
                        <Box>
                            <Box display="flex" alignItems="center" gap={1} mb={2} color="success.main">
                                <CheckCircleIcon />
                                <Typography variant="subtitle1" fontWeight={600}>Success!</Typography>
                            </Box>
                            <Typography variant="body2" mb={2}>
                                Please save these backup codes in a secure place. You can use them to access your account if you lose your authenticator device.
                            </Typography>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                <strong>Note:</strong> You will be logged out automatically after clicking "Done" to finalize the setup.
                            </Alert>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper', mb: 2 }}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {backupCodes.map((code, index) => (
                                        <Box key={index} sx={{ flex: '0 0 calc(50% - 4px)' }}>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                                {code}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Paper>
                            <Button startIcon={<ContentCopyIcon />} onClick={copyBackupCodes} size="small" sx={{ mb: 1 }}>
                                Copy All Codes
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ mt: 1 }}>
                            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                            <Typography variant="body1" mb={2} fontWeight={500}>
                                1. Scan QR Code
                            </Typography>
                            <Typography variant="body2" mb={2} color="text.secondary">
                                Use your authenticator app (like Google Authenticator or Authy) to scan this code.
                            </Typography>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                {setupData?.qrCode && (
                                    <Box
                                        component="img"
                                        src={setupData.qrCode}
                                        alt="QR Code"
                                        sx={{
                                            width: 200,
                                            height: 200,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            p: 1,
                                            borderRadius: 2
                                        }}
                                    />
                                )}
                            </Box>
                            <Typography variant="body1" mb={2} fontWeight={500}>
                                2. Verify Code
                            </Typography>
                            <Typography variant="body2" mb={2} color="text.secondary">
                                Enter the 6-digit verification code from your app.
                            </Typography>
                            <TextField
                                fullWidth
                                label="Verification Code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                sx={{ mb: 2 }}
                                inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' } }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    {backupCodes.length > 0 ? (
                        <Button variant="contained" fullWidth onClick={handleCloseSetup}>
                            Done
                        </Button>
                    ) : (
                        <>
                            <Button onClick={handleCloseSetup} disabled={loading}>Cancel</Button>
                            <Button
                                variant="contained"
                                onClick={handleVerify}
                                disabled={loading || verificationCode.length !== 6}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Verify and Enable'}
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            <Dialog open={showDisableDialog} onClose={() => setShowDisableDialog(false)}>
                <DialogTitle>Disable 2FA</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" mb={2}>
                        Are you sure you want to disable 2FA? This will make your account less secure.
                        Please enter your current 2FA code to confirm.
                    </Typography>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        You will be logged out automatically after disabling 2FA.
                    </Alert>
                    <TextField
                        fullWidth
                        label="2FA Code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        inputProps={{ maxLength: 6 }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setShowDisableDialog(false)}>Cancel</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleDisable}
                        disabled={loading || verificationCode.length !== 6}
                    >
                        Disable 2FA
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
