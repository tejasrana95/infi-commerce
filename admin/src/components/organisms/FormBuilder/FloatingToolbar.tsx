'use client';

import { Box, IconButton, Button, Tooltip, Typography, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';

interface FloatingToolbarProps {
    onBack: () => void;
    onAddSection: () => void;
    onTogglePalette: () => void;
    onToggleProperties: () => void;
    paletteOpen: boolean;
    propertiesOpen: boolean;
}

export default function FloatingToolbar({
    onBack,
    onAddSection,
    onTogglePalette,
    onToggleProperties,
    paletteOpen,
    propertiesOpen,
}: FloatingToolbarProps) {
    return (
        <Box
            sx={{


                width: 'auto',
                minWidth: { xs: '90%', md: 600 },
                display: 'flex',
                justifyContent: 'center',
            }}
        >
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
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    width: '100%',
                }}
            >
                {/* Left Section */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Tooltip title="Back">
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

                    <Tooltip title={paletteOpen ? "Hide Fields" : "Show Fields"}>
                        <IconButton
                            onClick={onTogglePalette}
                            size="small"
                            sx={{
                                bgcolor: paletteOpen ? 'primary.50' : 'grey.100',
                                color: paletteOpen ? 'primary.main' : 'text.secondary',
                                '&:hover': { bgcolor: paletteOpen ? 'primary.100' : 'grey.200' },
                                transition: 'all 0.2s',
                            }}
                        >
                            <ViewSidebarIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ display: { xs: 'none', sm: 'block' } }}>
                            Form Builder
                        </Typography>
                        <Chip
                            label="Modern"
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                bgcolor: 'primary.50',
                                color: 'primary.main',
                                fontWeight: 700,
                                letterSpacing: 0.5
                            }}
                        />
                    </Box>
                </Box>

                {/* Right Section */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title="Toggle Editor">
                        <IconButton
                            onClick={onToggleProperties}
                            size="small"
                            sx={{
                                bgcolor: propertiesOpen ? 'primary.50' : 'grey.100',
                                color: propertiesOpen ? 'primary.main' : 'text.secondary',
                                '&:hover': { bgcolor: propertiesOpen ? 'primary.100' : 'grey.200' },
                                transition: 'all 0.2s',
                            }}
                        >
                            <TuneIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={onAddSection}
                        size="small"
                        sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 2,
                            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
                            '&:hover': {
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                            },
                        }}
                    >
                        Add Section
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
