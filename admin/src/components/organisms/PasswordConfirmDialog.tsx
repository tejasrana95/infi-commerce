'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Alert,
    IconButton,
    InputAdornment,
    Box,
    CircularProgress,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface PasswordConfirmDialogProps {
    open: boolean;
    title?: string;
    message?: string;
    loading?: boolean;
    error?: string | null;
    onConfirm: (password: string) => Promise<void> | void;
    onClose: () => void;
}

export default function PasswordConfirmDialog({
    open,
    title = 'Confirm Order Deletion',
    message = 'This action cannot be undone. All related records including order history, accounting, return requests, and notifications will be permanently deleted. Please enter your Super Admin password to proceed.',
    loading = false,
    error = null,
    onConfirm,
    onClose,
}: PasswordConfirmDialogProps) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setPassword('');
            setShowPassword(false);
            setLocalError(null);
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            setLocalError('Password is required');
            return;
        }
        setLocalError(null);
        await onConfirm(password);
    };

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                    <WarningAmberIcon color="error" />
                    <Typography variant="h6" component="span" fontWeight={600}>
                        {title}
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ mb: 2 }}>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            {message}
                        </Alert>

                        {(error || localError) && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error || localError}
                            </Alert>
                        )}

                        <TextField
                            autoFocus
                            fullWidth
                            type={showPassword ? 'text' : 'password'}
                            label="Super Admin Password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setLocalError(null);
                            }}
                            disabled={loading}
                            required
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            size="small"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={onClose} disabled={loading} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="error"
                        disabled={loading || !password}
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                        {loading ? 'Deleting...' : 'Confirm & Delete'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
