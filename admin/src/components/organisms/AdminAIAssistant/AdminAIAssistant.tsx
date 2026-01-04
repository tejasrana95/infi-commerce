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
    getValues: (field?: string) => any;
    setValue: (field: string, value: any, options?: any) => void;
}

interface GenerateOptions {
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
        description: true,
        shortDescription: true,
        seo: true,
        tags: true,
    });
    const { showNotification } = useNotification();

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            // Gather context
            const context = {
                entityType,
                title: getValues('name') || getValues('title'),
                images: getValues('images') || [],
                existingDescription: getValues('description'),
                // Add more context as needed
            };

            const fieldsToGenerate = [];
            if (activeTab === 0) { // Magic Fill
                if (options.description) fieldsToGenerate.push('description');
                if (options.shortDescription) fieldsToGenerate.push('shortDescription');
                if (options.seo) fieldsToGenerate.push('metaTitle', 'metaDescription', 'metaKeywords', 'focusKeyword', 'ogTitle', 'ogDescription');
                if (options.tags) fieldsToGenerate.push('tags');
            } else { // Custom Chat
                // Request all fields for custom instructions so fields can be populated if generated
                fieldsToGenerate.push(
                    'description',
                    'shortDescription',
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

                // Map API response to form fields
                if (data.description) setValue('description', data.description, { shouldDirty: true });
                if (data.shortDescription) setValue('shortDescription', data.shortDescription, { shouldDirty: true });
                if (data.tags) setValue('tags', data.tags, { shouldDirty: true });

                if (data.metaTitle) setValue('seo.metaTitle', data.metaTitle, { shouldDirty: true, shouldValidate: true });
                if (data.metaDescription) setValue('seo.metaDescription', data.metaDescription, { shouldDirty: true, shouldValidate: true });

                if (data.metaKeywords) {
                    const keywords = Array.isArray(data.metaKeywords)
                        ? data.metaKeywords
                        : (data.metaKeywords || '').split(',').map((k: string) => k.trim()).filter(Boolean);
                    setValue('seo.metaKeywords', keywords, { shouldDirty: true, shouldValidate: true });
                }

                if (data.focusKeyword) setValue('seo.focusKeyword', data.focusKeyword, { shouldDirty: true, shouldValidate: true });
                if (data.ogTitle) setValue('seo.ogTitle', data.ogTitle, { shouldDirty: true, shouldValidate: true });
                if (data.ogDescription) setValue('seo.ogDescription', data.ogDescription, { shouldDirty: true, shouldValidate: true });

                showNotification('Content generated successfully', 'success');
                handleClose();
            }
        } catch (error: any) {
            console.error('AI Generation Failed:', error);
            showNotification(error.response?.data?.message || 'Failed to generate content', 'error');
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
                            bottom: 32,
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
                    <Box display="flex" alignItems="center" gap={1}>
                        <AutoFixHighIcon color="primary" />
                        <Typography variant="h6">AI Content Assistant</Typography>
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
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Select which fields you want the AI to generate based on the product title and images.
                            </Typography>
                            <Grid container>
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
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Provide specific instructions for the AI.
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="e.g., Write a professional description focusing on durability and eco-friendly materials."
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
                    >
                        {loading ? 'Generating...' : 'Generate Content'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
