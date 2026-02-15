'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

interface CategoryItem {
  _id: string;
  title: string;
}

export default function EditShippingRulePage() {
  const router = useRouter();
  const { id } = useParams();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    storeId: '',
    geoGroupId: '',
    rateType: 'flat' as 'flat' | 'per_kg' | 'free' | 'percentage',
    rate: 0,
    minCharge: '',
    minWeight: '',
    maxWeight: '',
    minOrderValue: '',
    maxOrderValue: '',
    estimatedDays: '',
    priority: 0,
    isActive: true,
  });

  // Store categories with names for display
  const [selectedCategories, setSelectedCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    fetchStores();
    if (id) fetchShippingRule();
  }, [id]);

  const fetchStores = async () => {
    try {
      const response = await api.get('/stores');
      setStores(response.data.stores || response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch stores');
    }
  };

  const fetchShippingRule = async () => {
    try {
      const response = await api.get(`/shipping/rules/${id}`);
      const rule = response.data.data || response.data.shippingRule;
      setFormData({
        name: rule.name || '',
        description: rule.description || '',
        storeId: rule.storeId?._id || rule.storeId || '',
        geoGroupId: rule.geoGroupId?._id || rule.geoGroupId || '',
        rateType: rule.rateType || 'flat',
        rate: rule.rate || 0,
        minCharge: rule.minCharge?.toString() || '',
        minWeight: rule.minWeight?.toString() || '',
        maxWeight: rule.maxWeight?.toString() || '',
        minOrderValue: rule.minOrderValue?.toString() || '',
        maxOrderValue: rule.maxOrderValue?.toString() || '',
        estimatedDays: rule.estimatedDays || '',
        priority: rule.priority || 0,
        isActive: rule.isActive ?? true,
      });
      // Populate categories with names
      if (rule.categoryIds && Array.isArray(rule.categoryIds)) {
        setSelectedCategories(rule.categoryIds.map((c: any) => ({
          _id: c._id || c,
          title: c.title || c._id || c,
        })));
      }
    } catch (err: any) {
      showNotification('Failed to load shipping rule', 'error');
      router.push('/shipping');
    } finally {
      setLoading(false);
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
    setSaving(true);

    try {
      const payload = {
        ...formData,
        geoGroupId: formData.geoGroupId || undefined,
        categoryIds: selectedCategories.length > 0 ? selectedCategories.map(c => c._id) : undefined,
        minCharge: formData.minCharge ? parseFloat(formData.minCharge) : undefined,
        minWeight: formData.minWeight ? parseFloat(formData.minWeight) : undefined,
        maxWeight: formData.maxWeight ? parseFloat(formData.maxWeight) : undefined,
        minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : undefined,
        maxOrderValue: formData.maxOrderValue ? parseFloat(formData.maxOrderValue) : undefined,
      };

      await api.put(`/shipping/rules/${id}`, payload);
      showNotification('Shipping rule updated successfully', 'success');
      router.push('/shipping');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to update shipping rule', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => router.back()}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">Edit Shipping Rule</Typography>
      </Box>

      <Box sx={{ position: 'relative' }}>
        {loading && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderRadius: 1,
          }}>
            <LoadingSpinner />
          </Box>
        )}
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
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Store</InputLabel>
                  <Select
                    value={formData.storeId}
                    label="Store"
                    disabled // Cannot change store on edit
                  >
                    {stores.map(store => (
                      <MenuItem key={store._id} value={store._id}>{store.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Estimated Delivery (e.g., 3-5 business days)"
                  value={formData.estimatedDays}
                  onChange={handleChange('estimatedDays')}
                  placeholder="3-7 business days"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description"
                  value={formData.description}
                  onChange={handleChange('description')}
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
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CategoryAutocomplete
                  storeId={formData.storeId}
                  value={null}
                  onChange={handleCategoryChange}
                  label="Add Category"
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
              <Grid size={{ xs: 12, md: 6 }}>
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
              <Grid size={{ xs: 12, md: 6 }}>
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Minimum Charge (Optional)"
                  value={formData.minCharge}
                  onChange={handleChange('minCharge')}
                  helperText="If calculated cost is below this, minimum charge is applied"
                  inputProps={{ min: 0, step: 0.01 }}
                />
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
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </form>
      </Box>
    </Box>
  );
}
