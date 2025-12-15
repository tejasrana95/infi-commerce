'use client';

import {
    Box,
    TextField,
    Typography,
    Alert,
} from '@mui/material';

export interface HTMLConfig {
    content: string;
    containerClass?: string;
    sanitize: boolean;
}

interface HTMLConfigPanelProps {
    config: HTMLConfig;
    onChange: (config: HTMLConfig) => void;
}

export const defaultHTMLConfig: HTMLConfig = {
    content: '',
    containerClass: '',
    sanitize: true,
};

export default function HTMLConfigPanel({ config, onChange }: HTMLConfigPanelProps) {
    const handleChange = (key: keyof HTMLConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
                Custom HTML Settings
            </Typography>

            <Alert severity="warning" sx={{ fontSize: '0.75rem' }}>
                Use caution with custom HTML. Ensure code is secure and tested.
            </Alert>

            <TextField
                label="HTML Content"
                multiline
                rows={12}
                value={config.content}
                onChange={(e) => handleChange('content', e.target.value)}
                fullWidth
                placeholder="<div class='custom-section'>
  <h2>Custom Content</h2>
  <p>Your HTML here...</p>
</div>"
                sx={{
                    '& .MuiInputBase-input': {
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                    },
                }}
            />

            <TextField
                label="Container CSS Class"
                value={config.containerClass || ''}
                onChange={(e) => handleChange('containerClass', e.target.value)}
                fullWidth
                size="small"
                placeholder="custom-section-wrapper"
                helperText="Optional CSS class for the container"
            />

            {/* Preview */}
            {config.content && (
                <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                        Preview (rendered HTML)
                    </Typography>
                    <Box
                        sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                            maxHeight: 200,
                            overflow: 'auto',
                        }}
                        dangerouslySetInnerHTML={{ __html: config.content }}
                    />
                </Box>
            )}
        </Box>
    );
}
