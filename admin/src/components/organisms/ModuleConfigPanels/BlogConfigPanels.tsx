'use client';

import {
    Box,
    Typography,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    TextField,
    Slider,
    FormControlLabel,
    Switch,
} from '@mui/material';

// ============================================
// Blog Grid / Blog Listing Config
// ============================================

export interface BlogGridConfig {
    title?: string;
    numberOfPosts?: number;
    columns?: 2 | 3 | 4;
    filterByCategory?: string;
    filterByTag?: string;
    sortBy?: 'date' | 'views' | 'likes';
    showFeaturedOnly?: boolean;
    showImage?: boolean;
    showExcerpt?: boolean;
    showAuthor?: boolean;
    showDate?: boolean;
    showReadingTime?: boolean;
    showViewCount?: boolean;
    allowViewToggle?: boolean;
}

interface BlogGridConfigPanelProps {
    config: BlogGridConfig;
    onChange: (config: BlogGridConfig) => void;
}

export const defaultBlogGridConfig: BlogGridConfig = {
    title: 'Latest Posts',
    numberOfPosts: 6,
    columns: 3,
    sortBy: 'date',
    showFeaturedOnly: false,
    showImage: true,
    showExcerpt: true,
    showAuthor: true,
    showDate: true,
    showReadingTime: true,
    showViewCount: false,
    allowViewToggle: false,
};

export function BlogGridConfigPanel({ config, onChange }: BlogGridConfigPanelProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Module Title"
                value={config.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Latest Posts"
                fullWidth
            />

            <TextField
                label="Number of Posts"
                type="number"
                value={config.numberOfPosts || 6}
                onChange={(e) => handleChange('numberOfPosts', parseInt(e.target.value) || 6)}
                inputProps={{ min: 1, max: 24 }}
                fullWidth
            />

            <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                    Columns: {config.columns || 3}
                </Typography>
                <Slider
                    value={config.columns || 3}
                    onChange={(_, value) => handleChange('columns', value)}
                    min={2}
                    max={12}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                />
            </Box>

            <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                    value={config.sortBy || 'date'}
                    label="Sort By"
                    onChange={(e) => handleChange('sortBy', e.target.value)}
                >
                    <MenuItem value="date">Date (Newest First)</MenuItem>
                    <MenuItem value="views">Most Viewed</MenuItem>
                    <MenuItem value="likes">Most Liked</MenuItem>
                </Select>
            </FormControl>

            <FormControlLabel
                control={<Switch checked={config.showFeaturedOnly ?? false} onChange={(e) => handleChange('showFeaturedOnly', e.target.checked)} />}
                label="Show Featured Posts Only"
            />

            <Typography variant="subtitle2" sx={{ mt: 1 }}>Display Options</Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <FormControlLabel control={<Switch checked={config.showImage ?? true} onChange={(e) => handleChange('showImage', e.target.checked)} />} label="Image" />
                <FormControlLabel control={<Switch checked={config.showExcerpt ?? true} onChange={(e) => handleChange('showExcerpt', e.target.checked)} />} label="Excerpt" />
                <FormControlLabel control={<Switch checked={config.showAuthor ?? true} onChange={(e) => handleChange('showAuthor', e.target.checked)} />} label="Author" />
                <FormControlLabel control={<Switch checked={config.showDate ?? true} onChange={(e) => handleChange('showDate', e.target.checked)} />} label="Date" />
                <FormControlLabel control={<Switch checked={config.showReadingTime ?? true} onChange={(e) => handleChange('showReadingTime', e.target.checked)} />} label="Reading Time" />
                <FormControlLabel control={<Switch checked={config.showViewCount ?? false} onChange={(e) => handleChange('showViewCount', e.target.checked)} />} label="View Count" />
            </Box>

            <FormControlLabel
                control={<Switch checked={config.allowViewToggle ?? false} onChange={(e) => handleChange('allowViewToggle', e.target.checked)} />}
                label="Allow Grid/List View Toggle"
            />
        </Box>
    );
}

// ============================================
// Blog Categories Sidebar Config
// ============================================

