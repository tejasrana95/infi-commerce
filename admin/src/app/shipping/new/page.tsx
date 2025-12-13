'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { LoadingSpinner } from '@/components/atoms';
import { GeoGroupAutocomplete } from '@/components/molecules';
import CategoryAutocomplete from '@/components/molecules/CategoryAutocomplete';

interface Store {
  _id: string;
  name: string;
}

export default function NewShippingRulePage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    storeId: '',
    geoGroupId: '',
    rateType: 'flat' as 'flat' | 'per_kg' | 'free' | 'percentage',
    rate: 0,
    currency: 'USD',
    minWeight: '',
    maxWeight: '',
    minOrderValue: '',
    maxOrderValue: '',
    priority: 0,
    isActive: true,
  });

  // Store categories with names for display
  const [selectedCategories, setSelectedCategories] = useState<Array<{ _id: string; title: string }>>([]);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await api.get('/stores');
      setStores(response.data.stores || response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch stores');
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleCategoryChange = (categoryId: string | null, category?: any) => {
    if (categoryId && category && !selectedCategories.find(c => c._id === categoryId)) {
      setSelectedCategories([...selectedCategories, { _id: categoryId, title: category.title }]);
    }
  };

  const removeCategory = (categoryId: string) => {
    setSelectedCategories(selectedCategories.filter(c => c._id !== categoryId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        geoGroupId: formData.geoGroupId || undefined,
        categoryIds: selectedCategories.length > 0 ? selectedCategories.map(c => c._id) : undefined,
        minWeight: formData.minWeight ? parseFloat(formData.minWeight) : undefined,
        maxWeight: formData.maxWeight ? parseFloat(formData.maxWeight) : undefined,
        minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : undefined,
        maxOrderValue: formData.maxOrderValue ? parseFloat(formData.maxOrderValue) : undefined,
      };

      await api.post('/shipping/rules', payload);
      showNotification('Shipping rule created successfully', 'success');
      router.push('/shipping');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to create shipping rule', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => router.back()}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">New Shipping Rule</Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Basic Information</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                label="Rule Name"
                value={formData.name}
                onChange={handleChange('name')}
                placeholder="e.g., Standard Shipping"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Store</InputLabel>
                <Select
                  value={formData.storeId}
                  label="Store"
                  onChange={(e) => { setFormData({ ...formData, storeId: e.target.value, geoGroupId: '' }); setSelectedCategories([]); }}
                >
                  {stores.map(store => (
                    <MenuItem key={store._id} value={store._id}>{store.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                placeholder="Delivery within 3-5 business days"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Geographic & Category Restrictions */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Restrictions</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Leave empty to apply to all countries/categories
          </Alert>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <GeoGroupAutocomplete
                storeId={formData.storeId}
                value={formData.geoGroupId || null}
                onChange={(value) => setFormData({ ...formData, geoGroupId: value || '' })}
                label="Geo Group (Countries)"
                placeholder="Select geo group..."
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <CategoryAutocomplete
                storeId={formData.storeId}
                value={null}
                onChange={handleCategoryChange}
                label="Add Category"
                placeholder="Select categories..."
              />
            </Grid>
            {selectedCategories.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Selected Categories:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {selectedCategories.map(cat => (
                    <Chip
                      key={cat._id}
                      label={cat.title}
                      onDelete={() => removeCategory(cat._id)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Rate Configuration */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Rate Configuration</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth required>
                <InputLabel>Rate Type</InputLabel>
                <Select
                  value={formData.rateType}
                  label="Rate Type"
                  onChange={(e) => setFormData({ ...formData, rateType: e.target.value as any })}
                >
                  <MenuItem value="flat">Flat Rate</MenuItem>
                  <MenuItem value="per_kg">Per KG</MenuItem>
                  <MenuItem value="percentage">Percentage of Order</MenuItem>
                  <MenuItem value="free">Free Shipping</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                required={formData.rateType !== 'free'}
                type="number"
                label={formData.rateType === 'percentage' ? 'Rate (%)' : 'Rate'}
                value={formData.rate}
                onChange={handleChange('rate')}
                disabled={formData.rateType === 'free'}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth required>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={formData.currency}
                  label="Currency"
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  disabled={formData.rateType === 'free'}
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                  <MenuItem value="INR">INR</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Conditions */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Conditions (Optional)</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Min Weight (kg)"
                value={formData.minWeight}
                onChange={handleChange('minWeight')}
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Max Weight (kg)"
                value={formData.maxWeight}
                onChange={handleChange('maxWeight')}
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Min Order Value"
                value={formData.minOrderValue}
                onChange={handleChange('minOrderValue')}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Max Order Value"
                value={formData.maxOrderValue}
                onChange={handleChange('maxOrderValue')}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Priority & Status */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Priority"
                value={formData.priority}
                onChange={handleChange('priority')}
                helperText="Higher priority rules are evaluated first"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Actions */}
        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create Shipping Rule'}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
