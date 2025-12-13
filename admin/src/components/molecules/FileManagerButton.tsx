'use client';

import { useState } from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Box,
} from '@mui/material';
import { Close, AttachFile } from '@mui/icons-material';
import FileManager from '@/components/organisms/FileManager';
import { FileItem } from '@/types/file';

interface FileManagerButtonProps {
    onSelect: (files: FileItem[]) => void;
    multiple?: boolean;
    accept?: string;
    label?: string;
    category?: string;
    initialFolder?: string;
    variant?: 'contained' | 'outlined' | 'text';
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    trigger?: React.ReactNode;
}

export default function FileManagerButton({
    onSelect,
    multiple = false,
    accept,
    label = 'Choose File',
    category,
    initialFolder = '/',
    variant = 'outlined',
    size = 'medium',
    fullWidth = false,
    trigger,
}: FileManagerButtonProps) {
    const [open, setOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setSelectedFiles([]);
    };

    const handleSelect = (files: FileItem[]) => {
        setSelectedFiles(files);
    };

    const handleConfirm = () => {
        onSelect(selectedFiles);
        handleClose();
    };

    return (
        <>
            {trigger ? (
                <Box onClick={handleOpen} sx={{ display: 'inline-block', cursor: 'pointer' }}>
                    {trigger}
                </Box>
            ) : (
                <Button
                    variant={variant}
                    size={size}
                    fullWidth={fullWidth}
                    startIcon={<AttachFile />}
                    onClick={handleOpen}
                >
                    {label}
                </Button>
            )}

            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    Select {multiple ? 'Files' : 'File'}
                    <IconButton
                        onClick={handleClose}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
                    <FileManager
                        mode="dialog"
                        onSelect={handleSelect}
                        multiple={multiple}
                        accept={accept}
                        category={category}
                        initialFolder={initialFolder}
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirm}
                        disabled={selectedFiles.length === 0}
                    >
                        Select ({selectedFiles.length})
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
