'use client';

import {
    Box,
    TextField,
    MenuItem,
    FormControlLabel,
    Switch,
    Typography,
} from '@mui/material';

export interface TextBlockConfig {
    content: string;
    alignment: 'left' | 'center' | 'right' | 'justify';
    fontSize: 'small' | 'medium' | 'large';
    fontWeight: 'normal' | 'medium' | 'bold';
    textColor?: string;
    backgroundColor?: string;
    padding: number;
    maxWidth?: number;
}

interface TextBlockConfigPanelProps {
    config: TextBlockConfig;
    onChange: (config: TextBlockConfig) => void;
}

export const defaultTextBlockConfig: TextBlockConfig = {
    content: '',
    alignment: 'left',
    fontSize: 'medium',
    fontWeight: 'normal',
    textColor: '',
    backgroundColor: '',
    padding: 16,
    maxWidth: undefined,
};

export default function TextBlockConfigPanel({ config, onChange }: TextBlockConfigPanelProps) {
    const handleChange = (key: keyof TextBlockConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
                Text Block Settings
            </Typography>

            <TextField
                label="Content"
                multiline
                rows={6}
                value={config.content}
                onChange={(e) => handleChange('content', e.target.value)}
                fullWidth
                placeholder="Enter your text content here..."
                helperText="Supports basic HTML formatting"
            />

            <TextField
                select
                label="Alignment"
                value={config.alignment}
                onChange={(e) => handleChange('alignment', e.target.value)}
                fullWidth
                size="small"
            >
                <MenuItem value="left">Left</MenuItem>
                <MenuItem value="center">Center</MenuItem>
                <MenuItem value="right">Right</MenuItem>
                <MenuItem value="justify">Justify</MenuItem>
            </TextField>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    select
                    label="Font Size"
                    value={config.fontSize}
                    onChange={(e) => handleChange('fontSize', e.target.value)}
                    fullWidth
                    size="small"
                >
                    <MenuItem value="small">Small</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="large">Large</MenuItem>
                </TextField>

                <TextField
                    select
                    label="Font Weight"
                    value={config.fontWeight}
                    onChange={(e) => handleChange('fontWeight', e.target.value)}
                    fullWidth
                    size="small"
                >
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="bold">Bold</MenuItem>
                </TextField>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <Box flex={1}>
                    <Typography variant="caption" color="text.secondary">
                        Text Color
                    </Typography>
                    <input
                        type="color"
                        value={config.textColor || '#000000'}
                        onChange={(e) => handleChange('textColor', e.target.value)}
                        style={{
                            width: '100%',
                            height: 36,
                            border: '1px solid #ddd',
                            borderRadius: 4,
                            cursor: 'pointer',
                        }}
                    />
                </Box>

                <Box flex={1}>
                    <Typography variant="caption" color="text.secondary">
                        Background
                    </Typography>
                    <input
                        type="color"
                        value={config.backgroundColor || '#ffffff'}
                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        style={{
                            width: '100%',
                            height: 36,
                            border: '1px solid #ddd',
                            borderRadius: 4,
                            cursor: 'pointer',
                        }}
                    />
                </Box>
            </Box>

            <TextField
                label="Padding (px)"
                type="number"
                value={config.padding}
                onChange={(e) => handleChange('padding', parseInt(e.target.value) || 0)}
                fullWidth
                size="small"
            />

            <TextField
                label="Max Width (px)"
                type="number"
                value={config.maxWidth || ''}
                onChange={(e) => handleChange('maxWidth', parseInt(e.target.value) || undefined)}
                fullWidth
                size="small"
                placeholder="Leave empty for full width"
            />
        </Box>
    );
}
