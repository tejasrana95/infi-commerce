'use client';

import { Box, TextField, Typography, MenuItem, Select, FormControl, InputLabel, Button, IconButton, Accordion, AccordionSummary, AccordionDetails, Checkbox, FormControlLabel } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import IconPicker from '@/components/atoms/IconPicker';
import { ColorPicker } from '@/components/atoms';

type IconPosition = 'left' | 'top' | 'right' | 'bottom';
type TextAlign = 'left' | 'center' | 'right';

export interface IconGroupItem {
    id: string;
    icon?: string;
    title?: string;
    description?: string;
    link?: string;
    openInNewTab?: boolean;
}

export interface IconGroupConfig {
    items?: IconGroupItem[];
    borderColor?: string;
    backgroundColor?: string;
    iconColor?: string;
    titleColor?: string;
    descriptionColor?: string;
    iconPosition?: IconPosition;
    textAlign?: TextAlign;
}

interface IconGroupConfigPanelProps {
    config: IconGroupConfig;
    onChange: (config: IconGroupConfig) => void;
}

const defaultItem = (): IconGroupItem => ({
    id: crypto.randomUUID(),
    icon: 'FaShippingFast',
    title: 'Worldwide Delivery',
    description: 'Shipping to 50+ Countries',
    link: '',
    openInNewTab: false,
});

export default function IconGroupConfigPanel({ config, onChange }: IconGroupConfigPanelProps) {
    const handleChange = <Key extends keyof IconGroupConfig>(key: Key, value: IconGroupConfig[Key]) => {
        onChange({ ...config, [key]: value });
    };

    const handleAddItem = () => {
        handleChange('items', [...(config.items || []), defaultItem()]);
    };

    const handleItemChange = <Key extends keyof IconGroupItem>(index: number, key: Key, value: IconGroupItem[Key]) => {
        const nextItems = [...(config.items || [])];
        nextItems[index] = { ...nextItems[index], [key]: value };
        handleChange('items', nextItems);
    };

    const handleDeleteItem = (index: number) => {
        const nextItems = [...(config.items || [])];
        nextItems.splice(index, 1);
        handleChange('items', nextItems);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <ColorPicker
                    label="Border Color"
                    value={config.borderColor || '#e8d8bd'}
                    onChange={(color) => handleChange('borderColor', color)}
                    size="small"
                />
                <ColorPicker
                    label="Background Color"
                    value={config.backgroundColor || '#fffaf2'}
                    onChange={(color) => handleChange('backgroundColor', color)}
                    size="small"
                />
                <ColorPicker
                    label="Icon Color"
                    value={config.iconColor || '#6f5330'}
                    onChange={(color) => handleChange('iconColor', color)}
                    size="small"
                />
                <ColorPicker
                    label="Title Color"
                    value={config.titleColor || '#1f2937'}
                    onChange={(color) => handleChange('titleColor', color)}
                    size="small"
                />
                <ColorPicker
                    label="Description Color"
                    value={config.descriptionColor || '#6b7280'}
                    onChange={(color) => handleChange('descriptionColor', color)}
                    size="small"
                />
                <FormControl fullWidth size="small">
                    <InputLabel>Icon Position</InputLabel>
                    <Select
                        value={config.iconPosition || 'left'}
                        label="Icon Position"
                        onChange={(e) => handleChange('iconPosition', e.target.value as IconPosition)}
                    >
                        <MenuItem value="left">Left</MenuItem>
                        <MenuItem value="top">Top</MenuItem>
                        <MenuItem value="right">Right</MenuItem>
                        <MenuItem value="bottom">Bottom</MenuItem>
                    </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                    <InputLabel>Text Align</InputLabel>
                    <Select
                        value={config.textAlign || 'left'}
                        label="Text Align"
                        onChange={(e) => handleChange('textAlign', e.target.value as TextAlign)}
                    >
                        <MenuItem value="left">Left</MenuItem>
                        <MenuItem value="center">Center</MenuItem>
                        <MenuItem value="right">Right</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">Icon Group</Typography>
                    <Button startIcon={<AddIcon />} size="small" onClick={handleAddItem}>
                        Add Item
                    </Button>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {(config.items || []).map((item, index) => (
                        <Accordion key={item.id || index} disableGutters>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="body2">{item.title || 'Untitled Item'}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <IconPicker
                                        label="Icon"
                                        value={item.icon || ''}
                                        onChange={(icon) => handleItemChange(index, 'icon', icon)}
                                        fullWidth
                                    />
                                    <TextField
                                        label="Title"
                                        size="small"
                                        fullWidth
                                        value={item.title || ''}
                                        onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                                    />
                                    <TextField
                                        label="Description"
                                        size="small"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        value={item.description || ''}
                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                    />
                                    <TextField
                                        label="Link To"
                                        size="small"
                                        fullWidth
                                        value={item.link || ''}
                                        onChange={(e) => handleItemChange(index, 'link', e.target.value)}
                                        placeholder="/pages/shipping"
                                    />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={item.openInNewTab || false}
                                                    onChange={(e) => handleItemChange(index, 'openInNewTab', e.target.checked)}
                                                />
                                            }
                                            label="Open in new tab"
                                        />
                                        <IconButton color="error" size="small" onClick={() => handleDeleteItem(index)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            </Box>
        </Box>
    );
}
