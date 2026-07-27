'use client';

import {
    Box,
    Typography,
    TextField,
    FormControlLabel,
    Switch,
    Paper,
    Grid,
} from '@mui/material';
import { ThemeConfig, BlogConfig } from '@/types';

export const DEFAULT_BLOG_CONFIG: BlogConfig = {
    showViewCount: true,
    showReadingTime: true,
    showFavorite: true,
    showAuthorName: true,
    authorAlias: '',
    showShareButtons: true,
    showRelatedProducts: true,
    showTags: true,
    showRelatedArticles: true,
    showFeaturedImage: true,
    showCategories: true,
};

interface BlogSettingsProps {
    config: ThemeConfig;
    onChange: (config: ThemeConfig) => void;
}

export default function BlogSettings({ config, onChange }: BlogSettingsProps) {
    const blog: BlogConfig = { ...DEFAULT_BLOG_CONFIG, ...config.blog };

    const handleChange = <K extends keyof BlogConfig>(key: K, value: BlogConfig[K]) => {
        onChange({
            ...config,
            blog: {
                ...blog,
                [key]: value,
            },
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
                Blog & Article Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Configure global display settings, element visibility, author branding, and social sharing options for blog posts across your storefront.
            </Typography>

            {/* Author Settings */}
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Author & Attribution
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Control how author information and branding are displayed on blog posts.
                </Typography>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={blog.showAuthorName ?? true}
                                    onChange={(e) => handleChange('showAuthorName', e.target.checked)}
                                />
                            }
                            label="Show Blog Author Name"
                        />
                    </Grid>

                    {blog.showAuthorName !== false && (
                        <Grid size={{ xs: 12, sm: 8, md: 6 }}>
                            <TextField
                                label="Author Alias (Optional)"
                                fullWidth
                                variant="outlined"
                                value={blog.authorAlias || ''}
                                onChange={(e) => handleChange('authorAlias', e.target.value)}
                                helperText="Replaces real author name across all blog posts if specified (e.g. 'Editorial Team' or 'Store Admin'). Leave blank to show real author name."
                                placeholder="e.g. InfiCommerce Team"
                            />
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {/* Post Elements & Metrics */}
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Post Elements & Engagement
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Toggle visibility of key post metadata, view counts, favorite buttons, and social share links.
                </Typography>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={blog.showViewCount ?? true}
                                    onChange={(e) => handleChange('showViewCount', e.target.checked)}
                                />
                            }
                            label="Show View Count"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={blog.showReadingTime ?? true}
                                    onChange={(e) => handleChange('showReadingTime', e.target.checked)}
                                />
                            }
                            label="Show Reading Time"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={blog.showFavorite ?? true}
                                    onChange={(e) => handleChange('showFavorite', e.target.checked)}
                                />
                            }
                            label="Show Favorite / Like Button & Count"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={blog.showShareButtons ?? true}
                                    onChange={(e) => handleChange('showShareButtons', e.target.checked)}
                                />
                            }
                            label="Show Social Share Buttons"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={blog.showFeaturedImage ?? true}
                                    onChange={(e) => handleChange('showFeaturedImage', e.target.checked)}
                                />
                            }
                            label="Show Featured Hero Image"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={blog.showCategories ?? true}
                                    onChange={(e) => handleChange('showCategories', e.target.checked)}
                                />
                            }
                            label="Show Category Badges"
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Content Extensions */}
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Related Content & Products
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Control sections shown below blog posts like linked products, related articles, and tags.
                </Typography>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={blog.showRelatedProducts ?? true}
                                    onChange={(e) => handleChange('showRelatedProducts', e.target.checked)}
                                />
                            }
                            label="Show Linked / Related Products"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={blog.showRelatedArticles ?? true}
                                    onChange={(e) => handleChange('showRelatedArticles', e.target.checked)}
                                />
                            }
                            label="Show Related Articles"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={blog.showTags ?? true}
                                    onChange={(e) => handleChange('showTags', e.target.checked)}
                                />
                            }
                            label="Show Tags Section"
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
