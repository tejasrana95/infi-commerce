'use client';

import { Box, TextField, MenuItem, Typography, FormControlLabel, Switch } from '@mui/material';
import RichTextEditor from '@/components/molecules/RichTextEditor';

export interface TextBlockConfig {
    content: string;
    alignment: 'left' | 'center' | 'right' | 'justify';
    textColor?: string;
    backgroundColor?: string;
    padding: number;
    maxWidth?: number;
    // Collapse options
    enableCollapse?: boolean;
    defaultState?: 'collapsed' | 'expanded';
    linesToShow?: number;
    expandLabel?: string;
    collapseLabel?: string;
}

interface TextBlockConfigPanelProps {
    config: TextBlockConfig;
    onChange: (config: TextBlockConfig) => void;
}

export const defaultTextBlockConfig: TextBlockConfig = {
    content: '',
    alignment: 'left',
    textColor: '',
    backgroundColor: '',
    padding: 16,
    maxWidth: undefined,
    enableCollapse: false,
    defaultState: 'expanded',
    linesToShow: 3,
    expandLabel: 'Read More',
    collapseLabel: 'Show Less',
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

            {/* Full Rich Text Editor with source toggle */}
            <RichTextEditor
                value={config.content}
                onChange={(value) => handleChange('content', value)}
                variant="full"
                placeholder="Enter your text content here..."
                minHeight={200}
                showSourceToggle
                showFullscreen
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

            {/* Collapse/Expand Options */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2 }}>
                Collapse Options
            </Typography>

            <FormControlLabel
                control={
                    <Switch
                        checked={config.enableCollapse || false}
                        onChange={(e) => handleChange('enableCollapse', e.target.checked)}
                    />
                }
                label="Enable Collapse"
            />

            {config.enableCollapse && (
                <>
                    <TextField
                        select
                        label="Default State"
                        value={config.defaultState || 'expanded'}
                        onChange={(e) => handleChange('defaultState', e.target.value)}
                        fullWidth
                        size="small"
                    >
                        <MenuItem value="collapsed">Collapsed</MenuItem>
                        <MenuItem value="expanded">Expanded</MenuItem>
                    </TextField>

                    <TextField
                        label="Lines to Show (when collapsed)"
                        type="number"
                        value={config.linesToShow || 3}
                        onChange={(e) => handleChange('linesToShow', parseInt(e.target.value) || 3)}
                        fullWidth
                        size="small"
                        inputProps={{ min: 1 }}
                    />

                    <TextField
                        label="Expand Label"
                        value={config.expandLabel || 'Read More'}
                        onChange={(e) => handleChange('expandLabel', e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="Read More"
                    />

                    <TextField
                        label="Collapse Label"
                        value={config.collapseLabel || 'Show Less'}
                        onChange={(e) => handleChange('collapseLabel', e.target.value)}
                        fullWidth
                        size="small"
                        placeholder="Show Less"
                    />
                </>
            )}
        </Box>
    );
}
