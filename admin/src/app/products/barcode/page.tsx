'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
  useTheme,
  Chip,
  Avatar,
  TextField,
  FormControlLabel,
  Switch,
  Checkbox,
  RadioGroup,
  Radio,
  Divider,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridRowSelectionModel } from '@mui/x-data-grid';
import { Download, Printer, QrCode, Ticket, FileText } from 'lucide-react';
import api from '@/lib/api';
import { Product } from '@/types';
import { PageHeader, SearchFilterBar } from '@/components/molecules';
import { useNotification } from '@/contexts/NotificationContext';
import { createDataGridStyles } from '@/utils/styles';

type BarcodeFormat = 'CODE128' | 'EAN13' | 'QR';
type PrinterType = 'regular' | 'label';

interface PrintOptions {
  labelSizes: Array<{ key: string; name: string }>;
  pageSizes: Array<{ key: string; name: string }>;
  gridLayouts: Array<{ key: string; name: string; cols: number; rows: number }>;
  barcodeFormats: string[];
}

export default function BulkBarcodeGeneratorPage() {
  const theme = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set(),
  });

  // Settings
  const [printerType, setPrinterType] = useState<PrinterType>('regular');
  const [labelSize, setLabelSize] = useState('standard');
  const [pageSize, setPageSize] = useState('letter');
  const [layout, setLayout] = useState('3x4');
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>('CODE128');

  // Advanced Options
  const [repeatToFill, setRepeatToFill] = useState(false);
  const [includeName, setIncludeName] = useState(true);
  const [includePrice, setIncludePrice] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [generating, setGenerating] = useState(false);
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    labelSizes: [],
    pageSizes: [],
    gridLayouts: [],
    barcodeFormats: [],
  });

  const { showNotification } = useNotification();
  const dataGridStyles = useMemo(() => createDataGridStyles(theme), [theme]);

  // Fetch print options on mount
  useEffect(() => {
    fetchPrintOptions();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch products when search changes
  useEffect(() => {
    if (debouncedSearch) {
      fetchProducts();
    } else {
      setProducts([]);
    }
  }, [debouncedSearch]);

  const fetchPrintOptions = async () => {
    try {
      const response = await api.get('/barcode/print-options');
      setPrintOptions(response.data.data);
    } catch (error) {
      console.error('Failed to load print options:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      params.append('limit', '100');
      params.append('isActive', 'all');

      const response = await api.get(`/products?${params.toString()}`);
      setProducts(response.data.products || []);

      // Initialize quantities for new products
      const newQuantities = { ...quantities };
      response.data.products.forEach((p: Product) => {
        if (!newQuantities[p._id]) {
          newQuantities[p._id] = 1;
        }
      });
      setQuantities(newQuantities);
    } catch (error) {
      showNotification('Failed to load products', 'error');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (id: string, value: string) => {
    const qty = parseInt(value) || 1;
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, qty)
    }));
  };

  const handleGeneratePDF = async () => {
    if (selectedRows.ids.size === 0) {
      showNotification('Please select at least one product', 'warning');
      return;
    }

    try {
      setGenerating(true);
      const selectedIds = Array.from(selectedRows.ids) as string[];

      // Prepare quantities array
      const quantityList = selectedIds.map(id => ({
        productId: id,
        quantity: quantities[id] || 1
      }));

      const response = await api.post(
        '/barcode/print-batch',
        {
          productIds: selectedIds,
          printerType,
          labelSize: printerType === 'label' ? labelSize : undefined,
          pageSize: printerType === 'regular' ? pageSize : undefined,
          layout: printerType === 'regular' ? layout : undefined,
          format: barcodeFormat,
          quantities: quantityList,
          repeatToFill,
          includeName,
          includePrice,
        },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = printerType === 'label'
        ? `labels-${labelSize}-${new Date().toISOString().split('T')[0]}.pdf`
        : `barcodes-${layout}-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      showNotification('Barcode PDF generated successfully', 'success');
    } catch (error: any) {
      showNotification(
        error.response?.data?.message || 'Failed to generate PDF',
        'error'
      );
    } finally {
      setGenerating(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'image',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <Avatar
            src={params.row.featuredImage || params.row.images?.[0]}
            alt={params.row.name}
            variant="rounded"
            sx={{ width: 40, height: 40 }}
          />
        </Box>
      ),
    },
    {
      field: 'name',
      headerName: 'Product',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <Typography variant="body2" fontWeight={600}>
            {params.row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            SKU: {params.row.sku}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'sku',
      headerName: 'Barcode',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
          <Typography variant="body2" fontFamily="monospace">
            {params.row.barcode || params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'quantity',
      headerName: 'Print Qty',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center" height="100%" onClick={(e) => e.stopPropagation()}>
          <TextField
            size="small"
            type="number"
            value={quantities[params.row._id] || 1}
            onChange={(e) => handleQuantityChange(params.row._id, e.target.value)}
            inputProps={{ min: 1, style: { padding: '4px 8px' } }}
            sx={{ width: 80 }}
          />
        </Box>
      ),
    },
  ];

  const totalLabels = Array.from(selectedRows.ids).reduce((sum: number, id) => {
    return sum + (quantities[id as string] || 1);
  }, 0);

  const labelsPerPage = useMemo(() => {
    if (printerType === 'label') return 1;
    const currentLayout = printOptions.gridLayouts.find(l => l.key === layout);
    return currentLayout ? currentLayout.cols * currentLayout.rows : 12;
  }, [printerType, layout, printOptions.gridLayouts]);

  const sheetsNeeded = Math.ceil(totalLabels / labelsPerPage);

  return (
    <Box>
      <PageHeader
        title="Barcode Generator"
        subtitle="Generate barcode labels for products"
      />

      <SearchFilterBar
        searchPlaceholder="Search products by name or SKU..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[]}
        activeFilters={{}}
        onFilterChange={() => { }}
      />

      <Box sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          {/* Settings Panel */}
          <Box sx={{ width: { xs: '100%', lg: 350 } }}>
            <Stack spacing={3}>
              {/* Printer Type */}
              <Card>
                <CardHeader title="Printer Settings" />
                <CardContent>
                  <Stack spacing={2}>
                    <FormControl component="fieldset">
                      <RadioGroup
                        value={printerType}
                        onChange={(e) => setPrinterType(e.target.value as PrinterType)}
                      >
                        <Stack direction="row" spacing={2}>
                          <FormControlLabel
                            value="regular"
                            control={<Radio size="small" />}
                            label={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Printer size={16} />
                                <Typography variant="body2">Regular Printer</Typography>
                              </Box>
                            }
                          />
                          <FormControlLabel
                            value="label"
                            control={<Radio size="small" />}
                            label={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Ticket size={16} />
                                <Typography variant="body2">Label Printer</Typography>
                              </Box>
                            }
                          />
                        </Stack>
                      </RadioGroup>
                    </FormControl>

                    <Divider />

                    {printerType === 'label' ? (
                      <FormControl fullWidth size="small">
                        <InputLabel>Label Size</InputLabel>
                        <Select
                          value={labelSize}
                          onChange={(e) => setLabelSize(e.target.value)}
                          label="Label Size"
                        >
                          {printOptions.labelSizes.map((opt) => (
                            <MenuItem key={opt.key} value={opt.key}>
                              {opt.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <>
                        <FormControl fullWidth size="small">
                          <InputLabel>Page Size</InputLabel>
                          <Select
                            value={pageSize}
                            onChange={(e) => setPageSize(e.target.value)}
                            label="Page Size"
                          >
                            {printOptions.pageSizes.map((opt) => (
                              <MenuItem key={opt.key} value={opt.key}>
                                {opt.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                          <InputLabel>Grid Layout</InputLabel>
                          <Select
                            value={layout}
                            onChange={(e) => setLayout(e.target.value)}
                            label="Grid Layout"
                          >
                            {printOptions.gridLayouts.map((opt) => (
                              <MenuItem key={opt.key} value={opt.key}>
                                {opt.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={repeatToFill}
                              onChange={(e) => setRepeatToFill(e.target.checked)}
                              size="small"
                            />
                          }
                          label={
                            <Typography variant="body2">
                              Repeat to fill page
                              <Typography component="span" variant="caption" display="block" color="text.secondary">
                                Fill empty slots with repeated codes
                              </Typography>
                            </Typography>
                          }
                        />
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Content Options */}
              <Card>
                <CardHeader title="Label Content" />
                <CardContent>
                  <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Barcode Format</InputLabel>
                      <Select
                        value={barcodeFormat}
                        onChange={(e) => setBarcodeFormat(e.target.value as BarcodeFormat)}
                        label="Barcode Format"
                      >
                        <MenuItem value="CODE128">CODE 128</MenuItem>
                        <MenuItem value="EAN13">EAN-13</MenuItem>
                        <MenuItem value="QR">QR Code</MenuItem>
                      </Select>
                    </FormControl>

                    <Box>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={includeName}
                            onChange={(e) => setIncludeName(e.target.checked)}
                          />
                        }
                        label="Show Product Name"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={includePrice}
                            onChange={(e) => setIncludePrice(e.target.checked)}
                          />
                        }
                        label="Show Price"
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Summary & Actions */}
              <Card>
                <CardHeader title="Summary" />
                <CardContent>
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Total Labels:</Typography>
                      <Typography variant="body2" fontWeight={600}>{totalLabels}</Typography>
                    </Box>

                    {printerType === 'regular' && (
                      <>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Labels per Sheet:</Typography>
                          <Typography variant="body2" fontWeight={600}>{labelsPerPage}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Sheets Needed:</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {repeatToFill ? Math.ceil(totalLabels / labelsPerPage) || 1 : sheetsNeeded}
                          </Typography>
                        </Box>
                      </>
                    )}

                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleGeneratePDF}
                      disabled={selectedRows.ids.size === 0 || generating}
                      startIcon={generating ? null : <Download size={18} />}
                    >
                      {generating ? 'Generating...' : 'Download PDF'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Box>

          {/* Products Table */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Card>
              <CardHeader
                title="Select Products"
                subheader={
                  selectedRows.ids.size > 0
                    ? `${selectedRows.ids.size} product${selectedRows.ids.size !== 1 ? 's' : ''} selected`
                    : 'Search and select products to print'
                }
              />
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ height: 600, width: '100%' }}>
                  <DataGrid
                    rows={products}
                    columns={columns}
                    getRowId={(row) => row._id}
                    loading={loading}
                    checkboxSelection
                    disableRowSelectionOnClick
                    rowSelectionModel={selectedRows}
                    onRowSelectionModelChange={setSelectedRows}
                    pageSizeOptions={[25, 50, 100]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    sx={{
                      ...dataGridStyles,
                      border: 'none',
                      '& .MuiDataGrid-main': {
                        border: 'none',
                      },
                    }}
                    rowHeight={60}
                    slots={{
                      noRowsOverlay: () => (
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            gap: 2,
                          }}
                        >
                          <QrCode size={48} style={{ color: '#9ca3af' }} />
                          <Typography variant="body2" color="text.secondary">
                            {searchQuery
                              ? 'No products found. Try a different search.'
                              : 'Search for products to generate barcodes'}
                          </Typography>
                        </Box>
                      ),
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
