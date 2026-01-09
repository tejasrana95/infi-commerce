'use client';

import { Box, IconButton, Button, Chip, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import TabletIcon from '@mui/icons-material/Tablet';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';

interface FloatingToolbarProps {
    layoutName: string;
    layoutType: string;
    layoutStatus: 'draft' | 'published';
    isDefault: boolean;
    slug?: string;
    previewDevice: 'desktop' | 'tablet' | 'mobile';
    onPreviewChange: (device: 'desktop' | 'tablet' | 'mobile') => void;
    onBack: () => void;
    onSave: () => void;
    onSettings: () => void;
    onToggleModules?: () => void;
    modulesOpen?: boolean;
    onToggleProperties?: () => void;
    propertiesOpen?: boolean;
    isSaving: boolean;
}

export default function FloatingToolbar({
    layoutName,
    layoutType,
    layoutStatus,
    isDefault,
    slug,
    previewDevice,
    onPreviewChange,
    onBack,
    onSave,
    onSettings,
    onToggleModules,
    modulesOpen = true,
    onToggleProperties,
    propertiesOpen = false,
    isSaving,
}: FloatingToolbarProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                px: { xs: 1.5, sm: 2, md: 3 },
                py: 1.25,
            }}
        >
            {/* Left Section - Logo & Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                <Tooltip title="Back to layouts">
                    <IconButton
                        onClick={onBack}
                        size="small"
                        sx={{
                            color: '#6B7280',
                            transition: 'all 0.2s',
                            '&:hover': {
                                color: '#1F2937',
                                bgcolor: '#F3F4F6',
                            },
                        }}
                    >
                        <ArrowBackIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                {onToggleModules && (
                    <Tooltip title={modulesOpen ? "Hide modules" : "Show modules"}>
                        <IconButton
                            onClick={onToggleModules}
                            size="small"
                            sx={{
                                color: modulesOpen ? '#3B82F6' : '#6B7280',
                                bgcolor: modulesOpen ? '#EFF6FF' : 'transparent',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: modulesOpen ? '#DBEAFE' : '#F3F4F6',
                                    color: '#3B82F6',
                                },
                            }}
                        >
                            <ViewSidebarIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}



                <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Box
                            component="span"
                            sx={{
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                color: '#1F2937',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: { xs: 100, sm: 180, md: 280 },
                            }}
                        >
                            {layoutName}
                        </Box>
                        <Chip
                            label={layoutType}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                bgcolor: '#EFF6FF',
                                color: '#3B82F6',
                                fontWeight: 600,
                                border: '1px solid #BFDBFE',
                            }}
                        />
                        {slug && (
                            <Chip
                                label={`/${slug}`}
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    bgcolor: '#F3E8FF',
                                    color: '#9333EA',
                                    fontFamily: 'monospace',
                                    fontWeight: 600,
                                    border: '1px solid #E9D5FF',
                                }}
                            />
                        )}
                        {layoutStatus === 'draft' && (
                            <Chip
                                label="Draft"
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    bgcolor: '#FEF3C7',
                                    color: '#92400E',
                                    fontWeight: 600,
                                    border: '1px solid #FDE68A',
                                }}
                            />
                        )}
                        {isDefault && (
                            <Chip
                                label="Default"
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    bgcolor: '#DCFCE7',
                                    color: '#15803D',
                                    fontWeight: 600,
                                    border: '1px solid #BBF7D0',
                                }}
                            />
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Center Section - Device Preview */}
            {!isMobile && (
                <Box
                    sx={{
                        display: 'flex',
                        gap: 0.25,
                        bgcolor: '#F3F4F6',
                        borderRadius: 1,
                        p: 0.35,
                        border: '1px solid #E5E7EB',
                    }}
                >
                    <Tooltip title="Desktop view">
                        <IconButton
                            size="small"
                            onClick={() => onPreviewChange('desktop')}
                            sx={{
                                bgcolor: previewDevice === 'desktop' ? '#FFFFFF' : 'transparent',
                                color: previewDevice === 'desktop' ? '#3B82F6' : '#6B7280',
                                boxShadow: previewDevice === 'desktop' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                                '&:hover': {
                                    bgcolor: previewDevice === 'desktop' ? '#FFFFFF' : '#E5E7EB',
                                    color: '#3B82F6',
                                },
                                transition: 'all 0.2s',
                                py: 0.5,
                                px: 0.75,
                            }}
                        >
                            <DesktopWindowsIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Tablet view">
                        <IconButton
                            size="small"
                            onClick={() => onPreviewChange('tablet')}
                            sx={{
                                bgcolor: previewDevice === 'tablet' ? '#FFFFFF' : 'transparent',
                                color: previewDevice === 'tablet' ? '#3B82F6' : '#6B7280',
                                boxShadow: previewDevice === 'tablet' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                                '&:hover': {
                                    bgcolor: previewDevice === 'tablet' ? '#FFFFFF' : '#E5E7EB',
                                    color: '#3B82F6',
                                },
                                transition: 'all 0.2s',
                                py: 0.5,
                                px: 0.75,
                            }}
                        >
                            <TabletIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Mobile view">
                        <IconButton
                            size="small"
                            onClick={() => onPreviewChange('mobile')}
                            sx={{
                                bgcolor: previewDevice === 'mobile' ? '#FFFFFF' : 'transparent',
                                color: previewDevice === 'mobile' ? '#3B82F6' : '#6B7280',
                                boxShadow: previewDevice === 'mobile' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                                '&:hover': {
                                    bgcolor: previewDevice === 'mobile' ? '#FFFFFF' : '#E5E7EB',
                                    color: '#3B82F6',
                                },
                                transition: 'all 0.2s',
                                py: 0.5,
                                px: 0.75,
                            }}
                        >
                            <PhoneIphoneIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            {/* Right Section - Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Layout settings">
                    <IconButton
                        onClick={onSettings}
                        size="small"
                        sx={{
                            color: '#6B7280',
                            transition: 'all 0.2s',
                            '&:hover': {
                                color: '#3B82F6',
                                bgcolor: '#EFF6FF',
                            },
                        }}
                    >
                        <SettingsIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                {onToggleProperties && (
                    <Tooltip title={propertiesOpen ? "Hide properties" : "Show properties"}>
                        <IconButton
                            onClick={onToggleProperties}
                            size="small"
                            sx={{
                                color: propertiesOpen ? '#3B82F6' : '#6B7280',
                                bgcolor: propertiesOpen ? '#EFF6FF' : 'transparent',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: propertiesOpen ? '#DBEAFE' : '#F3F4F6',
                                    color: '#3B82F6',
                                },
                            }}
                        >
                            <ViewSidebarIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={onSave}
                    disabled={isSaving}
                    size="small"
                    sx={{
                        borderRadius: 0.75,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 2.25,
                        py: 0.75,
                        bgcolor: '#3B82F6',
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
                        transition: 'all 0.2s',
                        '&:hover:not(:disabled)': {
                            bgcolor: '#2563EB',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
                        },
                        '&:disabled': {
                            opacity: 0.7,
                        },
                    }}
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </Button>
            </Box>
        </Box>
    );
}
