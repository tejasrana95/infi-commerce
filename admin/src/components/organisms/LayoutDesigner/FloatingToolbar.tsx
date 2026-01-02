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
    isSaving,
}: FloatingToolbarProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    px: { xs: 2, md: 3 },
                    py: 1.5,
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                }}
            >
                {/* Left Section */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                    <Tooltip title="Back to layouts">
                        <IconButton
                            onClick={onBack}
                            size="small"
                            sx={{
                                bgcolor: 'grey.100',
                                '&:hover': { bgcolor: 'grey.200' },
                                transition: 'all 0.2s',
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
                                    bgcolor: modulesOpen ? 'primary.50' : 'grey.100',
                                    color: modulesOpen ? 'primary.main' : 'text.secondary',
                                    '&:hover': { bgcolor: modulesOpen ? 'primary.100' : 'grey.200' },
                                    transition: 'all 0.2s',
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
                                    fontWeight: 600,
                                    color: 'text.primary',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: { xs: 120, sm: 200, md: 300 },
                                }}
                            >
                                {layoutName}
                            </Box>
                            <Chip
                                label={layoutType}
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    bgcolor: 'primary.50',
                                    color: 'primary.700',
                                    fontWeight: 500,
                                }}
                            />
                            {slug && (
                                <Chip
                                    label={`/${slug}`}
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.7rem',
                                        bgcolor: 'secondary.50',
                                        color: 'secondary.700',
                                        fontFamily: 'monospace',
                                        fontWeight: 500,
                                    }}
                                />
                            )}
                            {isDefault && (
                                <Chip
                                    label="Default"
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.7rem',
                                        bgcolor: 'warning.50',
                                        color: 'warning.700',
                                        fontWeight: 500,
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
                            gap: 0.5,
                            bgcolor: 'grey.100',
                            borderRadius: 1.5,
                            p: 0.5,
                        }}
                    >
                        <Tooltip title="Desktop view">
                            <IconButton
                                size="small"
                                onClick={() => onPreviewChange('desktop')}
                                sx={{
                                    bgcolor: previewDevice === 'desktop' ? 'background.paper' : 'transparent',
                                    color: previewDevice === 'desktop' ? 'primary.main' : 'text.secondary',
                                    boxShadow: previewDevice === 'desktop' ? 1 : 0,
                                    '&:hover': {
                                        bgcolor: previewDevice === 'desktop' ? 'background.paper' : 'grey.200',
                                    },
                                    transition: 'all 0.2s',
                                }}
                            >
                                <DesktopWindowsIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Tablet view">
                            <IconButton
                                size="small"
                                onClick={() => onPreviewChange('tablet')}
                                sx={{
                                    bgcolor: previewDevice === 'tablet' ? 'background.paper' : 'transparent',
                                    color: previewDevice === 'tablet' ? 'primary.main' : 'text.secondary',
                                    boxShadow: previewDevice === 'tablet' ? 1 : 0,
                                    '&:hover': {
                                        bgcolor: previewDevice === 'tablet' ? 'background.paper' : 'grey.200',
                                    },
                                    transition: 'all 0.2s',
                                }}
                            >
                                <TabletIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Mobile view">
                            <IconButton
                                size="small"
                                onClick={() => onPreviewChange('mobile')}
                                sx={{
                                    bgcolor: previewDevice === 'mobile' ? 'background.paper' : 'transparent',
                                    color: previewDevice === 'mobile' ? 'primary.main' : 'text.secondary',
                                    boxShadow: previewDevice === 'mobile' ? 1 : 0,
                                    '&:hover': {
                                        bgcolor: previewDevice === 'mobile' ? 'background.paper' : 'grey.200',
                                    },
                                    transition: 'all 0.2s',
                                }}
                            >
                                <PhoneIphoneIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}

                {/* Right Section */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title="Layout settings">
                        <IconButton
                            onClick={onSettings}
                            size="small"
                            sx={{
                                bgcolor: 'grey.100',
                                '&:hover': { bgcolor: 'grey.200' },
                                transition: 'all 0.2s',
                            }}
                        >
                            <SettingsIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={onSave}
                        disabled={isSaving}
                        size="small"
                        sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 2.5,
                            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                            '&:hover': {
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                            },
                            transition: 'all 0.2s',
                        }}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