export interface BlogCategoriesSidebarConfig {
    title?: string;
    maxCategories?: number;
    showCounts?: boolean;
    sortBy?: 'alphabetical' | 'postCount';
    layout?: 'vertical' | 'horizontal';
}

interface BlogCategoriesSidebarConfigPanelProps {
    config: BlogCategoriesSidebarConfig;
    onChange: (config: BlogCategoriesSidebarConfig) => void;
}

export const defaultBlogCategoriesSidebarConfig: BlogCategoriesSidebarConfig = {
    title: 'Categories',
    maxCategories: 10,
    showCounts: true,
    sortBy: 'postCount',
    layout: 'vertical',
};

export function BlogCategoriesSidebarConfigPanel({ config, onChange }: BlogCategoriesSidebarConfigPanelProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Title"
                value={config.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Categories"
                fullWidth
            />

            <TextField
                label="Max Categories"
                type="number"
                value={config.maxCategories || 10}
                onChange={(e) => handleChange('maxCategories', parseInt(e.target.value) || 10)}
                inputProps={{ min: 1, max: 50 }}
                fullWidth
            />

            <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                    value={config.sortBy || 'postCount'}
                    label="Sort By"
                    onChange={(e) => handleChange('sortBy', e.target.value)}
                >
                    <MenuItem value="postCount">Post Count</MenuItem>
                    <MenuItem value="alphabetical">Alphabetical</MenuItem>
                </Select>
            </FormControl>

            <FormControl fullWidth>
                <InputLabel>Layout</InputLabel>
                <Select
                    value={config.layout || 'vertical'}
                    label="Layout"
                    onChange={(e) => handleChange('layout', e.target.value)}
                >
                    <MenuItem value="vertical">Vertical List</MenuItem>
                    <MenuItem value="horizontal">Horizontal Pills</MenuItem>
                </Select>
            </FormControl>

            <FormControlLabel
                control={<Switch checked={config.showCounts ?? true} onChange={(e) => handleChange('showCounts', e.target.checked)} />}
                label="Show Post Counts"
            />
        </Box>
    );
}

// ============================================
// Recent Posts Config
// ============================================

export interface RecentPostsConfig {
    title?: string;
    numberOfPosts?: number;
    showThumbnail?: boolean;
    showDate?: boolean;
    showExcerpt?: boolean;
    layout?: 'vertical' | 'horizontal';
}

interface RecentPostsConfigPanelProps {
    config: RecentPostsConfig;
    onChange: (config: RecentPostsConfig) => void;
}

export const defaultRecentPostsConfig: RecentPostsConfig = {
    title: 'Recent Posts',
    numberOfPosts: 5,
    showThumbnail: true,
    showDate: true,
    showExcerpt: false,
    layout: 'vertical',
};

export function RecentPostsConfigPanel({ config, onChange }: RecentPostsConfigPanelProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Title"
                value={config.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Recent Posts"
                fullWidth
            />

            <TextField
                label="Number of Posts"
                type="number"
                value={config.numberOfPosts || 5}
                onChange={(e) => handleChange('numberOfPosts', parseInt(e.target.value) || 5)}
                inputProps={{ min: 1, max: 20 }}
                fullWidth
            />

            <FormControl fullWidth>
                <InputLabel>Layout</InputLabel>
                <Select
                    value={config.layout || 'vertical'}
                    label="Layout"
                    onChange={(e) => handleChange('layout', e.target.value)}
                >
                    <MenuItem value="vertical">Vertical (Stacked)</MenuItem>
                    <MenuItem value="horizontal">Horizontal</MenuItem>
                </Select>
            </FormControl>

            <FormControlLabel control={<Switch checked={config.showThumbnail ?? true} onChange={(e) => handleChange('showThumbnail', e.target.checked)} />} label="Show Thumbnail" />
            <FormControlLabel control={<Switch checked={config.showDate ?? true} onChange={(e) => handleChange('showDate', e.target.checked)} />} label="Show Date" />
            <FormControlLabel control={<Switch checked={config.showExcerpt ?? false} onChange={(e) => handleChange('showExcerpt', e.target.checked)} />} label="Show Excerpt" />
        </Box>
    );
}

// ============================================
// Popular Posts Config
// ============================================

