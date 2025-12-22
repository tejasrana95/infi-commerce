import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    useTheme
} from '@mui/material';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    severity?: 'info' | 'warning' | 'error';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    severity = 'warning'
}) => {
    const theme = useTheme();

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
        >
            <DialogTitle id="confirm-dialog-title">
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="confirm-dialog-description">
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="inherit">
                    {cancelLabel}
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color={severity}
                    autoFocus
                >
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
