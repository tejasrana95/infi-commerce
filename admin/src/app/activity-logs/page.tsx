'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Grid, Card, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, TextField,
  MenuItem, Select, FormControl, InputLabel, Tabs, Tab, Drawer, Divider,
  IconButton, Pagination, Stack, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControlLabel, Checkbox, Avatar, Tooltip,
  InputAdornment,
  SpeedDialIcon
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  DeleteForever as DeleteIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  Security as SecurityIcon,
  ShoppingBag as OrderIcon,
  VpnKey as AuthIcon,
  Speed as ApiIcon,
  Search as SearchIcon,
  ContentCopy as CopyIcon,
  LocationOn as LocationIcon,
  CreditCard as PaymentIcon,
  ErrorOutline as FailedIcon,
  Tune as TuneIcon,
  BookmarkBorder as SavedViewsIcon,
  ViewColumn as ColumnsIcon,
  History as HistoryIcon,
  Equalizer as EqualizerIcon,
} from '@mui/icons-material';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { PageHeader } from '@/components/molecules';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

export default function ActivityLogsPage() {
  const { showNotification } = useNotification();

  // Active Main Tab: 0: Activity Stream, 1: Audit Trail, 2: API Tracking, 3: Security Alerts
  const [activeTab, setActiveTab] = useState<number>(0);

  // Drawer Side Panel Active Tab
  const [drawerTab, setDrawerTab] = useState<number>(0);

  // Stores List (Dynamic from API)
  const [stores, setStores] = useState<any[]>([]);

  // Loading States
  const [loading, setLoading] = useState<boolean>(true);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(true);

  // Data States
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(25);
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);

  // Dynamic Analytics Metrics & Chart Trends State
  const [metrics, setMetrics] = useState<any>({
    totalActivities: 0,
    authEvents: 0,
    ordersCount: 0,
    paymentsCount: 0,
    failedActions: 0,
    securityAlertsCount: 0,
    auditCount: 0,
  });

  const [chartTrends, setChartTrends] = useState<any>({
    activityTrends: [],
    auditTrends: [],
    apiLatencyTrends: [],
    securityTrends: [],
  });

  // Filter States (No hardcoded values, currency removed)
  const [filters, setFilters] = useState<any>({
    dateRange: 'last_7_days',
    storeId: '',
    userType: '',
    actorId: '',
    channel: '',
    orderSource: '',
    module: '',
    activityType: '',
    action: '',
    status: '',
    riskSeverity: '',
    searchKeyword: '',
    ipAddress: '',
    country: '',
    httpMethod: '',
    responseCode: '',
  });

  const [showMoreFilters, setShowMoreFilters] = useState<boolean>(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(true);
  const [showChartsPanel, setShowChartsPanel] = useState<boolean>(true);

  // Detail Drawer State
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Export & Archive Dialog States
  const [archiveDialogOpen, setArchiveDialogOpen] = useState<boolean>(false);
  const [archiveConfig, setArchiveConfig] = useState<any>({
    rangeType: 'last_30_days',
    format: 'csv',
    purgeAfterArchive: false,
  });
  const [archiveSubmitting, setArchiveSubmitting] = useState<boolean>(false);

  // Purge Dialog State
  const [purgeDialogOpen, setPurgeDialogOpen] = useState<boolean>(false);

  // Fetch Dynamic Stores
  const fetchStores = useCallback(async () => {
    try {
      const res = await api.get('/stores');
      setStores(res.data?.data || res.data?.stores || []);
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    }
  }, []);

  // Helper to format 24h string (e.g. "14:00") into 12-hour AM/PM format (e.g. "02:00 PM")
  const formatHourLabel = (rawTime: string) => {
    if (!rawTime) return '';
    if (rawTime.includes(':')) {
      const parts = rawTime.split(':');
      const hour = parseInt(parts[0], 10);
      if (!isNaN(hour)) {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${h12.toString().padStart(2, '0')}:00 ${ampm}`;
      }
    }
    return rawTime;
  };

  // Fetch Analytics Metrics & Trends with local timezone
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await api.get('/activity-logs/analytics', { params: { timezone: userTz } });
      if (res.data?.data?.metrics) {
        setMetrics({
          ...metrics,
          ...res.data.data.metrics,
        });
      }
      if (res.data?.data?.dashboards?.trends) {
        setChartTrends(res.data.data.dashboards.trends);
      }
    } catch (err) {
      console.error('Failed to load activity analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // Helper to construct visual graph data for each active tab
  const getTabChartData = useCallback(() => {
    if (activeTab === 0) {
      // Activity Stream Chart Data
      if (chartTrends.activityTrends?.length > 0) {
        return chartTrends.activityTrends.map((item: any) => ({
          time: formatHourLabel(item._id),
          Total: item.total || 0,
          Success: item.success || 0,
          Failed: item.failed || 0,
        }));
      }
      const map: Record<string, { total: number; success: number; failed: number }> = {};
      logs.forEach((log) => {
        const time = new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (!map[time]) map[time] = { total: 0, success: 0, failed: 0 };
        map[time].total += 1;
        if (log.status === 'failed') map[time].failed += 1;
        else map[time].success += 1;
      });
      const res = Object.keys(map).map(time => ({ time, Total: map[time].total, Success: map[time].success, Failed: map[time].failed }));
      return res.length > 0 ? res : [{ time: '12:00 AM', Total: 0, Success: 0, Failed: 0 }];
    }

    if (activeTab === 1) {
      // Audit Trail Chart Data
      if (chartTrends.auditTrends?.length > 0) {
        return chartTrends.auditTrends.map((item: any) => ({
          time: formatHourLabel(item._id),
          Create: item.create || 0,
          Update: item.update || 0,
          Delete: item.delete || 0,
        }));
      }
      const map: Record<string, { create: number; update: number; delete: number }> = {};
      logs.forEach((log) => {
        const time = new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (!map[time]) map[time] = { create: 0, update: 0, delete: 0 };
        const act = (log.action || '').toUpperCase();
        if (act.includes('CREATE')) map[time].create += 1;
        else if (act.includes('DELETE')) map[time].delete += 1;
        else map[time].update += 1;
      });
      const res = Object.keys(map).map(time => ({ time, Create: map[time].create, Update: map[time].update, Delete: map[time].delete }));
      return res.length > 0 ? res : [{ time: '12:00 AM', Create: 0, Update: 0, Delete: 0 }];
    }

    if (activeTab === 2) {
      // API Tracking Chart Data
      if (chartTrends.apiLatencyTrends?.length > 0) {
        return chartTrends.apiLatencyTrends.map((item: any) => ({
          time: formatHourLabel(item._id),
          AvgLatencyMs: Math.round(item.avgLatency || 0),
          Calls: item.totalCalls || 0,
          Errors: item.errorCalls || 0,
        }));
      }
      const map: Record<string, { totalLatency: number; count: number; errors: number }> = {};
      logs.forEach((log) => {
        const time = new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (!map[time]) map[time] = { totalLatency: 0, count: 0, errors: 0 };
        map[time].count += 1;
        map[time].totalLatency += log.responseTimeMs || 0;
        if ((log.httpStatus || 200) >= 400) map[time].errors += 1;
      });
      const res = Object.keys(map).map(time => ({
        time,
        AvgLatencyMs: Math.round(map[time].totalLatency / (map[time].count || 1)),
        Calls: map[time].count,
        Errors: map[time].errors,
      }));
      return res.length > 0 ? res : [{ time: '12:00 AM', AvgLatencyMs: 0, Calls: 0, Errors: 0 }];
    }

    if (activeTab === 3) {
      // Security Alerts Chart Data
      if (chartTrends.securityTrends?.length > 0) {
        return chartTrends.securityTrends.map((item: any) => ({
          time: formatHourLabel(item._id),
          Critical: item.critical || 0,
          Medium: item.medium || 0,
          Low: item.low || 0,
        }));
      }
      const map: Record<string, { critical: number; medium: number; low: number }> = {};
      logs.forEach((log) => {
        const time = new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (!map[time]) map[time] = { critical: 0, medium: 0, low: 0 };
        const sev = String(log.severity || '').toLowerCase();
        if (sev === 'critical' || sev === 'high') map[time].critical += 1;
        else if (sev === 'medium') map[time].medium += 1;
        else map[time].low += 1;
      });
      const res = Object.keys(map).map(time => ({ time, Critical: map[time].critical, Medium: map[time].medium, Low: map[time].low }));
      return res.length > 0 ? res : [{ time: '12:00 AM', Critical: 0, Medium: 0, Low: 0 }];
    }

    return [];
  }, [activeTab, chartTrends, logs]);

  // Fetch Log Data based on Active Tab & Filters
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = '/activity-logs';
      if (activeTab === 1) endpoint = '/activity-logs/audit';
      else if (activeTab === 2) endpoint = '/activity-logs/api';
      else if (activeTab === 3) endpoint = '/activity-logs/security';

      const params: any = {
        page,
        limit,
        ...filters,
      };

      // Clean empty filters
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });

      const res = await api.get(endpoint, { params });
      setLogs(res.data?.data || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      showNotification('Error loading activity logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit, filters, showNotification]);

  useEffect(() => {
    fetchStores();
    fetchAnalytics();
  }, [fetchStores, fetchAnalytics]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle Select All Checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLogs(logs.map(l => l._id));
    } else {
      setSelectedLogs([]);
    }
  };

  // Handle Single Checkbox Select
  const handleSelectOne = (id: string) => {
    if (selectedLogs.includes(id)) {
      setSelectedLogs(selectedLogs.filter(item => item !== id));
    } else {
      setSelectedLogs([...selectedLogs, id]);
    }
  };

  // Copy to Clipboard Helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showNotification(`${label} copied to clipboard!`, 'success');
  };

  // Handle Archive Submission
  const handleCreateArchive = async () => {
    setArchiveSubmitting(true);
    try {
      const res = await api.post('/activity-logs/archive', archiveConfig);
      showNotification('Archive generated successfully!', 'success');
      setArchiveDialogOpen(false);

      if (res.data?.data?._id) {
        window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/activity-logs/archive/download/${res.data.data._id}`, '_blank');
      }
    } catch (err: any) {
      console.error('Archive generation error:', err);
      showNotification(err.response?.data?.message || 'Failed to generate archive', 'error');
    } finally {
      setArchiveSubmitting(false);
    }
  };

  const getStatusChip = (row: any) => {
    if (!row) return null;

    // 1. Handle Security Log Severity Chips
    if (row.severity) {
      const sev = String(row.severity).toLowerCase();
      if (sev === 'critical' || sev === 'high') {
        return (
          <Chip
            label={String(row.severity).toUpperCase()}
            size="small"
            sx={{ backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 700, borderRadius: '6px', fontSize: '0.75rem' }}
          />
        );
      }
      if (sev === 'medium') {
        return (
          <Chip
            label="MEDIUM"
            size="small"
            sx={{ backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 700, borderRadius: '6px', fontSize: '0.75rem' }}
          />
        );
      }
      return (
        <Chip
          label={String(row.severity).toUpperCase()}
          size="small"
          sx={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 700, borderRadius: '6px', fontSize: '0.75rem' }}
        />
      );
    }

    // 2. Handle Status & HTTP Status Codes
    const statusVal = row.status || (row.httpStatus !== undefined ? String(row.httpStatus) : undefined) || (row.details?.httpStatus !== undefined ? String(row.details.httpStatus) : undefined) || 'Success';
    const s = String(statusVal).toLowerCase();

    if (s === 'success' || s === 'completed' || s === '200' || s === '201') {
      return (
        <Chip
          label="Success"
          size="small"
          sx={{ backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700, borderRadius: '6px', fontSize: '0.75rem' }}
        />
      );
    }
    if (s === 'failed' || s === 'error' || s === '500' || s === '400') {
      return (
        <Chip
          label="Failed"
          size="small"
          sx={{ backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 700, borderRadius: '6px', fontSize: '0.75rem' }}
        />
      );
    }
    if (s === 'warning' || s === '401' || s === '403' || s === '429') {
      return (
        <Chip
          label="Warning"
          size="small"
          sx={{ backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 700, borderRadius: '6px', fontSize: '0.75rem' }}
        />
      );
    }
    return <Chip label={statusVal} size="small" sx={{ borderRadius: '6px' }} />;
  };

  const getActorPill = (actorType: string) => {
    const type = (actorType || '').toLowerCase();
    let bg = '#e0f2fe';
    let color = '#0369a1';

    if (type.includes('admin')) { bg = '#dbeafe'; color = '#1d4ed8'; }
    else if (type === 'pos_user') { bg = '#f3e8ff'; color = '#6b21a8'; }
    else if (type === 'customer') { bg = '#dcfce7'; color = '#15803d'; }
    else if (type === 'api_key') { bg = '#ffedd5'; color = '#c2410c'; }
    else if (type === 'system') { bg = '#f1f5f9'; color = '#475569'; }

    return (
      <Chip
        label={actorType || 'Guest'}
        size="small"
        sx={{ backgroundColor: bg, color: color, fontWeight: 700, borderRadius: '6px', fontSize: '0.75rem', textTransform: 'capitalize' }}
      />
    );
  };

  const getChannelBadge = (channel: string) => {
    let ch = (channel || 'STOREFRONT').toUpperCase();
    if (ch === 'WEB') ch = 'STOREFRONT';
    let bg = '#eff6ff';
    let color = '#1d4ed8';

    if (ch === 'POS') { bg = '#fae8ff'; color = '#86198f'; }
    else if (ch === 'ADMIN') { bg = '#e0e7ff'; color = '#3730a3'; }
    else if (ch === 'API') { bg = '#fff7ed'; color = '#9a3412'; }
    else if (ch === 'WEBHOOK') { bg = '#ecfdf5'; color = '#065f46'; }

    return (
      <Box sx={{ px: 1, py: 0.3, borderRadius: '4px', backgroundColor: bg, color: color, fontSize: '0.7rem', fontWeight: 700, display: 'inline-block' }}>
        {ch}
      </Box>
    );
  };

  return (
    <Box>
      {/* Top Header Bar */}
      <PageHeader
        title="Activity Intelligence & Audit Logs"
        subtitle="Enterprise request tracking, business activity logs, audit history, and security alerts."
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title={showFiltersPanel ? "Hide Filters" : "Show Filters"}>
              <IconButton
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                size="small"
                sx={{
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: showFiltersPanel ? '#eff6ff' : 'transparent',
                  color: showFiltersPanel ? '#2563eb' : '#64748b',
                  '&:hover': {
                    backgroundColor: showFiltersPanel ? '#dbeafe' : '#f1f5f9',
                  }
                }}
              >
                <FilterIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={showChartsPanel ? "Hide Graphs" : "Show Graphs"}>
              <IconButton
                onClick={() => setShowChartsPanel(!showChartsPanel)}
                size="small"
                sx={{
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: showChartsPanel ? '#f5f3ff' : 'transparent',
                  color: showChartsPanel ? '#7c3aed' : '#64748b',
                  '&:hover': {
                    backgroundColor: showChartsPanel ? '#ede9fe' : '#f1f5f9',
                  }
                }}
              >
                <EqualizerIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => { fetchAnalytics(); fetchLogs(); }}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#cbd5e1', color: '#334155' }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => setArchiveDialogOpen(true)}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#cbd5e1', color: '#334155' }}
            >
              Export / Archive
            </Button>
            <Button
              variant="contained"
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setPurgeDialogOpen(true)}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
            >
              Purge Logs
            </Button>
          </Stack>
        }
      />

      {/* Primary Module Navigation Tabs */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(_e, val) => { setActiveTab(val); setPage(1); }}
          indicatorColor="primary"
          textColor="primary"
          sx={{ minHeight: 48, px: 1 }}
        >
          <Tab icon={<ApiIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Activity Stream" sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Audit Trail (${metrics.auditCount || 0})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab icon={<SpeedDialIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="API Tracking Logs" sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab icon={<SecurityIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Security Alerts (${metrics.securityAlertsCount || 0})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
        </Tabs>
      </Paper>

      {/* Dynamic KPI Metric Cards Row (Matching POSSessionsOverview pattern) */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card elevation={0} sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ApiIcon sx={{ color: '#2563eb', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Activities</Typography>
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  {analyticsLoading ? <CircularProgress size={16} /> : metrics.totalActivities.toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card elevation={0} sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AuthIcon sx={{ color: '#16a34a', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Authentication</Typography>
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  {analyticsLoading ? <CircularProgress size={16} /> : metrics.authEvents.toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card elevation={0} sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <OrderIcon sx={{ color: '#9333ea', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Orders</Typography>
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  {analyticsLoading ? <CircularProgress size={16} /> : metrics.ordersCount.toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card elevation={0} sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FailedIcon sx={{ color: '#dc2626', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Failed Actions</Typography>
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  {analyticsLoading ? <CircularProgress size={16} /> : metrics.failedActions.toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card elevation={0} sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SecurityIcon sx={{ color: '#dc2626', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Security Alerts</Typography>
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  {analyticsLoading ? <CircularProgress size={16} /> : metrics.securityAlertsCount.toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Visual Analytics & Spike Tracking Chart Card for Active Tab */}
      {showChartsPanel && (
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                {activeTab === 0 && 'Activity Volume & Trend Tracking'}
                {activeTab === 1 && 'Audit State Mutation Timeline'}
                {activeTab === 2 && 'API Latency & Error Spike Tracking'}
                {activeTab === 3 && 'Security Alert Severity Breakdown'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Real-time hourly time-series tracking over the last 24 hours
              </Typography>
            </Box>
            <Chip label="Live 24h Data" size="small" sx={{ backgroundColor: '#f1f5f9', fontWeight: 700, fontSize: '0.75rem' }} />
          </Stack>

          <Box sx={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === 0 ? (
                <AreaChart data={getTabChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="Total" stroke="#2563eb" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Failed" stroke="#dc2626" fillOpacity={1} fill="url(#colorFailed)" strokeWidth={2} />
                </AreaChart>
              ) : activeTab === 1 ? (
                <BarChart data={getTabChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Create" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Update" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Delete" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : activeTab === 2 ? (
                <LineChart data={getTabChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#d97706" fontSize={11} tickLine={false} unit="ms" />
                  <YAxis yAxisId="right" orientation="right" stroke="#2563eb" fontSize={11} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="AvgLatencyMs" stroke="#d97706" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="Calls" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="Errors" stroke="#dc2626" strokeWidth={2} dot={false} />
                </LineChart>
              ) : (
                <BarChart data={getTabChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Critical" fill="#b91c1c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Medium" fill="#d97706" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Low" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}

      {/* Advanced Filters Toolbar (Card Panel) */}
      {showFiltersPanel && (
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2 }}>
            {/* Row 1 */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5} display="block">Date Range</Typography>
              <Select
                fullWidth
                size="small"
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                sx={{ borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="yesterday">Yesterday</MenuItem>
                <MenuItem value="last_7_days">Last 7 Days</MenuItem>
                <MenuItem value="last_30_days">Last 30 Days</MenuItem>
                <MenuItem value="last_90_days">Last 90 Days</MenuItem>
                <MenuItem value="all_time">All Time</MenuItem>
              </Select>
            </Box>

            {/* Dynamic Store Selector */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5} display="block">Store</Typography>
              <Select
                fullWidth
                size="small"
                value={filters.storeId}
                onChange={(e) => setFilters({ ...filters, storeId: e.target.value })}
                displayEmpty
                sx={{ borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <MenuItem value="">All Stores</MenuItem>
                {stores.map((s: any) => (
                  <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                ))}
              </Select>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5} display="block">User Type</Typography>
              <Select
                fullWidth
                size="small"
                value={filters.userType}
                onChange={(e) => setFilters({ ...filters, userType: e.target.value })}
                displayEmpty
                sx={{ borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <MenuItem value="">All User Types</MenuItem>
                <MenuItem value="super_admin">Super Admin</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="store_admin">Store Admin</MenuItem>
                <MenuItem value="pos_user">POS User</MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
                <MenuItem value="guest">Guest</MenuItem>
                <MenuItem value="api_key">API Key</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5} display="block">Channel</Typography>
              <Select
                fullWidth
                size="small"
                value={filters.channel}
                onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
                displayEmpty
                sx={{ borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <MenuItem value="">All Channels</MenuItem>
                <MenuItem value="STOREFRONT">Storefront / Web</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="POS">POS</MenuItem>
                <MenuItem value="API">API</MenuItem>
                <MenuItem value="WEBHOOK">Webhook</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5} display="block">Order Source</Typography>
              <Select
                fullWidth
                size="small"
                value={filters.orderSource}
                onChange={(e) => setFilters({ ...filters, orderSource: e.target.value })}
                displayEmpty
                sx={{ borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <MenuItem value="">All Sources</MenuItem>
                <MenuItem value="Storefront">Storefront</MenuItem>
                <MenuItem value="Admin">Admin Panel</MenuItem>
                <MenuItem value="POS">POS</MenuItem>
                <MenuItem value="API">API Integration</MenuItem>
              </Select>
            </Box>

            {/* Row 2 */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5} display="block">Module</Typography>
              <Select
                fullWidth
                size="small"
                value={filters.module}
                onChange={(e) => setFilters({ ...filters, module: e.target.value })}
                displayEmpty
                sx={{ borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <MenuItem value="">All Modules</MenuItem>
                <MenuItem value="Products">Products</MenuItem>
                <MenuItem value="Categories">Categories</MenuItem>
                <MenuItem value="Blog">Blog Posts</MenuItem>
                <MenuItem value="CMS Pages">CMS Pages</MenuItem>
                <MenuItem value="Orders">Orders</MenuItem>
                <MenuItem value="Returns & Refunds">Returns & Refunds</MenuItem>
                <MenuItem value="Coupons & Marketing">Coupons & Marketing</MenuItem>
                <MenuItem value="Accounting">Accounting</MenuItem>
                <MenuItem value="Store Settings">Store Settings</MenuItem>
                <MenuItem value="Users & Roles">Users & Roles</MenuItem>
                <MenuItem value="POS">POS</MenuItem>
                <MenuItem value="Cart">Cart</MenuItem>
                <MenuItem value="Authentication">Authentication</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5} display="block">Status</Typography>
              <Select
                fullWidth
                size="small"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                displayEmpty
                sx={{ borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5} display="block">Action</Typography>
              <Select
                fullWidth
                size="small"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                displayEmpty
                sx={{ borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <MenuItem value="">All Actions</MenuItem>
                <MenuItem value="CREATE">CREATE</MenuItem>
                <MenuItem value="UPDATE">UPDATE</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
                <MenuItem value="PUBLISH">PUBLISH</MenuItem>
                <MenuItem value="LOGIN">LOGIN</MenuItem>
                <MenuItem value="Search">SEARCH QUERY</MenuItem>
                <MenuItem value="ADD_TO_CART">ADD TO CART</MenuItem>
                <MenuItem value="ADD_TO_WISHLIST">ADD TO WISHLIST</MenuItem>
                <MenuItem value="PLACE_ORDER">PLACE ORDER</MenuItem>
                <MenuItem value="PAYMENT">PAYMENT</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5} display="block">Risk / Severity</Typography>
              <Select
                fullWidth
                size="small"
                value={filters.riskSeverity}
                onChange={(e) => setFilters({ ...filters, riskSeverity: e.target.value })}
                displayEmpty
                sx={{ borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <MenuItem value="">All Severities</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 2', sm: 'span 2', md: 'span 2' } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5} display="block">Search Keyword / User / Action</Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Search keyword..."
                value={filters.searchKeyword}
                onChange={(e) => setFilters({ ...filters, searchKeyword: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ borderRadius: '8px', fontSize: '0.85rem' }}
              />
            </Box>
          </Box>

          {/* More Filters Panel */}
          {showMoreFilters && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mt: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5} display="block">IP Address</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. 192.168.1.1"
                  value={filters.ipAddress}
                  onChange={(e) => setFilters({ ...filters, ipAddress: e.target.value })}
                  sx={{ borderRadius: '8px' }}
                />
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5} display="block">Country</Typography>
                <Select
                  fullWidth
                  size="small"
                  value={filters.country}
                  onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                  displayEmpty
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="">All Countries</MenuItem>
                  <MenuItem value="US">United States</MenuItem>
                  <MenuItem value="IN">India</MenuItem>
                  <MenuItem value="CA">Canada</MenuItem>
                </Select>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5} display="block">HTTP Method</Typography>
                <Select
                  fullWidth
                  size="small"
                  value={filters.httpMethod}
                  onChange={(e) => setFilters({ ...filters, httpMethod: e.target.value })}
                  displayEmpty
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="">All Methods</MenuItem>
                  <MenuItem value="GET">GET</MenuItem>
                  <MenuItem value="POST">POST</MenuItem>
                  <MenuItem value="PUT">PUT</MenuItem>
                  <MenuItem value="DELETE">DELETE</MenuItem>
                </Select>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5} display="block">Response Code</Typography>
                <Select
                  fullWidth
                  size="small"
                  value={filters.responseCode}
                  onChange={(e) => setFilters({ ...filters, responseCode: e.target.value })}
                  displayEmpty
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="">All Codes</MenuItem>
                  <MenuItem value="200">200 OK</MenuItem>
                  <MenuItem value="400">400 Bad Request</MenuItem>
                  <MenuItem value="401">401 Unauthorized</MenuItem>
                  <MenuItem value="403">403 Forbidden</MenuItem>
                  <MenuItem value="500">500 Server Error</MenuItem>
                </Select>
              </Box>
            </Box>
          )}

          {/* Toolbar Action Footer */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2.5}>
            <Button
              size="small"
              startIcon={<TuneIcon />}
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}
            >
              {showMoreFilters ? 'Fewer Filters' : 'More Filters'}
            </Button>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="text"
                size="small"
                onClick={() => setFilters({
                  dateRange: 'last_7_days', storeId: '', userType: '', actorId: '', channel: '',
                  orderSource: '', module: '', activityType: '', action: '', status: '', riskSeverity: '',
                  searchKeyword: '', ipAddress: '', country: '', httpMethod: '', responseCode: ''
                })}
                sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}
              >
                Reset Filters
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={fetchLogs}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, px: 3, backgroundColor: '#2563eb', boxShadow: 'none' }}
              >
                Apply Filters
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Main Stream Table Section */}
      <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', overflow: 'hidden' }}>
        {/* Table Header Bar */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" p={2.5} borderBottom="1px solid #e2e8f0">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h6" fontWeight={800} color="#0f172a">
              {activeTab === 0 ? 'Activity Stream' : activeTab === 1 ? 'Audit Trail' : activeTab === 2 ? 'API Tracking Logs' : 'Security Alerts'}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ backgroundColor: '#f1f5f9', px: 1, py: 0.3, borderRadius: '12px' }}>
              {total.toLocaleString()} records
            </Typography>
          </Stack>
        </Stack>

        {/* Dynamic Data Table */}
        <TableContainer>
          {loading ? (
            <Box display="flex" justifyContent="center" p={6}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedLogs.length > 0 && selectedLogs.length < logs.length}
                      checked={logs.length > 0 && selectedLogs.length === logs.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Actor</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>User Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Channel</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Module / Entity</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>IP Address</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary" fontWeight={500}>No log records found matching the active filters.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((row) => {
                    const isSelected = selectedLogs.includes(row._id);
                    const actUpper = String(row.action || row.activityType || row.eventType || '').toUpperCase();
                    const isDelete = actUpper.includes('DELETE');
                    const statusVal = String(row.status || row.httpStatus || row.severity || '').toLowerCase();
                    const isFailed = statusVal === 'failed' || statusVal === 'error' || statusVal === 'critical' || statusVal === 'high' || (row.httpStatus !== undefined && Number(row.httpStatus) >= 400);
                    const isAlertRow = isDelete || isFailed;

                    return (
                      <TableRow
                        key={row._id}
                        hover
                        selected={isSelected}
                        sx={{
                          backgroundColor: isSelected ? '#fee2e2' : isAlertRow ? '#fff5f5' : 'inherit',
                          '&:hover': {
                            backgroundColor: isAlertRow ? '#fef2f2' : '#f8fafc',
                          }
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleSelectOne(row._id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="#0f172a">
                            {new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(row.createdAt).toLocaleTimeString()}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.85rem', backgroundColor: isAlertRow ? '#fee2e2' : '#e2e8f0', color: isAlertRow ? '#991b1b' : '#334155', fontWeight: 700 }}>
                              {(row.actor?.name || row.actor?.email || row.userId || 'G')[0].toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700} color="#0f172a">
                                {row.actor?.name || row.actor?.email || row.userId || 'Guest'}
                              </Typography>
                              {row.actor?.email && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {row.actor.email}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell>{getActorPill(row.actor?.type || row.userType)}</TableCell>

                        <TableCell>{getChannelBadge(row.channel)}</TableCell>

                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="#334155">{row.module || row.entity || row.eventType || 'Security'}</Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color={isAlertRow ? '#dc2626' : '#0f172a'}>
                            {row.action || row.activityType || row.eventType}
                          </Typography>
                          <Typography variant="caption" color={isAlertRow ? '#b91c1c' : 'text.secondary'}>
                            {row.url || row.details?.orderNumber || row.details?.attemptedEmail || row.endpoint || ''}
                          </Typography>
                        </TableCell>

                        <TableCell>{getStatusChip(row)}</TableCell>

                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" color="#475569">{row.ipAddress || '-'}</Typography>
                        </TableCell>

                        <TableCell align="right">
                          <IconButton size="small" color={isAlertRow ? "error" : "primary"} onClick={() => setSelectedLog(row)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}

          {/* Table Pagination Footer */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" p={2} borderTop="1px solid #e2e8f0">
            <Typography variant="body2" color="text.secondary">
              Rows per page: <strong>25</strong> &nbsp; | &nbsp; {logs.length === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()}
            </Typography>
            <Pagination
              count={Math.ceil(total / limit) || 1}
              page={page}
              onChange={(_e, p) => setPage(p)}
              color="primary"
              shape="rounded"
            />
          </Stack>
        </TableContainer>
      </Paper>

      {/* Split Side Drawer Panel for Activity Details */}
      <Drawer
        anchor="right"
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 0, backgroundColor: '#ffffff' } }}
      >
        {selectedLog && (
          <Box display="flex" flexDirection="column" height="100%">
            {/* Drawer Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" p={2.5} borderBottom="1px solid #e2e8f0">
              <Typography variant="h6" fontWeight={800} color="#0f172a">
                Activity Event Details
              </Typography>
              <IconButton size="small" onClick={() => setSelectedLog(null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>

            {/* Inner Drawer Tabs */}
            <Tabs
              value={drawerTab}
              onChange={(_e, val) => setDrawerTab(val)}
              variant="fullWidth"
              sx={{ borderBottom: '1px solid #e2e8f0', minHeight: 44 }}
            >
              <Tab label="Overview" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' }} />
              <Tab label="Request" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' }} />
              <Tab label="Response" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' }} />
              <Tab label="Metadata" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' }} />
            </Tabs>

            {/* Tab 0: Overview */}
            {drawerTab === 0 && (
              <Box p={3} sx={{ overflowY: 'auto', flex: 1 }}>
                <Stack spacing={3}>
                  {/* Basic Info */}
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>BASIC INFORMATION</Typography>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Date & Time</Typography>
                        <Typography variant="body2" fontWeight={600}>{new Date(selectedLog.createdAt).toLocaleString()}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Request ID</Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="caption" fontFamily="monospace" fontWeight={600}>{selectedLog.requestId || '-'}</Typography>
                          {selectedLog.requestId && (
                            <IconButton size="small" onClick={() => copyToClipboard(selectedLog.requestId, 'Request ID')}>
                              <CopyIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          )}
                        </Stack>
                      </Stack>
                      {selectedLog.traceId && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Trace ID</Typography>
                          <Typography variant="caption" fontFamily="monospace" fontWeight={600}>{selectedLog.traceId}</Typography>
                        </Stack>
                      )}
                      {selectedLog.correlationId && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Correlation ID</Typography>
                          <Typography variant="caption" fontFamily="monospace" fontWeight={600}>{selectedLog.correlationId}</Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Box>

                  <Divider />

                  {/* Actor Info */}
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1.5}>ACTOR</Typography>
                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 40, height: 40, backgroundColor: '#2563eb', fontWeight: 700 }}>
                          {(selectedLog.actor?.name || selectedLog.actor?.email || 'G')[0].toUpperCase()}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="body2" fontWeight={700} color="#0f172a">
                            {selectedLog.actor?.name || selectedLog.actor?.email || 'Guest User'}
                          </Typography>
                          {selectedLog.actor?.email && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {selectedLog.actor.email}
                            </Typography>
                          )}
                        </Box>
                        {getActorPill(selectedLog.actor?.type || selectedLog.userType)}
                      </Stack>
                    </Paper>
                  </Box>

                  <Divider />

                  {/* Action Details */}
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>ACTION DETAILS</Typography>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Module</Typography>
                        <Typography variant="body2" fontWeight={600}>{selectedLog.module || selectedLog.entity || 'HTTP'}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Action</Typography>
                        <Typography variant="body2" fontWeight={600}>{selectedLog.action || selectedLog.activityType}</Typography>
                      </Stack>
                      {selectedLog.details?.orderId && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Order ID</Typography>
                          <Typography variant="body2" fontWeight={600} color="primary.main">{selectedLog.details.orderId}</Typography>
                        </Stack>
                      )}
                      {selectedLog.details?.attemptedEmail && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Attempted Email</Typography>
                          <Typography variant="body2" fontWeight={600} color="error.main">{selectedLog.details.attemptedEmail}</Typography>
                        </Stack>
                      )}
                      {selectedLog.orderSource && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Order Source</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedLog.orderSource}</Typography>
                        </Stack>
                      )}
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Channel</Typography>
                        <Typography variant="body2" fontWeight={600}>{selectedLog.channel || 'WEB'}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">Status / Severity</Typography>
                        {getStatusChip(selectedLog)}
                      </Stack>
                    </Stack>
                  </Box>

                  <Divider />

                  {/* Environment & Network */}
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>NETWORK & ENVIRONMENT</Typography>
                    <Stack spacing={1}>
                      {selectedLog.ipAddress && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">IP Address</Typography>
                          <Typography variant="body2" fontFamily="monospace" fontWeight={600}>{selectedLog.ipAddress}</Typography>
                        </Stack>
                      )}
                      {selectedLog.country && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Location</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedLog.country}</Typography>
                        </Stack>
                      )}
                      {selectedLog.userAgent && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">User Agent</Typography>
                          <Typography variant="caption" color="text.secondary" textAlign="right" sx={{ maxWidth: 220 }}>
                            {selectedLog.userAgent}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            )}

            {/* Tab 1: Request JSON */}
            {drawerTab === 1 && (
              <Box p={3} sx={{ overflowY: 'auto', flex: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>REQUEST PAYLOAD & HEADERS</Typography>
                <Paper elevation={0} sx={{ p: 2, backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: '8px', overflowX: 'auto' }}>
                  <pre style={{ margin: 0, fontSize: 12 }}>
                    {JSON.stringify({
                      method: selectedLog.method || 'POST',
                      url: selectedLog.url || selectedLog.action,
                      headers: selectedLog.requestHeaders || {},
                      body: selectedLog.requestBody || selectedLog.details || {},
                      queryParams: selectedLog.queryParams || {},
                    }, null, 2)}
                  </pre>
                </Paper>
              </Box>
            )}

            {/* Tab 2: Response JSON */}
            {drawerTab === 2 && (
              <Box p={3} sx={{ overflowY: 'auto', flex: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>RESPONSE METRICS</Typography>
                <Paper elevation={0} sx={{ p: 2, backgroundColor: '#0f172a', color: '#38bdf8', borderRadius: '8px', overflowX: 'auto' }}>
                  <pre style={{ margin: 0, fontSize: 12 }}>
                    {JSON.stringify({
                      httpStatus: selectedLog.httpStatus || 200,
                      responseTimeMs: selectedLog.responseTimeMs || 0,
                      payloadSizeBytes: selectedLog.payloadSizeBytes || 0,
                      responseStatus: selectedLog.responseStatus || 'SUCCESS',
                    }, null, 2)}
                  </pre>
                </Paper>
              </Box>
            )}

            {/* Tab 3: Raw Metadata */}
            {drawerTab === 3 && (
              <Box p={3} sx={{ overflowY: 'auto', flex: 1 }}>
                <Paper elevation={0} sx={{ p: 2, backgroundColor: '#0f172a', color: '#a7f3d0', borderRadius: '8px', overflowX: 'auto' }}>
                  <pre style={{ margin: 0, fontSize: 12 }}>
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </Paper>
              </Box>
            )}

            {/* Drawer Footer Button */}
            <Box p={2.5} borderTop="1px solid #e2e8f0" backgroundColor="#f8fafc">
              <Button
                fullWidth
                variant="outlined"
                onClick={() => copyToClipboard(JSON.stringify(selectedLog, null, 2), 'Full log event')}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, borderColor: '#cbd5e1', color: '#334155' }}
              >
                Copy Full Event JSON
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Export / Archive Dialog */}
      <Dialog open={archiveDialogOpen} onClose={() => setArchiveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Generate Log Export / Archive</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Export activity, audit, and API tracking logs into compressed CSV or JSON formats.
          </Typography>

          <Stack spacing={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Range</InputLabel>
              <Select
                value={archiveConfig.rangeType}
                label="Date Range"
                onChange={(e) => setArchiveConfig({ ...archiveConfig, rangeType: e.target.value })}
              >
                <MenuItem value="yesterday">Yesterday</MenuItem>
                <MenuItem value="last_7_days">Last 7 Days</MenuItem>
                <MenuItem value="last_30_days">Last 30 Days</MenuItem>
                <MenuItem value="last_90_days">Last 90 Days</MenuItem>
                <MenuItem value="last_6_months">Last 6 Months</MenuItem>
                <MenuItem value="last_year">Last Year</MenuItem>
                <MenuItem value="all_time">All Time</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Export Format</InputLabel>
              <Select
                value={archiveConfig.format}
                label="Export Format"
                onChange={(e) => setArchiveConfig({ ...archiveConfig, format: e.target.value })}
              >
                <MenuItem value="csv">CSV (Comma Separated)</MenuItem>
                <MenuItem value="json">JSON Structure</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={archiveConfig.purgeAfterArchive}
                  onChange={(e) => setArchiveConfig({ ...archiveConfig, purgeAfterArchive: e.target.checked })}
                  color="error"
                />
              }
              label="Purge archived records from database after export"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setArchiveDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateArchive}
            disabled={archiveSubmitting}
            startIcon={archiveSubmitting ? <CircularProgress size={18} /> : <DownloadIcon />}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
          >
            Generate & Download
          </Button>
        </DialogActions>
      </Dialog>

      {/* Purge Confirm Dialog */}
      <Dialog open={purgeDialogOpen} onClose={() => setPurgeDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>Purge Log Records</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to purge log records? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPurgeDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              try {
                await api.post('/activity-logs/purge', { rangeType: 'last_90_days' });
                showNotification('Logs purged successfully!', 'success');
                setPurgeDialogOpen(false);
                fetchLogs();
              } catch (err) {
                showNotification('Purge failed or unauthorized', 'error');
              }
            }}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
          >
            Confirm Purge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