export interface PopularPostsConfig {
    title?: string;
    numberOfPosts?: number;
    metric?: 'views' | 'likes' | 'comments';
    timePeriod?: 'week' | 'month' | 'all';
    showThumbnail?: boolean;
    showRanking?: boolean;
    showStats?: boolean;
}

interface PopularPostsConfigPanelProps {
    config: PopularPostsConfig;
    onChange: (config: PopularPostsConfig) => void;
}

export const defaultPopularPostsConfig: PopularPostsConfig = {
    title: 'Popular Posts',
    numberOfPosts: 5,
    metric: 'views',
    timePeriod: 'month',
    showThumbnail: true,
    showRanking: true,
    showStats: true,
};

export function PopularPostsConfigPanel({ config, onChange }: PopularPostsConfigPanelProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Title"
                value={config.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Popular Posts"
                fullWidth
            />

            <TextField
                label="Number of Posts"
                type="number"
                value={config.numberOfPosts || 5}
                onChange={(e) => handleChange('numberOfPosts', parseInt(e.target.value) || 5)}
                inputProps={{ min: 1, max: 20 }}
                fullWidth
            />

            <FormControl fullWidth>
                <InputLabel>Popularity Metric</InputLabel>
                <Select
                    value={config.metric || 'views'}
                    label="Popularity Metric"
                    onChange={(e) => handleChange('metric', e.target.value)}
                >
                    <MenuItem value="views">Most Viewed</MenuItem>
                    <MenuItem value="likes">Most Liked</MenuItem>
                </Select>
            </FormControl>

            <FormControl fullWidth>
                <InputLabel>Time Period</InputLabel>
                <Select
                    value={config.timePeriod || 'month'}
                    label="Time Period"
                    onChange={(e) => handleChange('timePeriod', e.target.value)}
                >
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                    <MenuItem value="all">All Time</MenuItem>
                </Select>
            </FormControl>

            <FormControlLabel control={<Switch checked={config.showThumbnail ?? true} onChange={(e) => handleChange('showThumbnail', e.target.checked)} />} label="Show Thumbnail" />
            <FormControlLabel control={<Switch checked={config.showRanking ?? true} onChange={(e) => handleChange('showRanking', e.target.checked)} />} label="Show Ranking Number" />
            <FormControlLabel control={<Switch checked={config.showStats ?? true} onChange={(e) => handleChange('showStats', e.target.checked)} />} label="Show Stats" />
        </Box>
    );
}

// ============================================
// Tags Cloud Config
// ============================================

export interface TagsCloudConfig {
    title?: string;
    maxTags?: number;
    sizeVariation?: boolean;
    colorScheme?: 'default' | 'gradient' | 'monochrome';
    layout?: 'cloud' | 'list';
}

interface TagsCloudConfigPanelProps {
    config: TagsCloudConfig;
    onChange: (config: TagsCloudConfig) => void;
}

export const defaultTagsCloudConfig: TagsCloudConfig = {
    title: 'Popular Tags',
    maxTags: 20,
    sizeVariation: true,
    colorScheme: 'default',
    layout: 'cloud',
};

export function TagsCloudConfigPanel({ config, onChange }: TagsCloudConfigPanelProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Title"
                value={config.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Popular Tags"
                fullWidth
            />

            <TextField
                label="Max Tags"
                type="number"
                value={config.maxTags || 20}
                onChange={(e) => handleChange('maxTags', parseInt(e.target.value) || 20)}
                inputProps={{ min: 5, max: 50 }}
                fullWidth
            />

            <FormControl fullWidth>
                <InputLabel>Layout</InputLabel>
                <Select
                    value={config.layout || 'cloud'}
                    label="Layout"
                    onChange={(e) => handleChange('layout', e.target.value)}
                >
                    <MenuItem value="cloud">Tag Cloud</MenuItem>
                    <MenuItem value="list">List</MenuItem>
                </Select>
            </FormControl>

            <FormControl fullWidth>
                <InputLabel>Color Scheme</InputLabel>
                <Select
                    value={config.colorScheme || 'default'}
                    label="Color Scheme"
                    onChange={(e) => handleChange('colorScheme', e.target.value)}
                >
                    <MenuItem value="default">Default</MenuItem>
                    <MenuItem value="gradient">Gradient</MenuItem>
                    <MenuItem value="monochrome">Monochrome</MenuItem>
                </Select>
            </FormControl>

            <FormControlLabel
                control={<Switch checked={config.sizeVariation ?? true} onChange={(e) => handleChange('sizeVariation', e.target.checked)} />}
                label="Size Variation (popular tags larger)"
            />
        </Box>
    );
}

