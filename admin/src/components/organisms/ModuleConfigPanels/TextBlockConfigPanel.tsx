'use client';

import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Typography, Divider, Tabs, Tab, FormControlLabel, Switch } from '@mui/material';
import { ColorPicker } from '@/components/atoms';
import RichTextEditor from '@/components/molecules/RichTextEditor';

export interface TextBlockConfig {
    content: string;
    alignment: 'left' | 'center' | 'right' | 'justify';
    alignmentTablet?: 'left' | 'center' | 'right' | 'justify';
    alignmentMobile?: 'left' | 'center' | 'right' | 'justify';
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

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <TextField
                    select
                    label="Align (Desktop)"
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

                <TextField
                    select
                    label="Align (Tablet)"
                    value={config.alignmentTablet || config.alignment}
                    onChange={(e) => handleChange('alignmentTablet', e.target.value)}
                    fullWidth
                    size="small"
                >
                    <MenuItem value="left">Left</MenuItem>
                    <MenuItem value="center">Center</MenuItem>
                    <MenuItem value="right">Right</MenuItem>
                    <MenuItem value="justify">Justify</MenuItem>
                </TextField>

                <TextField
                    select
                    label="Align (Mobile)"
                    value={config.alignmentMobile || config.alignment}
                    onChange={(e) => handleChange('alignmentMobile', e.target.value)}
                    fullWidth
                    size="small"
                >
                    <MenuItem value="left">Left</MenuItem>
                    <MenuItem value="center">Center</MenuItem>
                    <MenuItem value="right">Right</MenuItem>
                    <MenuItem value="justify">Justify</MenuItem>
                </TextField>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <Box flex={1}>
                    <ColorPicker
                        label="Text Color"
                        value={config.textColor || '#000000'}
                        onChange={(color) => handleChange('textColor', color)}
                    />
                </Box>

                <Box flex={1}>
                    <ColorPicker
                        label="Background"
                        value={config.backgroundColor || '#ffffff'}
                        onChange={(color) => handleChange('backgroundColor', color)}
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
