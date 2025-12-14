'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Button,
    IconButton,
    TextField,
    Typography,
    Grid,
    Card,
    CardMedia,
    CardContent,
    Breadcrumbs,
    Link,
    Chip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Tooltip,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
} from '@mui/material';
import {
    CloudUpload,
    CreateNewFolder,
    GridView,
    ViewList,
    Folder,
    InsertDriveFile,
    MoreVert,
    Edit,
    Delete,
    DriveFileMove,
    Home,
    Image as ImageIcon,
    PictureAsPdf,
    Description,
    Sync,
} from '@mui/icons-material';
import api from '@/lib/api';
import { FileItem } from '@/types/file';
import { useNotification } from '@/contexts/NotificationContext';

interface FileManagerProps {
    mode?: 'embedded' | 'dialog';
    onSelect?: (files: FileItem[]) => void;
    multiple?: boolean;
    accept?: string;
    category?: string;
    initialFolder?: string;
}

export default function FileManager({
    mode = 'embedded',
    onSelect,
    multiple = false,
    accept,
    category,
    initialFolder = '/',
}: FileManagerProps) {
    // Load last visited path from localStorage
    const getInitialFolder = () => {
        if (typeof window === 'undefined') return initialFolder;
        const savedPath = localStorage.getItem('fileManagerLastPath');
        return savedPath || initialFolder;
    };

    const [files, setFiles] = useState<FileItem[]>([]);
    const [currentFolder, setCurrentFolder] = useState(getInitialFolder());
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; file: FileItem } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const { showNotification } = useNotification();

    // Dialog states
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ open: false, title: '', message: '', onConfirm: () => { } });

    const [promptDialog, setPromptDialog] = useState<{
        open: boolean;
        title: string;
        label: string;
        defaultValue: string;
        onConfirm: (value: string) => void;
    }>({ open: false, title: '', label: '', defaultValue: '', onConfirm: () => { } });

    const [promptValue, setPromptValue] = useState('');

    // Fetch files
    const fetchFiles = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { folder: currentFolder };
            if (searchQuery) params.search = searchQuery;
            if (category) params.category = category;

            const response = await api.get('/files', { params });
            setFiles(response.data.files || []);
        } catch (error) {
            showNotification('Failed to load files', 'error');
            setFiles([]);
        } finally {
            setLoading(false);
        }
    }, [currentFolder, searchQuery, category, showNotification]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    // Handle folder navigation
    const navigateToFolder = (folderPath: string) => {
        setCurrentFolder(folderPath);
        setSelectedFiles([]);
        // Save to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('fileManagerLastPath', folderPath);
        }
    };

    // Handle file selection
    const handleFileClick = (file: FileItem) => {
        if (file.type === 'folder') {
            navigateToFolder(file.path);
        } else {
            if (multiple) {
                setSelectedFiles(prev =>
                    prev.find(f => f._id === file._id)
                        ? prev.filter(f => f._id !== file._id)
                        : [...prev, file]
                );
            } else {
                setSelectedFiles([file]);
            }
        }
    };

    // Handle file upload
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const uploadFiles = event.target.files;
        if (!uploadFiles || uploadFiles.length === 0) return;

        setUploading(true);
        const formData = new FormData();

        Array.from(uploadFiles).forEach(file => {
            formData.append('files', file);
        });
        formData.append('folder', currentFolder);

        try {
            await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            showNotification('Files uploaded successfully', 'success');
            fetchFiles();
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Upload failed', 'error');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    // Handle create folder
    const handleCreateFolder = async () => {
        setPromptDialog({
            open: true,
            title: 'Create New Folder',
            label: 'Folder Name',
            defaultValue: '',
            onConfirm: async (name) => {
                if (!name) return;
                try {
                    await api.post('/files/folders', {
                        path: currentFolder,
                        name,
                    });
                    showNotification('Folder created successfully', 'success');
                    fetchFiles();
                } catch (error: any) {
                    showNotification(error.response?.data?.message || 'Failed to create folder', 'error');
                }
            },
        });
        setPromptValue('');
    };

    // Handle rename
    const handleRename = async (file: FileItem) => {
        setPromptDialog({
            open: true,
            title: `Rename ${file.type === 'folder' ? 'Folder' : 'File'}`,
            label: 'New Name',
            defaultValue: file.originalName,
            onConfirm: async (newName) => {
                if (!newName || newName === file.originalName) return;
                try {
                    if (file.type === 'folder') {
                        await api.put(`/files/folders/${file._id}/rename`, { newName });
                    } else {
                        await api.put(`/files/${file._id}/rename`, { newName });
                    }
                    showNotification(`${file.type === 'folder' ? 'Folder' : 'File'} renamed successfully`, 'success');
                    fetchFiles();
                } catch (error: any) {
                    showNotification(error.response?.data?.message || 'Rename failed', 'error');
                }
            },
        });
        setPromptValue(file.originalName);
    };

    // Handle delete
    const handleDelete = async (file: FileItem) => {
        setConfirmDialog({
            open: true,
            title: `Delete ${file.type === 'folder' ? 'Folder' : 'File'}`,
            message: `Are you sure you want to delete "${file.originalName}"? This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    if (file.type === 'folder') {
                        await api.delete(`/files/folders/${file._id}?recursive=true`);
                    } else {
                        await api.delete(`/files/${file._id}`);
                    }
                    showNotification(`${file.type === 'folder' ? 'Folder' : 'File'} deleted successfully`, 'success');
                    fetchFiles();
                } catch (error: any) {
                    showNotification(error.response?.data?.message || 'Delete failed', 'error');
                }
            },
        });
    };

    // Handle sync
    const handleSync = async () => {
        setConfirmDialog({
            open: true,
            title: 'Sync Filesystem',
            message: 'This will scan all files and folders in the upload directory and sync with the database. Continue?',
            onConfirm: async () => {
                setSyncing(true);
                try {
                    const response = await api.post('/files/sync');
                    const stats = response.data.stats;

                    const messages = [];
                    if (stats.filesAdded || stats.foldersAdded) {
                        messages.push(`Added: ${stats.filesAdded} files, ${stats.foldersAdded} folders`);
                    }
                    if (stats.filesRemoved || stats.foldersRemoved) {
                        messages.push(`Removed: ${stats.filesRemoved} files, ${stats.foldersRemoved} folders`);
                    }
                    if (stats.urlsUpdated) {
                        messages.push(`Updated ${stats.urlsUpdated} URLs`);
                    }

                    const message = messages.length > 0
                        ? `Sync completed! ${messages.join('. ')}.`
                        : 'Sync completed! Everything is up to date.';

                    showNotification(message, 'success');
                    fetchFiles();
                } catch (error: any) {
                    showNotification(error.response?.data?.message || 'Sync failed', 'error');
                } finally {
                    setSyncing(false);
                }
            },
        });
    };

    // Context menu handlers
    const handleContextMenu = (event: React.MouseEvent, file: FileItem) => {
        event.preventDefault();
        setContextMenu({
            mouseX: event.clientX - 2,
            mouseY: event.clientY - 4,
            file,
        });
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    // Get breadcrumb paths
    const getBreadcrumbs = () => {
        if (currentFolder === '/') return [{ label: 'Home', path: '/' }];

        const parts = currentFolder.split('/').filter(Boolean);
        const breadcrumbs = [{ label: 'Home', path: '/' }];

        let path = '';
        parts.forEach(part => {
            path += `/${part}`;
            breadcrumbs.push({ label: part, path });
        });

        return breadcrumbs;
    };

    // Get file icon
    const getFileIcon = (file: FileItem) => {
        if (file.type === 'folder') return <Folder color="primary" />;

        if (file.mimeType?.startsWith('image/')) return <ImageIcon color="action" />;
        if (file.mimeType === 'application/pdf') return <PictureAsPdf color="error" />;
        return <Description color="action" />;
    };

    // Format file size
    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Handle select button
    const handleSelectFiles = () => {
        if (onSelect) {
            onSelect(selectedFiles);
        }
    };

    return (
        <Box>
            {/* Toolbar */}
            <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
                <Button
                    variant="outlined"
                    startIcon={<CreateNewFolder />}
                    onClick={handleCreateFolder}
                    size="small"
                >
                    New Folder
                </Button>

                <Button
                    variant="contained"
                    component="label"
                    startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
                    disabled={uploading}
                    size="small"
                >
                    Upload
                    <input
                        type="file"
                        hidden
                        multiple
                        accept={accept}
                        onChange={handleFileUpload}
                    />
                </Button>

                <Button
                    variant="outlined"
                    startIcon={syncing ? <CircularProgress size={20} /> : <Sync />}
                    onClick={handleSync}
                    disabled={syncing}
                    size="small"
                    color="secondary"
                >
                    Sync
                </Button>

                <TextField
                    size="small"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ flexGrow: 1, maxWidth: 300 }}
                />

                <Box display="flex" gap={1}>
                    <Tooltip title="Grid View">
                        <IconButton
                            size="small"
                            color={viewMode === 'grid' ? 'primary' : 'default'}
                            onClick={() => setViewMode('grid')}
                        >
                            <GridView />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="List View">
                        <IconButton
                            size="small"
                            color={viewMode === 'list' ? 'primary' : 'default'}
                            onClick={() => setViewMode('list')}
                        >
                            <ViewList />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Breadcrumbs */}
            <Breadcrumbs sx={{ mb: 2 }}>
                {getBreadcrumbs().map((crumb, index) => (
                    <Link
                        key={index}
                        component="button"
                        variant="body2"
                        onClick={() => navigateToFolder(crumb.path)}
                        sx={{ cursor: 'pointer', textDecoration: 'none' }}
                    >
                        {index === 0 ? <Home sx={{ mr: 0.5, fontSize: 20 }} /> : null}
                        {crumb.label}
                    </Link>
                ))}
            </Breadcrumbs>

            {/* Selected files info */}
            {selectedFiles.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    {selectedFiles.length} file(s) selected
                    {onSelect && (
                        <Button size="small" onClick={handleSelectFiles} sx={{ ml: 2 }}>
                            Select
                        </Button>
                    )}
                </Alert>
            )}

            {/* Loading */}
            {loading && (
                <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                </Box>
            )}

            {/* Files Grid View */}
            {!loading && viewMode === 'grid' && (
                <Grid container spacing={2}>
                    {files.map((file) => (
                        <Grid key={file._id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                            <Card
                                sx={{
                                    cursor: 'pointer',
                                    border: selectedFiles.find(f => f._id === file._id) ? 2 : 0,
                                    borderColor: 'primary.main',
                                    position: 'relative',

                                }}
                                onClick={() => handleFileClick(file)}
                                onContextMenu={(e) => handleContextMenu(e, file)}
                            >
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    height={140}
                                    bgcolor="grey.100"
                                    sx={{ overflow: 'hidden' }}
                                >
                                    {file.type === 'file' && file.mimeType?.startsWith('image/') ? (
                                        <Box
                                            component="img"
                                            src={file.url}
                                            alt={file.originalName}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : (
                                        getFileIcon(file)
                                    )}
                                </Box>
                                <CardContent sx={{ p: 1 }}>
                                    <Typography variant="caption" noWrap title={file.originalName}>
                                        {file.originalName}
                                    </Typography>
                                    {file.size && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {formatFileSize(file.size)}
                                        </Typography>
                                    )}
                                </CardContent>
                                <IconButton
                                    size="small"
                                    sx={{
                                        position: 'absolute', top: 4, right: 4, backgroundColor: 'primary.main', color: 'primary.contrastText', borderRadius: 50,
                                        '&:hover': { backgroundColor: 'primary.dark' }
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleContextMenu(e, file);
                                    }}
                                >
                                    <MoreVert fontSize="small" />
                                </IconButton>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Files List View */}
            {!loading && viewMode === 'list' && (
                <Box>
                    {files.map((file) => (
                        <Box
                            key={file._id}
                            display="flex"
                            alignItems="center"
                            gap={2}
                            p={1}
                            sx={{
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'grey.100' },
                                bgcolor: selectedFiles.find(f => f._id === file._id) ? 'primary.50' : 'transparent',
                            }}
                            onClick={() => handleFileClick(file)}
                            onContextMenu={(e) => handleContextMenu(e, file)}
                        >
                            {getFileIcon(file)}
                            <Typography flexGrow={1}>{file.originalName}</Typography>
                            {file.size && (
                                <Typography variant="body2" color="text.secondary">
                                    {formatFileSize(file.size)}
                                </Typography>
                            )}
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleContextMenu(e, file);
                                }}
                            >
                                <MoreVert fontSize="small" />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            )}

            {/* Empty state */}
            {!loading && files.length === 0 && (
                <Box textAlign="center" py={8}>
                    <Typography variant="h6" color="text.secondary">
                        No files found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Upload files or create a folder to get started
                    </Typography>
                </Box>
            )}

            {/* Context Menu */}
            <Menu
                open={contextMenu !== null}
                onClose={handleCloseContextMenu}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
            >
                <MenuItem onClick={() => {
                    if (contextMenu) handleRename(contextMenu.file);
                    handleCloseContextMenu();
                }}>
                    <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
                    <ListItemText>Rename</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => {
                    if (contextMenu) handleDelete(contextMenu.file);
                    handleCloseContextMenu();
                }}>
                    <ListItemIcon><Delete fontSize="small" /></ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>

            {/* Confirm Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>{confirmDialog.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{confirmDialog.message}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            confirmDialog.onConfirm();
                            setConfirmDialog({ ...confirmDialog, open: false });
                        }}
                        variant="contained"
                        color="primary"
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Prompt Dialog */}
            <Dialog
                open={promptDialog.open}
                onClose={() => setPromptDialog({ ...promptDialog, open: false })}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>{promptDialog.title}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label={promptDialog.label}
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={promptValue}
                        onChange={(e) => setPromptValue(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                promptDialog.onConfirm(promptValue);
                                setPromptDialog({ ...promptDialog, open: false });
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPromptDialog({ ...promptDialog, open: false })}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            promptDialog.onConfirm(promptValue);
                            setPromptDialog({ ...promptDialog, open: false });
                        }}
                        variant="contained"
                        color="primary"
                        disabled={!promptValue.trim()}
                    >
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
