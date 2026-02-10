import React from 'react';
import { Box, Button, Typography, Slide, Paper, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ReactElement } from 'react';

export interface BulkAction {
    label: string;
    icon: ReactElement;
    color?: 'primary' | 'error' | 'warning' | 'success' | 'info' | 'inherit';
    onClick: () => void;
}

interface BulkActionBarProps {
    selectedCount: number;
    onClear: () => void;
    actions: BulkAction[];
}

export default function BulkActionBar({ selectedCount, onClear, actions }: BulkActionBarProps) {
    return (
        <Slide direction="up" in={selectedCount > 0} mountOnEnter unmountOnExit>
            <Paper
                elevation={8}
                sx={{
                    position: 'sticky',
                    bottom: 16,
                    mt: 2,
                    mx: 'auto',
                    maxWidth: 700,
                    borderRadius: 3,
                    p: 1.5,
                    px: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    zIndex: 10,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {selectedCount} selected
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flex: 1, justifyContent: 'center' }}>
                    {actions.map((action) => (
                        <Button
                            key={action.label}
                            size="small"
                            variant="outlined"
                            color={action.color || 'primary'}
                            startIcon={action.icon}
                            onClick={action.onClick}
                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 500 }}
                        >
                            {action.label}
                        </Button>
                    ))}
                </Box>

                <IconButton size="small" onClick={onClear}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Paper>
        </Slide>
    );
}
