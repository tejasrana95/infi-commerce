'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Grid, IconButton, Tooltip } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { WIDGET_REGISTRY } from './widgets/registry';
import WidgetRenderer from './widgets/WidgetRenderer';

interface SortableWidgetCardProps {
    id: string;
    storeId: string;
    userRole?: string;
    isCustomizing?: boolean;
}

export default function SortableWidgetCard({ id, storeId, userRole, isCustomizing }: SortableWidgetCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        height: '100%',
    };

    const widgetDef = WIDGET_REGISTRY[id];
    if (!widgetDef) return null;

    if (widgetDef.requiredRole === 'super_admin' && userRole !== 'super_admin') {
        return null;
    }

    const gridSize = widgetDef.gridSize || { xs: 12, lg: 6 };

    return (
        <Grid size={gridSize} ref={setNodeRef} style={style}>
            <Box position="relative" height="100%" sx={{ border: isCustomizing ? '2px dashed #6366f1' : 'none', borderRadius: 2, p: isCustomizing ? 0.5 : 0 }}>
                {isCustomizing && (
                    <Box
                        position="absolute"
                        top={8}
                        right={8}
                        zIndex={10}
                        bgcolor="background.paper"
                        borderRadius={1}
                        boxShadow={2}
                        display="flex"
                        alignItems="center"
                    >
                        <Tooltip title="Drag to reorder widget">
                            <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: 'grab' }}>
                                <DragIndicatorIcon color="primary" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
                <WidgetRenderer widgetId={id} storeId={storeId} userRole={userRole} />
            </Box>
        </Grid>
    );
}
