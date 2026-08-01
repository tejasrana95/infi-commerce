'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Grid, FormControl,
  Select, MenuItem, InputLabel, Tooltip, Stack, Chip, CircularProgress, IconButton
} from '@mui/material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TuneIcon from '@mui/icons-material/Tune';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import {
  getAvailableWidgets,
  DEFAULT_WIDGET_ORDER,
  WIDGET_REGISTRY,
} from '@/components/dashboard/widgets/registry';
import SortableWidgetCard from '@/components/dashboard/SortableWidgetCard';
import CustomizeWidgetsDialog from '@/components/dashboard/CustomizeWidgetsDialog';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const userRole = user?.role;
  const canSelectStore = userRole === 'super_admin' || userRole === 'admin';

  // Store selection state
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');

  // Widget Preferences State
  const [widgetOrder, setWidgetOrder] = useState<string[]>(DEFAULT_WIDGET_ORDER);
  const [enabledWidgets, setEnabledWidgets] = useState<string[]>(DEFAULT_WIDGET_ORDER);
  const [prefLoading, setPrefLoading] = useState<boolean>(true);
  const [customizeOpen, setCustomizeOpen] = useState<boolean>(false);
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);

  // Configure Sensors for DndKit
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch stores for admin dropdown
  const fetchStores = useCallback(async () => {
    try {
      const response = await api.get('/stores');
      setStores(response.data.data || response.data.stores || []);
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    }
  }, []);

  // Fetch User Preferences
  const fetchPreferences = useCallback(async () => {
    setPrefLoading(true);
    try {
      const res = await api.get('/dashboard/preferences');
      const savedPref = res.data.preferences;
      const available = getAvailableWidgets(userRole);
      const availableIds = available.map(w => w.id);

      if (savedPref && Array.isArray(savedPref.widgetOrder) && Array.isArray(savedPref.enabledWidgets)) {
        // Merge saved preferences with any newly added system widgets
        const mergedOrder = [
          ...savedPref.widgetOrder.filter((id: string) => availableIds.includes(id)),
          ...availableIds.filter((id: string) => !savedPref.widgetOrder.includes(id))
        ];
        const validEnabled = savedPref.enabledWidgets.filter((id: string) => availableIds.includes(id));

        setWidgetOrder(mergedOrder);
        // If validEnabled is empty, fallback to default (all available) instead of showing blank dashboard
        setEnabledWidgets(validEnabled.length > 0 ? validEnabled : availableIds);
      } else {
        setWidgetOrder(availableIds);
        setEnabledWidgets(availableIds);
      }
    } catch (err) {
      console.error('Failed to load user dashboard preferences:', err);
      const availableIds = getAvailableWidgets(userRole).map(w => w.id);
      setWidgetOrder(availableIds);
      setEnabledWidgets(availableIds);
    } finally {
      setPrefLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    if (canSelectStore) {
      fetchStores();
    }
  }, [canSelectStore, fetchStores]);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [fetchPreferences, user]);

  // Save Preferences API
  const savePreferences = async (newOrder: string[], newEnabled: string[]) => {
    // If no widget is selected/enabled, fallback to default (all available widgets)
    const availableIds = getAvailableWidgets(userRole).map(w => w.id);
    const finalEnabled = newEnabled.length > 0 ? newEnabled : availableIds;

    setWidgetOrder(newOrder);
    setEnabledWidgets(finalEnabled);
    try {
      await api.put('/dashboard/preferences', {
        widgetOrder: newOrder,
        enabledWidgets: finalEnabled,
      });
      showNotification(
        newEnabled.length === 0
          ? 'No widgets selected. Restored default widgets.'
          : 'Dashboard layout updated & saved',
        newEnabled.length === 0 ? 'info' : 'success'
      );
    } catch (err) {
      console.error('Failed to save dashboard preferences:', err);
      showNotification('Failed to save layout preferences', 'error');
    }
  };

  // Reset Preferences API
  const resetPreferences = async () => {
    try {
      await api.post('/dashboard/preferences/reset');
      const availableIds = getAvailableWidgets(userRole).map(w => w.id);
      setWidgetOrder(availableIds);
      setEnabledWidgets(availableIds);
      showNotification('Dashboard reset to default layout', 'success');
    } catch (err) {
      console.error('Failed to reset dashboard preferences:', err);
      showNotification('Failed to reset preferences', 'error');
    }
  };

  // Drag and Drop Handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = widgetOrder.indexOf(active.id as string);
      const newIndex = widgetOrder.indexOf(over.id as string);
      const newOrder = arrayMove(widgetOrder, oldIndex, newIndex);
      savePreferences(newOrder, enabledWidgets);
    }
  };

  // Visible Widgets calculation with fallback to defaults if empty
  const availableWidgetIds = getAvailableWidgets(userRole).map(w => w.id);
  const userActiveWidgetIds = widgetOrder.filter(id => enabledWidgets.includes(id) && availableWidgetIds.includes(id));
  const activeWidgetIds = userActiveWidgetIds.length > 0 ? userActiveWidgetIds : availableWidgetIds;

  if (prefLoading) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress size={36} />
      </Box>
    );
  }

  return (
    <Box pb={4}>
      {/* Page Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Box>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Typography variant="h4" fontWeight={700}>
              Dashboard
            </Typography>
            {isCustomizing && (
              <Chip label="Drag to Reorder Active" color="primary" variant="outlined" size="small" />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Welcome back, {user?.firstName}! Customize your workspace layout and preferences.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          {canSelectStore && (
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="store-selector-label">Select Store</InputLabel>
              <Select
                labelId="store-selector-label"
                value={selectedStoreId}
                label="Select Store"
                onChange={(e) => setSelectedStoreId(e.target.value)}
                sx={{ borderRadius: '8px', bgcolor: 'background.paper' }}
              >
                <MenuItem value="all">All Stores</MenuItem>
                {stores.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Button
            variant={isCustomizing ? 'contained' : 'outlined'}
            color={isCustomizing ? 'primary' : 'inherit'}
            startIcon={<DragIndicatorIcon />}
            onClick={() => setIsCustomizing(!isCustomizing)}
            sx={{ borderRadius: '8px', textTransform: 'none', height: '40px' }}
          >
            {isCustomizing ? 'Done Dragging' : 'Drag Layout'}
          </Button>

          <Button
            variant="outlined"
            startIcon={<TuneIcon />}
            onClick={() => setCustomizeOpen(true)}
            sx={{ borderRadius: '8px', textTransform: 'none', height: '40px' }}
          >
            Configure Widgets
          </Button>

          <Tooltip title="Reset dashboard to default order">
            <IconButton
              onClick={resetPreferences}
              color="warning"
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', height: '40px', width: '40px' }}
            >
              <RestartAltIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Customizable Drag-and-Drop Dashboard Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={activeWidgetIds} strategy={rectSortingStrategy}>
          <Grid container spacing={3}>
            {activeWidgetIds.map((widgetId) => (
              <SortableWidgetCard
                key={widgetId}
                id={widgetId}
                storeId={canSelectStore ? selectedStoreId : (user?.storeIds?.[0] || '')}
                userRole={userRole}
                isCustomizing={isCustomizing}
              />
            ))}
          </Grid>
        </SortableContext>
      </DndContext>

      {/* Customize Widgets Modal */}
      <CustomizeWidgetsDialog
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        userRole={userRole}
        currentOrder={widgetOrder}
        currentEnabled={enabledWidgets}
        onSave={savePreferences}
        onReset={resetPreferences}
      />
    </Box>
  );
}