// ============================================
// Newsletter Signup Config
// ============================================

export interface NewsletterSignupConfig {
    title?: string;
    subtitle?: string;
    buttonText?: string;
    placeholder?: string;
    showNameField?: boolean;
    successMessage?: string;
}

interface NewsletterSignupConfigPanelProps {
    config: NewsletterSignupConfig;
    onChange: (config: NewsletterSignupConfig) => void;
}

export const defaultNewsletterSignupConfig: NewsletterSignupConfig = {
    title: 'Subscribe to Newsletter',
    subtitle: 'Get the latest posts delivered to your inbox',
    buttonText: 'Subscribe',
    placeholder: 'Enter your email',
    showNameField: false,
    successMessage: 'Thank you for subscribing!',
};

export function NewsletterSignupConfigPanel({ config, onChange }: NewsletterSignupConfigPanelProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Title"
                value={config.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Subscribe to Newsletter"
                fullWidth
            />

            <TextField
                label="Subtitle"
                value={config.subtitle || ''}
                onChange={(e) => handleChange('subtitle', e.target.value)}
                placeholder="e.g., Get the latest posts delivered..."
                fullWidth
                multiline
                rows={2}
            />

            <TextField
                label="Button Text"
                value={config.buttonText || ''}
                onChange={(e) => handleChange('buttonText', e.target.value)}
                placeholder="e.g., Subscribe"
                fullWidth
            />

            <TextField
                label="Email Placeholder"
                value={config.placeholder || ''}
                onChange={(e) => handleChange('placeholder', e.target.value)}
                placeholder="e.g., Enter your email"
                fullWidth
            />

            <TextField
                label="Success Message"
                value={config.successMessage || ''}
                onChange={(e) => handleChange('successMessage', e.target.value)}
                placeholder="e.g., Thank you for subscribing!"
                fullWidth
            />

            <FormControlLabel
                control={<Switch checked={config.showNameField ?? false} onChange={(e) => handleChange('showNameField', e.target.checked)} />}
                label="Show Name Field"
            />
        </Box>
    );
}

// ============================================
// Author Card Config
// ============================================

export interface AuthorCardConfig {
    showAvatar?: boolean;
    showBio?: boolean;
    showSocialLinks?: boolean;
    layout?: 'horizontal' | 'vertical';
}

interface AuthorCardConfigPanelProps {
    config: AuthorCardConfig;
    onChange: (config: AuthorCardConfig) => void;
}

export const defaultAuthorCardConfig: AuthorCardConfig = {
    showAvatar: true,
    showBio: true,
    showSocialLinks: true,
    layout: 'horizontal',
};

export function AuthorCardConfigPanel({ config, onChange }: AuthorCardConfigPanelProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
                💡 Author information is pulled from the current blog post&apos;s author data.
            </Typography>

            <FormControl fullWidth>
                <InputLabel>Layout</InputLabel>
                <Select
                    value={config.layout || 'horizontal'}
                    label="Layout"
                    onChange={(e) => handleChange('layout', e.target.value)}
                >
                    <MenuItem value="horizontal">Horizontal</MenuItem>
                    <MenuItem value="vertical">Vertical (Stacked)</MenuItem>
                </Select>
            </FormControl>

            <FormControlLabel control={<Switch checked={config.showAvatar ?? true} onChange={(e) => handleChange('showAvatar', e.target.checked)} />} label="Show Avatar" />
            <FormControlLabel control={<Switch checked={config.showBio ?? true} onChange={(e) => handleChange('showBio', e.target.checked)} />} label="Show Bio" />
            <FormControlLabel control={<Switch checked={config.showSocialLinks ?? true} onChange={(e) => handleChange('showSocialLinks', e.target.checked)} />} label="Show Social Links" />
        </Box>
    );
}
