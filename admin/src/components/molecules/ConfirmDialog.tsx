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

export interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    severity?: 'error' | 'warning' | 'info';
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

    const getConfirmColor = () => {
        switch (severity) {
            case 'error': return 'error';
            case 'info': return 'primary';
            case 'warning': return 'warning';
            default: return 'primary';
        }
    };

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
                <Button onClick={onConfirm} color={getConfirmColor()} autoFocus variant="contained">
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
