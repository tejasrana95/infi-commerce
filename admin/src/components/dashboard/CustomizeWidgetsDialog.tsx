'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Switch, Typography, Box, List, ListItem,
    ListItemIcon, ListItemText, Divider, Chip, IconButton, Tooltip, Stack
} from '@mui/material';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getAvailableWidgets, DEFAULT_WIDGET_ORDER, WIDGET_REGISTRY } from './widgets/registry';

interface CustomizeWidgetsDialogProps {
    open: boolean;
    onClose: () => void;
    userRole?: string;
    currentOrder: string[];
    currentEnabled: string[];
    onSave: (newOrder: string[], newEnabled: string[]) => void;
    onReset: () => void;
}

export default function CustomizeWidgetsDialog({
    open,
    onClose,
    userRole,
    currentOrder,
    currentEnabled,
    onSave,
    onReset,
}: CustomizeWidgetsDialogProps) {
    const availableWidgets = getAvailableWidgets(userRole);
    const availableIds = availableWidgets.map(w => w.id);

    const [orderedIds, setOrderedIds] = useState<string[]>([]);
    const [enabledSet, setEnabledSet] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (open) {
            // Combine current order with any missing available widget IDs
            const mergedOrder = [
                ...currentOrder.filter(id => availableIds.includes(id)),
                ...availableIds.filter(id => !currentOrder.includes(id))
            ];
            setOrderedIds(mergedOrder);
            setEnabledSet(new Set(currentEnabled.filter(id => availableIds.includes(id))));
        }
    }, [open, currentOrder, currentEnabled, userRole]);

    const handleToggleWidget = (id: string) => {
        const next = new Set(enabledSet);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setEnabledSet(next);
    };

    const handleMoveUp = (index: number) => {
        if (index <= 0) return;
        const copy = [...orderedIds];
        const temp = copy[index - 1];
        copy[index - 1] = copy[index];
        copy[index] = temp;
        setOrderedIds(copy);
    };

    const handleMoveDown = (index: number) => {
        if (index >= orderedIds.length - 1) return;
        const copy = [...orderedIds];
        const temp = copy[index + 1];
        copy[index + 1] = copy[index];
        copy[index] = temp;
        setOrderedIds(copy);
    };

    const handleSave = () => {
        onSave(orderedIds, Array.from(enabledSet));
        onClose();
    };

    const handleResetClick = () => {
        onReset();
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography variant="h6" fontWeight={700}>Customize Dashboard Layout</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Enable, disable, and arrange your dashboard widgets
                    </Typography>
                </Box>
                <Button
                    size="small"
                    color="warning"
                    startIcon={<RestartAltIcon />}
                    onClick={handleResetClick}
                    sx={{ textTransform: 'none' }}
                >
                    Reset to Default
                </Button>
            </DialogTitle>

            <DialogContent dividers>
                <List disablePadding>
                    {orderedIds.map((id, index) => {
                        const widget = WIDGET_REGISTRY[id];
                        if (!widget) return null;
                        const isEnabled = enabledSet.has(id);

                        return (
                            <Box key={id}>
                                <ListItem
                                    sx={{
                                        py: 1.5,
                                        bgcolor: isEnabled ? 'background.paper' : 'action.hover',
                                        borderRadius: 2,
                                        mb: 1,
                                        border: '1px solid',
                                        borderColor: isEnabled ? 'primary.light' : 'divider',
                                    }}
                                >
                                    <Stack direction="column" spacing={0.5} mr={1}>
                                        <IconButton
                                            size="small"
                                            disabled={index === 0}
                                            onClick={() => handleMoveUp(index)}
                                            sx={{ p: 0.2 }}
                                        >
                                            ▲
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            disabled={index === orderedIds.length - 1}
                                            onClick={() => handleMoveDown(index)}
                                            sx={{ p: 0.2 }}
                                        >
                                            ▼
                                        </IconButton>
                                    </Stack>

                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Typography variant="subtitle2" fontWeight={600}>
                                                    {widget.title}
                                                </Typography>
                                                {widget.requiredRole === 'super_admin' && (
                                                    <Chip label="Super Admin" size="small" color="secondary" sx={{ height: 18, fontSize: '0.65rem' }} />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Typography variant="caption" color="text.secondary">
                                                {widget.description}
                                            </Typography>
                                        }
                                    />

                                    <Switch
                                        edge="end"
                                        checked={isEnabled}
                                        onChange={() => handleToggleWidget(id)}
                                        color="primary"
                                    />
                                </ListItem>
                            </Box>
                        );
                    })}
                </List>
            </DialogContent>

            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                    {enabledSet.size} of {availableWidgets.length} widgets enabled
                </Typography>
                <Stack direction="row" spacing={1.5}>
                    <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} variant="contained" startIcon={<CheckCircleIcon />} sx={{ borderRadius: 2 }}>
                        Save Preferences
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
}
