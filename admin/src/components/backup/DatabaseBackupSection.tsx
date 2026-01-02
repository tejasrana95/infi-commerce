'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Alert,
    AlertTitle,
    CircularProgress,
    Paper,
    Chip,
    alpha
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RestoreIcon from '@mui/icons-material/Restore';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import StorageIcon from '@mui/icons-material/Storage';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DescriptionIcon from '@mui/icons-material/Description';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ShieldIcon from '@mui/icons-material/Shield';
import { useConfirm } from '@/contexts/ConfirmContext';

export default function DatabaseBackupSection() {
    const { confirm } = useConfirm();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [toolsAvailable, setToolsAvailable] = useState({ mongodump: false, mongorestore: false });
    const [checkingTools, setCheckingTools] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        checkTools();
    }, []);

    const checkTools = async () => {
        try {
            const token = localStorage.getItem('accesstoken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backup/database/tools`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setToolsAvailable(data);
        } catch (error) {
            console.error('Failed to check tools:', error);
        } finally {
            setCheckingTools(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDownloadDump = async () => {
        const confirmed = await confirm({
            title: 'Create Database Backup',
            message: 'This will create a complete backup of your database including all collections. Continue?',
            confirmLabel: 'Create Backup',
            cancelLabel: 'Cancel'
        });

        if (!confirmed) return;

        setLoading(true);

        try {
            const token = localStorage.getItem('accesstoken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backup/database/dump`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Dump failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mongodb_dump_${new Date().toISOString().split('T')[0]}.archive.gz`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error: any) {
            console.error('Dump error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreDump = async () => {
        if (!file) return;

        const confirmed = await confirm({
            title: '⚠️ CRITICAL WARNING ⚠️',
            message: 'This will REPLACE ALL DATA in your database with the data from the backup file. ALL CURRENT DATA WILL BE LOST. Are you absolutely sure you want to continue?',
            severity: 'error',
            confirmLabel: 'Yes, Restore Database',
            cancelLabel: 'Cancel'
        });

        if (!confirmed) return;

        const doubleConfirmed = await confirm({
            title: 'Final Confirmation',
            message: 'This is your last chance to cancel. Click confirm to proceed with the database restore.',
            severity: 'error',
            confirmLabel: 'Proceed with Restore',
            cancelLabel: 'Cancel'
        });

        if (!doubleConfirmed) return;

        setLoading(true);

        try {
            const token = localStorage.getItem('accesstoken');
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backup/database/restore`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                localStorage.removeItem('accesstoken');
                localStorage.removeItem('adminUser');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            } else {
                throw new Error(data.error || 'Restore failed');
            }
        } catch (error: any) {
            console.error('Restore error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (checkingTools) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary">Checking database tools availability...</Typography>
            </Box>
        );
    }

    if (!toolsAvailable.mongodump && !toolsAvailable.mongorestore) {
        return (
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: alpha('#ef4444', 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <StorageIcon sx={{ color: '#ef4444', fontSize: 26 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>Database Backup</Typography>
                        <Typography variant="body2" color="text.secondary">Full database backup and restore</Typography>
                    </Box>
                </Box>

                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: 2,
                        bgcolor: alpha('#ef4444', 0.08),
                        border: '1px solid',
                        borderColor: alpha('#ef4444', 0.3)
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <CancelIcon sx={{ color: '#ef4444', fontSize: 24, mt: 0.5 }} />
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#991b1b', mb: 1 }}>
                                MongoDB Tools Not Available
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#b91c1c', mb: 2, lineHeight: 1.6 }}>
                                The MongoDB database tools (mongodump and mongorestore) are not installed on this server.
                                Please install MongoDB Database Tools to use this feature.
                            </Typography>
                            <Button
                                variant="contained"
                                color="error"
                                size="small"
                                endIcon={<OpenInNewIcon />}
                                href="https://www.mongodb.com/docs/database-tools/installation/installation/"
                                target="_blank"
                                sx={{ borderRadius: 2 }}
                            >
                                View Installation Instructions
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: alpha('#8b5cf6', 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <StorageIcon sx={{ color: '#8b5cf6', fontSize: 26 }} />
                </Box>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Database Backup & Restore
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create complete database backups or restore from previous snapshots
                    </Typography>
                </Box>
            </Box>

            {/* System Status */}
            <Paper
                variant="outlined"
                sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap'
                }}
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    System Status:
                </Typography>
                <Chip
                    icon={toolsAvailable.mongodump ? <CheckCircleIcon /> : <CancelIcon />}
                    label="mongodump"
                    size="small"
                    color={toolsAvailable.mongodump ? 'success' : 'error'}
                    variant="outlined"
                />
                <Chip
                    icon={toolsAvailable.mongorestore ? <CheckCircleIcon /> : <CancelIcon />}
                    label="mongorestore"
                    size="small"
                    color={toolsAvailable.mongorestore ? 'success' : 'error'}
                    variant="outlined"
                />
            </Paper>

            {/* Critical Warning */}
            <Paper
                elevation={0}
                sx={{
                    mb: 4,
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: alpha('#ef4444', 0.08),
                    border: '1px solid',
                    borderColor: alpha('#ef4444', 0.3),
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2
                }}
            >
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        bgcolor: alpha('#ef4444', 0.15),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}
                >
                    <WarningAmberIcon sx={{ color: '#dc2626', fontSize: 24 }} />
                </Box>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#991b1b', mb: 0.5 }}>
                        Critical Warning
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#b91c1c', lineHeight: 1.6 }}>
                        Database restore will <strong>REPLACE ALL DATA</strong> in your database with the backup content.
                        This action cannot be undone. Always create a backup before restoring from a file.
                    </Typography>
                </Box>
            </Paper>

            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3
            }}>
                {/* Download Backup Card */}
                <Paper
                    variant="outlined"
                    sx={{
                        p: 4,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 3,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.12)'
                        }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
                            }}
                        >
                            <DownloadIcon sx={{ color: 'white', fontSize: 28 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Download Backup
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Full snapshot of MongoDB
                            </Typography>
                        </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flex: 1, lineHeight: 1.7 }}>
                        Create and download a complete archive of your system data. This includes all products, customers, orders, settings, and configurations.
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <ShieldIcon sx={{ color: 'success.main', fontSize: 20 }} />
                        <Typography variant="caption" color="text.secondary">
                            Safe operation • No data will be modified
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                        onClick={handleDownloadDump}
                        disabled={loading || !toolsAvailable.mongodump}
                        sx={{
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: 700,
                            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                            '&:hover': {
                                boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)'
                            }
                        }}
                    >
                        {loading ? 'Creating Backup...' : 'Download Backup'}
                    </Button>

                    {!toolsAvailable.mongodump && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, textAlign: 'center' }}>
                            mongodump utility not available on server
                        </Typography>
                    )}
                </Paper>

                {/* Restore Backup Card */}
                <Paper
                    variant="outlined"
                    sx={{
                        p: 4,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 3,
                        borderColor: alpha('#ef4444', 0.3),
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            borderColor: 'error.main',
                            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.12)'
                        }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
                            }}
                        >
                            <RestoreIcon sx={{ color: 'white', fontSize: 28 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Restore Backup
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Restore from .gz archive
                            </Typography>
                        </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                        Upload a previously created database snapshot (archive) to restore your system to that specific point in time.
                    </Typography>

                    <input
                        id="db-file-upload"
                        ref={fileInputRef}
                        type="file"
                        accept=".gz,.archive.gz"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />

                    <Paper
                        variant="outlined"
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                            p: 2,
                            mb: 3,
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            cursor: 'pointer',
                            borderStyle: 'dashed',
                            borderColor: file ? 'error.main' : 'divider',
                            bgcolor: file ? alpha('#ef4444', 0.04) : 'grey.50',
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                bgcolor: file ? alpha('#ef4444', 0.08) : 'grey.100',
                                borderColor: 'error.main'
                            }
                        }}
                    >
                        {file ? (
                            <>
                                <DescriptionIcon sx={{ color: 'error.main', fontSize: 24 }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }} noWrap>
                                        {file.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Click to change file
                                    </Typography>
                                </Box>
                            </>
                        ) : (
                            <>
                                <CloudUploadIcon sx={{ color: 'text.secondary', fontSize: 24 }} />
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        Choose backup file
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Supports .gz, .archive.gz
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </Paper>

                    <Button
                        variant="contained"
                        color="error"
                        fullWidth
                        size="large"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RestoreIcon />}
                        onClick={handleRestoreDump}
                        disabled={!file || loading || !toolsAvailable.mongorestore}
                        sx={{
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: 700,
                            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                            '&:hover': {
                                boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)'
                            }
                        }}
                    >
                        {loading ? 'Restoring...' : 'Restore Database'}
                    </Button>

                    {!toolsAvailable.mongorestore && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, textAlign: 'center' }}>
                            mongorestore utility not available on server
                        </Typography>
                    )}
                </Paper>
            </Box>
        </Box>
    );
}
