'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    FormControlLabel,
    Grid,
    Paper,
    Radio,
    RadioGroup,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import PageHeader from '@/components/molecules/PageHeader';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/lib/api';

interface TableOption {
    key: string;
    label: string;
}

interface SearchReplaceResult {
    table: string;
    label: string;
    scanned: number;
    matchedRecords: number;
    replacements: number;
    updatedRecords: number;
}

interface SearchReplaceResponse {
    mode: 'dry-run' | 'live';
    summary: {
        scanned: number;
        matchedRecords: number;
        replacements: number;
        updatedRecords: number;
    };
    results: SearchReplaceResult[];
}

export default function SearchReplacePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { showNotification } = useNotification();

    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [storeId, setStoreId] = useState<string | null>(null);
    const [tableMode, setTableMode] = useState<'all' | 'selected'>('all');
    const [tableOptions, setTableOptions] = useState<TableOption[]>([]);
    const [selectedTableKeys, setSelectedTableKeys] = useState<string[]>([]);
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [dryRun, setDryRun] = useState(true);
    const [loadingTables, setLoadingTables] = useState(true);
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<SearchReplaceResponse | null>(null);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'super_admin')) {
            router.push(user ? '/dashboard' : '/login');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        const fetchTables = async () => {
            try {
                setLoadingTables(true);
                const response = await api.get('/settings/search-replace/tables');
                const tables = response.data?.tables || [];
                setTableOptions(tables);
            } catch (error) {
                console.error('Failed to load tables:', error);
                showNotification('Failed to load searchable tables', 'error');
                setTableOptions([]);
            } finally {
                setLoadingTables(false);
            }
        };

        if (user?.role === 'super_admin') {
            fetchTables();
        }
    }, [user, showNotification]);

    const selectedTableOptions = useMemo(
        () => tableOptions.filter((table) => selectedTableKeys.includes(table.key)),
        [tableOptions, selectedTableKeys]
    );

    const canSubmit =
        findText.trim().length > 0
        && !!storeId
        && (tableMode === 'all' || selectedTableKeys.length > 0);

    const handleRun = async () => {
        if (!canSubmit) return;

        try {
            setRunning(true);
            setResult(null);

            const response = await api.post('/settings/search-replace', {
                find: findText,
                replace: replaceText,
                storeId,
                tables: tableMode === 'all' ? 'all' : selectedTableKeys,
                dryRun,
                caseSensitive,
            });

            setResult({
                mode: response.data.mode,
                summary: response.data.summary,
                results: response.data.results || [],
            });

            showNotification(
                dryRun ? 'Dry run completed successfully' : 'Live replace completed successfully',
                'success'
            );
        } catch (error: any) {
            console.error('Search replace failed:', error);
            showNotification(error?.response?.data?.message || 'Search and replace failed', 'error');
        } finally {
            setRunning(false);
        }
    };

    if (authLoading || !user || user.role !== 'super_admin') {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Search & Replace"
                subtitle="Run store-scoped text replacement with dry-run safety checks."
                backUrl="/settings"
            />

            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Find"
                            value={findText}
                            onChange={(e) => setFindText(e.target.value)}
                            required
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Replace"
                            value={replaceText}
                            onChange={(e) => setReplaceText(e.target.value)}
                            helperText="Leave blank to remove matched text."
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <StoreAutocomplete
                            value={storeId}
                            onChange={(value) => setStoreId(typeof value === 'string' ? value : null)}
                            label="Store"
                            required
                            helperText="Only records matching this store will be updated."
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Tables
                        </Typography>
                        <RadioGroup
                            row
                            value={tableMode}
                            onChange={(e) => setTableMode(e.target.value as 'all' | 'selected')}
                        >
                            <FormControlLabel value="all" control={<Radio />} label="All" />
                            <FormControlLabel value="selected" control={<Radio />} label="Select Individual" />
                        </RadioGroup>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Autocomplete
                            multiple
                            options={tableOptions}
                            loading={loadingTables}
                            value={selectedTableOptions}
                            getOptionLabel={(option) => option.label}
                            isOptionEqualToValue={(option, value) => option.key === value.key}
                            onChange={(_, value) => setSelectedTableKeys(value.map((v) => v.key))}
                            disabled={tableMode === 'all'}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Selected Tables"
                                    placeholder={tableMode === 'all' ? 'All tables selected' : 'Select tables'}
                                    helperText={tableMode === 'all' ? 'All supported tables will be scanned.' : ''}
                                />
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={caseSensitive}
                                    onChange={(e) => setCaseSensitive(e.target.checked)}
                                />
                            }
                            label="Case Sensitive"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={dryRun}
                                    onChange={(e) => setDryRun(e.target.checked)}
                                />
                            }
                            label={dryRun ? 'Dry Run (No DB changes)' : 'Live Replace (Writes to DB)'}
                        />
                    </Grid>
                </Grid>

                <Box mt={3} display="flex" gap={2}>
                    <Button
                        variant="contained"
                        onClick={handleRun}
                        disabled={!canSubmit || running}
                        color={dryRun ? 'primary' : 'warning'}
                    >
                        {running ? 'Running...' : dryRun ? 'Run Dry Run' : 'Run Live Replace'}
                    </Button>
                </Box>
            </Paper>

            {result && (
                <Paper sx={{ p: 3 }}>
                    <Alert severity={result.mode === 'dry-run' ? 'info' : 'success'} sx={{ mb: 2 }}>
                        {result.mode === 'dry-run' ? 'Dry run completed.' : 'Live replace completed.'}
                        {' '}
                        Scanned: {result.summary.scanned}, Matched records: {result.summary.matchedRecords}, Replacements: {result.summary.replacements}, Updated: {result.summary.updatedRecords}
                    </Alert>

                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Table</TableCell>
                                    <TableCell align="right">Scanned</TableCell>
                                    <TableCell align="right">Matched Records</TableCell>
                                    <TableCell align="right">Replacements</TableCell>
                                    <TableCell align="right">Updated</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {result.results.map((row) => (
                                    <TableRow key={row.table}>
                                        <TableCell>{row.label}</TableCell>
                                        <TableCell align="right">{row.scanned}</TableCell>
                                        <TableCell align="right">{row.matchedRecords}</TableCell>
                                        <TableCell align="right">{row.replacements}</TableCell>
                                        <TableCell align="right">{row.updatedRecords}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
        </Box>
    );
}
