import React, { useState } from 'react';
import { Box, Paper, Typography, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import {
    DesktopWindows as DesktopIcon,
    TabletMac as TabletIcon,
    Smartphone as MobileIcon,
} from '@mui/icons-material';

interface PreviewContainerProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export default function PreviewContainer({ children, title, subtitle, actions }: PreviewContainerProps) {
    const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

    const handleDeviceChange = (event: React.MouseEvent<HTMLElement>, newDevice: 'desktop' | 'tablet' | 'mobile' | null) => {
        if (newDevice !== null) {
            setDevice(newDevice);
        }
    };

    const getWidth = () => {
        switch (device) {
            case 'mobile': return '375px';
            case 'tablet': return '768px';
            default: return '100%';
        }
    };

    return (
        <Paper sx={{ mb: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Toolbar */}
            <Box
                sx={{
                    p: 2,
                    bgcolor: 'grey.100',
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                }}
            >
                <Box>
                    {title && <Typography variant="subtitle2">{title}</Typography>}
                    {subtitle && (
                        <Typography variant="caption" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ToggleButtonGroup
                        value={device}
                        exclusive
                        onChange={handleDeviceChange}
                        size="small"
                        aria-label="device preview"
                    >
                        <ToggleButton value="desktop" aria-label="desktop">
                            <Tooltip title="Desktop View">
                                <DesktopIcon fontSize="small" />
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value="tablet" aria-label="tablet">
                            <Tooltip title="Tablet View">
                                <TabletIcon fontSize="small" />
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value="mobile" aria-label="mobile">
                            <Tooltip title="Mobile View">
                                <MobileIcon fontSize="small" />
                            </Tooltip>
                        </ToggleButton>
                    </ToggleButtonGroup>
                    {actions}
                </Box>
            </Box>

            {/* Preview Area */}
            <Box
                sx={{
                    bgcolor: '#f5f5f5', // Neutral background for canvas
                    p: 3,
                    display: 'flex',
                    justifyContent: 'center',
                    overflowX: 'auto',
                    minHeight: 200,
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        width: getWidth(),
                        minHeight: 100,
                        transition: 'width 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        bgcolor: 'background.paper',
                    }}
                >
                    {children}
                </Paper>
            </Box>
        </Paper>
    );
}
