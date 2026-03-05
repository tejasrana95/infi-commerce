import { useState } from 'react';
import {
    Box,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Typography,
    Tabs,
    Tab,
    Checkbox,
    FormControlLabel,
    TextField,
    CircularProgress,
    Alert,
    Grid,
    Zoom,
    Tooltip,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ChatIcon from '@mui/icons-material/Chat';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';

interface AdminAIAssistantProps {
    entityType: 'product' | 'category' | 'brand' | 'page' | 'blog_post';
    getValues: (field?: string) => unknown;
    setValue: (field: string, value: unknown, options?: Record<string, unknown>) => void;
}

interface GenerateOptions {
    productName: boolean;
    description: boolean;
    shortDescription: boolean;
    seo: boolean;
    tags: boolean;
}

export default function AdminAIAssistant({ entityType, getValues, setValue }: AdminAIAssistantProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    const [options, setOptions] = useState<GenerateOptions>({
        productName: true,
        description: true,
        shortDescription: true,
        seo: true,
        tags: true,
    });
    const { showNotification } = useNotification();

    // logical field mapping
    const isPageLike = ['page', 'blog_post'].includes(entityType);
    const titleField = isPageLike ? 'title' : 'name';
    const descriptionField = isPageLike ? 'content' : 'description';

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            // Gather context
            const entityTitle = getValues(titleField);

            if (!entityTitle) {
                showNotification(`Please enter a ${isPageLike ? 'title' : 'name'} first`, 'warning');
                setLoading(false);
                return;
            }

            const context = {
                entityType,
                entityTitle,
                primaryKeyword: entityTitle, // Use title as primary keyword for SEO/GEO
                title: entityTitle,
                images: getValues('images') || [],
                existingDescription: getValues(descriptionField),
                existingExcerpt: entityType === 'blog_post' ? getValues('excerpt') : undefined,
                brand: getValues('brand'),
                category: (getValues('categoryIds') as unknown[])?.[0],
                specifications: getValues('specifications') || [], // Pass all specifications
                specs: getValues('specs') || {}, // Alternative spec format
                attributes: getValues('attributes') || [], // Product attributes if available
                price: getValues('price'),
                stock: getValues('stock'),
                storeId: getValues('storeId'),
                // Add more context as needed
            };

            const fieldsToGenerate = [];
            if (activeTab === 0) { // Magic Fill
                if (options.productName) fieldsToGenerate.push('productName');
                if (options.description) fieldsToGenerate.push('description');
                if (options.shortDescription) fieldsToGenerate.push('shortDescription');
                if (options.seo) fieldsToGenerate.push('metaTitle', 'metaDescription', 'metaKeywords', 'focusKeyword', 'ogTitle', 'ogDescription');
                if (options.tags) fieldsToGenerate.push('tags');
            } else { // Custom Chat
                // Request all fields for custom instructions so fields can be populated if generated
                fieldsToGenerate.push(
                    'productName',
                    'description',
                    'shortDescription',
                    'excerpt',
                    'metaTitle',
                    'metaDescription',
                    'metaKeywords',
                    'focusKeyword',
                    'ogTitle',
                    'ogDescription',
                    'tags'
                );
            }

            const response = await api.post('/ai/admin/generate', {
                context,
                fields: fieldsToGenerate,
                instructions: activeTab === 1 ? customPrompt : undefined,
            });

            if (response.data.success) {
                const data = response.data.data;

                // Map API response to form fields - ONLY if that field was requested
                if (fieldsToGenerate.includes('productName') && data.productName) setValue(titleField, data.productName, { shouldDirty: true });
                if (fieldsToGenerate.includes('description') && data.description) setValue(descriptionField, data.description, { shouldDirty: true });
                if (fieldsToGenerate.includes('shortDescription') && data.shortDescription) {
                    // Blog posts use `excerpt`; products/categories/brands/pages use shortDescription where present.
                    if (entityType === 'blog_post') {
                        setValue('excerpt', data.shortDescription, { shouldDirty: true, shouldValidate: true });
                    } else if (!isPageLike) {
                        setValue('shortDescription', data.shortDescription, { shouldDirty: true });
                    }
                }
                if (entityType === 'blog_post' && data.excerpt) {
                    setValue('excerpt', data.excerpt, { shouldDirty: true, shouldValidate: true });
                }
                if (fieldsToGenerate.includes('tags') && data.tags) setValue('tags', data.tags, { shouldDirty: true });

                if (fieldsToGenerate.includes('metaTitle')) setValue('seo.metaTitle', data.metaTitle, { shouldDirty: true, shouldValidate: true });
                if (fieldsToGenerate.includes('metaDescription')) setValue('seo.metaDescription', data.metaDescription, { shouldDirty: true, shouldValidate: true });

                if (fieldsToGenerate.includes('metaKeywords') && data.metaKeywords) {
                    const keywords = Array.isArray(data.metaKeywords)
                        ? data.metaKeywords
                        : (data.metaKeywords || '').split(',').map((k: string) => k.trim()).filter(Boolean);
                    setValue('seo.metaKeywords', keywords, { shouldDirty: true, shouldValidate: true });
                }

                if (fieldsToGenerate.includes('focusKeyword')) setValue('seo.focusKeyword', data.focusKeyword, { shouldDirty: true, shouldValidate: true });
                if (fieldsToGenerate.includes('ogTitle')) setValue('seo.ogTitle', data.ogTitle, { shouldDirty: true, shouldValidate: true });
                if (fieldsToGenerate.includes('ogDescription')) setValue('seo.ogDescription', data.ogDescription, { shouldDirty: true, shouldValidate: true });
                if (data.ogDescription) setValue('seo.ogDescription', data.ogDescription, { shouldDirty: true, shouldValidate: true });

                showNotification('Content generated successfully', 'success');
                handleClose();
            }
        } catch (error: unknown) {
            console.error('AI Generation Failed:', error);
            const message =
                typeof error === 'object' &&
                    error !== null &&
                    'response' in error &&
                    typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === 'string'
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    : 'Failed to generate content';
            showNotification(message ?? 'Failed to generate content', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Zoom in={true}>
                <Tooltip title="AI Assistant" placement="left">
                    <Fab
                        color="primary"
                        aria-label="ai-assistant"
                        onClick={handleOpen}
                        sx={{
                            position: 'fixed',
                            bottom: 92,
                            right: 32,
                            zIndex: 1000,
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #2196F3 60%, #21CBF3 90%)',
                            }
                        }}
                    >
                        <SmartToyIcon />
                    </Fab>
                </Tooltip>
            </Zoom>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box display="flex" alignItems="center" gap={1} flex={1}>
                        <AutoFixHighIcon color="primary" />
                        <Box>
                            <Typography variant="h6">AI Content Assistant</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {String(getValues(titleField) || 'Untitled')}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        sx={{ color: (theme) => theme.palette.grey[500] }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => setActiveTab(v)}
                        variant="fullWidth"
                        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab icon={<AutoFixHighIcon />} label="Magic Fill" />
                        <Tab icon={<ChatIcon />} label="Custom Instructions" />
                    </Tabs>

                    {activeTab === 0 ? (
                        <Box>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="body2" fontWeight={600}>SEO + GEO Optimization</Typography>
                                <Typography variant="caption">Content optimized for Google Search AND AI Chatbots (ChatGPT, Gemini, Copilot)</Typography>
                            </Alert>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Select which fields you want the AI to generate. Content will be optimized for both traditional search and generative engines.
                            </Typography>
                            <Grid container>
                                <Grid size={12}>
                                    <FormControlLabel
                                        control={<Checkbox checked={options.productName} onChange={(e) => setOptions({ ...options, productName: e.target.checked })} />}
                                        label="Name/Title (Optimized for SEO)"
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <FormControlLabel
                                        control={<Checkbox checked={options.description} onChange={(e) => setOptions({ ...options, description: e.target.checked })} />}
                                        label="Full Description"
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <FormControlLabel
                                        control={<Checkbox checked={options.shortDescription} onChange={(e) => setOptions({ ...options, shortDescription: e.target.checked })} />}
                                        label="Short Description"
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <FormControlLabel
                                        control={<Checkbox checked={options.seo} onChange={(e) => setOptions({ ...options, seo: e.target.checked })} />}
                                        label="SEO Metadata (Title, Desc, Keywords)"
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <FormControlLabel
                                        control={<Checkbox checked={options.tags} onChange={(e) => setOptions({ ...options, tags: e.target.checked })} />}
                                        label="Product Tags"
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    ) : (
                        <Box>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="body2" fontWeight={600}>SEO + GEO Optimization</Typography>
                                <Typography variant="caption">Content optimized for Google Search AND AI Chatbots (ChatGPT, Gemini, Copilot)</Typography>
                            </Alert>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Provide specific instructions for the AI. Content will include specific facts, citations, and FAQ-style answers for AI chatbots.
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="e.g., Write a professional description focusing on durability and eco-friendly materials. Include specific certifications and how-to instructions."
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoFixHighIcon />}
                        tabIndex={0}
                    >
                        {loading ? 'Generating...' : 'Generate Content'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
