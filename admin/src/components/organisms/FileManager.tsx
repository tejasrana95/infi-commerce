'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Button,
    IconButton,
    TextField,
    Typography,
    Grid,
    Card,
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
    Paper,
    Stack,
    Divider,
    FormControl,
    InputLabel,
    Select,
    ToggleButton,
    ToggleButtonGroup,
    Skeleton,
    InputAdornment,
} from '@mui/material';
import {
    CloudUpload,
    CreateNewFolder,
    GridView,
    ViewList,
    Folder,
    MoreVert,
    Edit,
    Delete,
    Home,
    Image as ImageIcon,
    PictureAsPdf,
    Description,
    Sync,
    Search,
    Visibility,
    OpenInNew,
    ContentCopy,
    Clear,
    SelectAll,
    FilterList,
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

type FileTypeFilter = 'all' | 'folders' | 'images' | 'documents' | 'other';
type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'size-asc' | 'size-desc';

const SEARCHABLE_MIME_DOCUMENT_PREFIXES = ['application/', 'text/'];

interface ApiErrorLike {
    response?: {
        data?: {
            message?: string;
        };
    };
}

export default function FileManager({
    mode = 'embedded',
    onSelect,
    multiple = false,
    accept,
    category,
    initialFolder = '/',
}: FileManagerProps) {
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
    const [pathInput, setPathInput] = useState(getInitialFolder());
    const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [typeFilter, setTypeFilter] = useState<FileTypeFilter>('all');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const { showNotification } = useNotification();

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

    const getErrorMessage = (error: unknown, fallback: string) =>
        (error as ApiErrorLike)?.response?.data?.message || fallback;

    const fetchFiles = useCallback(async () => {
        setLoading(true);
        try {
            const params: { folder: string; search?: string; category?: string } = { folder: currentFolder };
            if (searchQuery) params.search = searchQuery;
            if (category) params.category = category;

            const response = await api.get('/files', { params });
            setFiles(response.data.files || []);
        } catch {
            showNotification('Failed to load files', 'error');
            setFiles([]);
        } finally {
            setLoading(false);
        }
    }, [currentFolder, searchQuery, category, showNotification]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const selectedFileIds = useMemo(() => new Set(selectedFiles.map((f) => f._id)), [selectedFiles]);

    const visibleFiles = useMemo(() => {
        const filtered = files.filter((file) => {
            if (typeFilter === 'all') return true;
            if (typeFilter === 'folders') return file.type === 'folder';
            if (file.type === 'folder') return false;

            if (typeFilter === 'images') return file.mimeType?.startsWith('image/');
            if (typeFilter === 'documents') {
                return !!file.mimeType && SEARCHABLE_MIME_DOCUMENT_PREFIXES.some((prefix) => file.mimeType?.startsWith(prefix));
            }
            return !!file.mimeType && !file.mimeType.startsWith('image/') && !SEARCHABLE_MIME_DOCUMENT_PREFIXES.some((prefix) => file.mimeType?.startsWith(prefix));
        });

        return [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'name-asc':
                    return a.originalName.localeCompare(b.originalName);
                case 'name-desc':
                    return b.originalName.localeCompare(a.originalName);
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'size-asc':
                    return (a.size || 0) - (b.size || 0);
                case 'size-desc':
                    return (b.size || 0) - (a.size || 0);
                case 'newest':
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });
    }, [files, sortBy, typeFilter]);

    const fileStats = useMemo(() => {
        const folderCount = files.filter((f) => f.type === 'folder').length;
        const fileCount = files.length - folderCount;
        const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
        return { folderCount, fileCount, totalSize };
    }, [files]);

    const navigateToFolder = (folderPath: string) => {
        setCurrentFolder(folderPath);
        setPathInput(folderPath);
        setSelectedFiles([]);
        if (typeof window !== 'undefined') {
            localStorage.setItem('fileManagerLastPath', folderPath);
        }
    };

    const normalizePath = (value: string) => {
        let path = value.trim();
        if (!path.startsWith('/')) path = `/${path}`;
        if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);
        return path;
    };

    const handlePathInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            navigateToFolder(normalizePath(pathInput));
        }
    };

    const toggleFileSelection = (file: FileItem) => {
        if (multiple) {
            setSelectedFiles((prev) =>
                prev.find((f) => f._id === file._id)
                    ? prev.filter((f) => f._id !== file._id)
                    : [...prev, file]
            );
            return;
        }
        setSelectedFiles([file]);
    };

    const handleFileClick = (file: FileItem) => {
        if (clickTimer) {
            clearTimeout(clickTimer);
        }

        const timer = setTimeout(() => {
            if (file.type === 'folder') {
                navigateToFolder(file.path);
                return;
            }
            toggleFileSelection(file);
        }, 200);

        setClickTimer(timer);
    };

    const handleFileDoubleClick = (file: FileItem) => {
        if (clickTimer) {
            clearTimeout(clickTimer);
            setClickTimer(null);
        }

        if (file.type === 'folder') {
            navigateToFolder(file.path);
            return;
        }

        if (onSelect) {
            onSelect([file]);
            return;
        }

        setPreviewFile(file);
    };

    const processUpload = async (uploadFiles: FileList | File[]) => {
        if (!uploadFiles || uploadFiles.length === 0) return;

        setUploading(true);
        const formData = new FormData();

        Array.from(uploadFiles).forEach((file) => {
            formData.append('files', file);
        });
        formData.append('folder', currentFolder);

        try {
            await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            showNotification('Files uploaded successfully', 'success');
            fetchFiles();
        } catch (error: unknown) {
            showNotification(getErrorMessage(error, 'Upload failed'), 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            await processUpload(event.target.files);
        }
        event.target.value = '';
    };

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
                } catch (error: unknown) {
                    showNotification(getErrorMessage(error, 'Failed to create folder'), 'error');
                }
            },
        });
        setPromptValue('');
    };

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
                } catch (error: unknown) {
                    showNotification(getErrorMessage(error, 'Rename failed'), 'error');
                }
            },
        });
        setPromptValue(file.originalName);
    };

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
                    setSelectedFiles((prev) => prev.filter((item) => item._id !== file._id));
                } catch (error: unknown) {
                    showNotification(getErrorMessage(error, 'Delete failed'), 'error');
                }
            },
        });
    };

    const handleBulkDelete = async () => {
        const targets = selectedFiles.filter((f) => f.type === 'file');
        if (targets.length === 0) {
            showNotification('Select file(s) to delete', 'info');
            return;
        }

        setConfirmDialog({
            open: true,
            title: `Delete ${targets.length} File(s)`,
            message: `This will permanently delete ${targets.length} selected file(s). Continue?`,
            onConfirm: async () => {
                try {
                    await Promise.all(targets.map((f) => api.delete(`/files/${f._id}`)));
                    showNotification(`${targets.length} file(s) deleted successfully`, 'success');
                    setSelectedFiles([]);
                    fetchFiles();
                } catch {
                    showNotification('Some files could not be deleted', 'error');
                    fetchFiles();
                }
            },
        });
    };

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
                } catch (error: unknown) {
                    showNotification(getErrorMessage(error, 'Sync failed'), 'error');
                } finally {
                    setSyncing(false);
                }
            },
        });
    };

    const handleSelectVisibleFiles = () => {
        const selectable = visibleFiles.filter((f) => f.type === 'file');
        setSelectedFiles(selectable);
    };

    const handleCopyLink = async (file: FileItem) => {
        try {
            await navigator.clipboard.writeText(file.url);
            showNotification('File URL copied', 'success');
        } catch {
            showNotification('Failed to copy URL', 'error');
        }
    };

    const handleOpenExternal = (file: FileItem) => {
        window.open(file.url, '_blank', 'noopener,noreferrer');
    };

    const handleContextMenu = (event: React.MouseEvent, file: FileItem) => {
        event.preventDefault();
        setContextMenu({
            mouseX: event.clientX - 2,
            mouseY: event.clientY - 4,
            file,
        });
    };

    const getBreadcrumbs = () => {
        if (currentFolder === '/') return [{ label: 'Home', path: '/' }];

        const parts = currentFolder.split('/').filter(Boolean);
        const breadcrumbs = [{ label: 'Home', path: '/' }];

        let path = '';
        parts.forEach((part) => {
            path += `/${part}`;
            breadcrumbs.push({ label: part, path });
        });

        return breadcrumbs;
    };

    const getFileIcon = (file: FileItem) => {
        if (file.type === 'folder') return <Folder color="primary" />;
        if (file.mimeType?.startsWith('image/')) return <ImageIcon color="action" />;
        if (file.mimeType === 'application/pdf') return <PictureAsPdf color="error" />;
        return <Description color="action" />;
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '0 B';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleSelectFiles = () => {
        if (onSelect) {
            onSelect(selectedFiles);
        }
    };

    const gridColumns = mode === 'dialog' ? { xs: 6, sm: 4, md: 3 } : { xs: 6, sm: 4, md: 3, lg: 2.4 };

    return (
        <Paper
            elevation={0}
            onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
            }}
            onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
            }}
            onDrop={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    await processUpload(e.dataTransfer.files);
                }
            }}
            sx={{
                position: 'relative',
                minHeight: 460,
                border: '1px solid',
                borderColor: isDragging ? 'primary.main' : 'divider',
                borderStyle: isDragging ? 'dashed' : 'solid',
                borderRadius: 2,
                background: 'linear-gradient(180deg, rgba(25,118,210,0.04) 0%, rgba(25,118,210,0.01) 130px, transparent 320px)',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
            }}
        >
            {isDragging && (
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        bgcolor: 'rgba(25, 118, 210, 0.1)',
                        zIndex: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                    }}
                >
                    <Stack alignItems="center" spacing={1}>
                        <CloudUpload sx={{ fontSize: 54, color: 'primary.main' }} />
                        <Typography variant="h6" color="primary.main">
                            Drop files to upload
                        </Typography>
                    </Stack>
                </Box>
            )}

            <Box p={{ xs: 1.5, sm: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" mb={2}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="h6" fontWeight={700}>File Manager</Typography>
                        <Chip size="small" variant="outlined" label={`${fileStats.fileCount} files`} />
                        <Chip size="small" variant="outlined" label={`${fileStats.folderCount} folders`} />
                        <Chip size="small" color="primary" label={formatFileSize(fileStats.totalSize)} />
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
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
                    </Stack>
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} mb={2}>
                    <Button variant="outlined" startIcon={<CreateNewFolder />} onClick={handleCreateFolder} size="small">
                        New Folder
                    </Button>

                    <Button
                        variant="contained"
                        component="label"
                        startIcon={uploading ? <CircularProgress size={16} /> : <CloudUpload />}
                        disabled={uploading}
                        size="small"
                    >
                        Upload
                        <input type="file" hidden multiple accept={accept} onChange={handleFileUpload} />
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={syncing ? <CircularProgress size={16} /> : <Sync />}
                        onClick={handleSync}
                        disabled={syncing}
                        size="small"
                    >
                        Sync
                    </Button>

                    {multiple && (
                        <Button variant="outlined" startIcon={<SelectAll />} size="small" onClick={handleSelectVisibleFiles}>
                            Select Visible
                        </Button>
                    )}

                    <Button
                        variant="text"
                        size="small"
                        startIcon={<Clear />}
                        disabled={selectedFiles.length === 0}
                        onClick={() => setSelectedFiles([])}
                    >
                        Clear Selection
                    </Button>
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} mb={2}>
                    <TextField
                        size="small"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ flex: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel id="type-filter-label">Type</InputLabel>
                        <Select
                            labelId="type-filter-label"
                            label="Type"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as FileTypeFilter)}
                            startAdornment={<FilterList sx={{ mr: 1, color: 'action.active' }} />}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="folders">Folders</MenuItem>
                            <MenuItem value="images">Images</MenuItem>
                            <MenuItem value="documents">Documents</MenuItem>
                            <MenuItem value="other">Other Files</MenuItem>
                        </Select>
                    </FormControl>

                    <ToggleButtonGroup
                        value={sortBy}
                        exclusive
                        size="small"
                        onChange={(_, value: SortOption | null) => {
                            if (value) setSortBy(value);
                        }}
                    >
                        <ToggleButton value="newest">Newest</ToggleButton>
                        <ToggleButton value="name-asc">A-Z</ToggleButton>
                        <ToggleButton value="size-desc">Size</ToggleButton>
                    </ToggleButtonGroup>
                </Stack>

                <TextField
                    size="small"
                    fullWidth
                    placeholder="Enter path (example: /catalog/products)"
                    value={pathInput}
                    onChange={(e) => setPathInput(e.target.value)}
                    onKeyDown={handlePathInputSubmit}
                    sx={{ mb: 1.5 }}
                />

                <Breadcrumbs sx={{ mb: 2 }}>
                    {getBreadcrumbs().map((crumb, index) => (
                        <Link
                            key={crumb.path}
                            component="button"
                            variant="body2"
                            onClick={() => navigateToFolder(crumb.path)}
                            sx={{
                                cursor: 'pointer',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                            }}
                        >
                            {index === 0 ? <Home sx={{ fontSize: 18 }} /> : null}
                            {crumb.label}
                        </Link>
                    ))}
                </Breadcrumbs>

                {selectedFiles.length > 0 && (
                    <Alert
                        severity="info"
                        sx={{ mb: 2 }}
                        action={
                            <Stack direction="row" spacing={1}>
                                {selectedFiles.length === 1 && selectedFiles[0].type === 'file' && (
                                    <>
                                        <Button
                                            size="small"
                                            onClick={() => setPreviewFile(selectedFiles[0])}
                                            startIcon={<Visibility />}
                                        >
                                            Preview
                                        </Button>
                                        <Button
                                            size="small"
                                            onClick={() => handleCopyLink(selectedFiles[0])}
                                            startIcon={<ContentCopy />}
                                        >
                                            Copy URL
                                        </Button>
                                    </>
                                )}
                                {selectedFiles.length > 0 && (
                                    <Button size="small" color="error" onClick={handleBulkDelete} startIcon={<Delete />}>
                                        Delete
                                    </Button>
                                )}
                                {onSelect && (
                                    <Button size="small" variant="contained" onClick={handleSelectFiles}>
                                        Select ({selectedFiles.length})
                                    </Button>
                                )}
                            </Stack>
                        }
                    >
                        {selectedFiles.length} item(s) selected
                    </Alert>
                )}

                {loading && (
                    <Grid container spacing={1.5}>
                        {Array.from({ length: 8 }).map((_, index) => (
                            <Grid key={index} size={gridColumns}>
                                <Skeleton variant="rounded" height={130} />
                                <Skeleton sx={{ mt: 1 }} />
                                <Skeleton width="60%" />
                            </Grid>
                        ))}
                    </Grid>
                )}

                {!loading && viewMode === 'grid' && (
                    <Grid container spacing={1.5}>
                        {visibleFiles.map((file) => {
                            const selected = selectedFileIds.has(file._id);

                            return (
                                <Grid key={file._id} size={gridColumns}>
                                    <Card
                                        sx={{
                                            cursor: 'pointer',
                                            border: '1px solid',
                                            borderColor: selected ? 'primary.main' : 'divider',
                                            boxShadow: selected ? '0 0 0 1px rgba(25,118,210,0.25)' : 'none',
                                            transition: 'all 0.18s ease',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 8px 20px rgba(15,23,42,0.08)',
                                            },
                                            position: 'relative',
                                        }}
                                        onClick={() => handleFileClick(file)}
                                        onDoubleClick={() => handleFileDoubleClick(file)}
                                        onContextMenu={(e) => handleContextMenu(e, file)}
                                    >
                                        <Box
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            height={130}
                                            bgcolor="grey.100"
                                            sx={{ overflow: 'hidden' }}
                                        >
                                            {file.type === 'file' && file.mimeType?.startsWith('image/') ? (
                                                <Box
                                                    component="img"
                                                    src={file.url}
                                                    alt={file.originalName}
                                                    loading="lazy"
                                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                getFileIcon(file)
                                            )}
                                        </Box>

                                        <CardContent sx={{ p: 1.2 }}>
                                            <Typography variant="body2" noWrap title={file.originalName} fontWeight={500}>
                                                {file.originalName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                                {file.type === 'folder' ? 'Folder' : formatFileSize(file.size)}
                                            </Typography>
                                        </CardContent>

                                        <IconButton
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: 6,
                                                right: 6,
                                                backgroundColor: 'rgba(0,0,0,0.5)',
                                                color: '#fff',
                                                '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
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
                            );
                        })}
                    </Grid>
                )}

                {!loading && viewMode === 'list' && (
                    <Paper variant="outlined">
                        {visibleFiles.map((file, index) => (
                            <Box key={file._id}>
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    gap={1.5}
                                    p={1.25}
                                    sx={{
                                        cursor: 'pointer',
                                        bgcolor: selectedFileIds.has(file._id) ? 'action.selected' : 'transparent',
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                    onClick={() => handleFileClick(file)}
                                    onDoubleClick={() => handleFileDoubleClick(file)}
                                    onContextMenu={(e) => handleContextMenu(e, file)}
                                >
                                    {getFileIcon(file)}
                                    <Box flex={1} minWidth={0}>
                                        <Typography noWrap fontWeight={500}>{file.originalName}</Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap>
                                            {file.type === 'folder' ? 'Folder' : file.mimeType || 'File'}
                                        </Typography>
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 70, textAlign: 'right' }}>
                                        {file.type === 'folder' ? '-' : formatFileSize(file.size)}
                                    </Typography>

                                    {file.type === 'file' && (
                                        <Tooltip title="Open">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenExternal(file);
                                                }}
                                            >
                                                <OpenInNew fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
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
                                {index < visibleFiles.length - 1 && <Divider />}
                            </Box>
                        ))}
                    </Paper>
                )}

                {!loading && visibleFiles.length === 0 && (
                    <Box textAlign="center" py={8}>
                        <Typography variant="h6" color="text.secondary">
                            No files found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Try changing filters, searching less, or upload files here.
                        </Typography>
                    </Box>
                )}
            </Box>

            <Menu
                open={contextMenu !== null}
                onClose={() => setContextMenu(null)}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
            >
                {contextMenu?.file.type === 'file' && (
                    <MenuItem
                        onClick={() => {
                            if (contextMenu) setPreviewFile(contextMenu.file);
                            setContextMenu(null);
                        }}
                    >
                        <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
                        <ListItemText>Preview</ListItemText>
                    </MenuItem>
                )}
                {contextMenu?.file.type === 'file' && (
                    <MenuItem
                        onClick={() => {
                            if (contextMenu) handleCopyLink(contextMenu.file);
                            setContextMenu(null);
                        }}
                    >
                        <ListItemIcon><ContentCopy fontSize="small" /></ListItemIcon>
                        <ListItemText>Copy URL</ListItemText>
                    </MenuItem>
                )}
                <MenuItem onClick={() => {
                    if (contextMenu) handleRename(contextMenu.file);
                    setContextMenu(null);
                }}>
                    <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
                    <ListItemText>Rename</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => {
                    if (contextMenu) handleDelete(contextMenu.file);
                    setContextMenu(null);
                }}>
                    <ListItemIcon><Delete fontSize="small" /></ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>

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
                    <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Cancel</Button>
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
                        onChange={(e) => setPromptValue(e.target.value.replace(/\s/g, '-'))}
                        onKeyDown={(e) => {
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

            <Dialog
                open={!!previewFile}
                onClose={() => setPreviewFile(null)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ pr: 8 }}>{previewFile?.originalName}</DialogTitle>
                <DialogContent dividers>
                    {previewFile?.mimeType?.startsWith('image/') ? (
                        <Box
                            component="img"
                            src={previewFile.url}
                            alt={previewFile.originalName}
                            sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }}
                        />
                    ) : (
                        <Box py={4} textAlign="center">
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                Preview not available for this file type.
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<OpenInNew />}
                                onClick={() => previewFile && handleOpenExternal(previewFile)}
                            >
                                Open File
                            </Button>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        startIcon={<ContentCopy />}
                        onClick={() => previewFile && handleCopyLink(previewFile)}
                    >
                        Copy URL
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<OpenInNew />}
                        onClick={() => previewFile && handleOpenExternal(previewFile)}
                    >
                        Open
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}
