'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Paper,
    TextField,
    MenuItem,
    Button,
    Typography,
    FormControlLabel,
    Switch,
    Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PageHeader } from '@/components/molecules';
import StoreAutocomplete from '@/components/molecules/StoreAutocomplete';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/lib/api';
import { LayoutType } from '@/types';

const layoutTypes: { value: LayoutType; label: string; description: string }[] = [
    { value: 'homepage', label: 'Homepage', description: 'Main landing page of the store' },
    { value: 'category', label: 'Category Page', description: 'Product category listing pages' },
    { value: 'product', label: 'Product Page', description: 'Individual product detail pages' },
    { value: 'search', label: 'Search Results', description: 'Search results page' },
    { value: 'blog-list', label: 'Blog Listing', description: 'Blog posts list page' },
    { value: 'blog-post', label: 'Blog Post', description: 'Individual blog post pages' },
    { value: 'page', label: 'Static Page', description: 'Static content pages (About, Contact, etc.)' },
    { value: 'cart', label: 'Cart Page', description: 'Shopping cart page' },
    { value: 'checkout', label: 'Checkout Page', description: 'Checkout flow pages' },
    { value: 'account', label: 'Account Page', description: 'Customer account pages' },
];

export default function NewLayoutPage() {
    const router = useRouter();
    const { showNotification } = useNotification();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'homepage' as LayoutType,
        slug: '',
        storeId: '',
        isDefault: false,
        status: 'draft' as 'draft' | 'published',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Types that support slug-specific layouts
    const slugSupportedTypes: LayoutType[] = ['category', 'product', 'blog-post', 'page'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showNotification('Layout name is required', 'error');
            return;
        }
        if (!formData.storeId) {
            showNotification('Store is required', 'error');
            return;
        }

        try {
            setIsSubmitting(true);
            const payload: any = {
                ...formData,
                sections: [], // Start with empty sections
                settings: {},
            };
            // Only include slug if it has a value and type supports it
            if (formData.slug && slugSupportedTypes.includes(formData.type)) {
                payload.slug = formData.slug.toLowerCase().trim();
            } else {
                delete payload.slug;
            }
            const response = await api.post('/layouts', payload);

            showNotification('Layout created successfully', 'success');
            // Navigate to the layout designer
            router.push(`/layouts/${response.data.layout._id}`);
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Failed to create layout', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedType = layoutTypes.find((t) => t.value === formData.type);

    return (
        <Box>
            <PageHeader
                title="Create Layout"
                subtitle="Design a new page layout for your storefront"
                backUrl="/layouts"
            />

            <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }}>
                            <StoreAutocomplete
                                value={formData.storeId || null}
                                onChange={(storeId) => setFormData({ ...formData, storeId: (typeof storeId === 'string' ? storeId : '') || '' })}
                                label="Store"
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Layout Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                fullWidth
                                required
                                placeholder="e.g., Holiday Homepage, Summer Collection"
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Optional description for this layout"
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                select
                                label="Layout Type"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as LayoutType })}
                                fullWidth
                                required
                                helperText={selectedType?.description}
                            >
                                {layoutTypes.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        {/* Slug field - only show for types that support slug-specific layouts */}
                        {slugSupportedTypes.includes(formData.type) && (
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    label="Page Slug (Optional)"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-/]/g, '') })}
                                    fullWidth
                                    placeholder="e.g., about, marble-statues, category/summer-collection"
                                    helperText="Leave empty for a default layout. Enter a slug to create a page-specific layout and only slug not the prefix  (e.g., 'about' for /about, 'electronics' for /electronics)."
                                />
                            </Grid>
                        )}

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                select
                                label="Status"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                                fullWidth
                            >
                                <MenuItem value="draft">Draft</MenuItem>
                                <MenuItem value="published">Published</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.isDefault}
                                        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                    />
                                }
                                label="Set as default layout for this page type"
                            />
                            <Typography variant="caption" color="text.secondary" display="block">
                                Only one layout can be default per type per store
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                <Button variant="outlined" onClick={() => router.push('/layouts')}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Creating...' : 'Create & Design'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
}
