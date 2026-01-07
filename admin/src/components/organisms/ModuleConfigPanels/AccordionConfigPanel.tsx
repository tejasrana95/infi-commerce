import React, { useState } from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Typography, Divider, Button, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import IconPicker from '@/components/atoms/IconPicker';
import FileManagerButton from '@/components/molecules/FileManagerButton';

interface AccordionItem {
    title: string;
    content: string;
    icon?: string;
    image?: string;
}

interface AccordionConfigPanelProps {
    config: {
        title?: string;
        selectionMode?: 'single' | 'multiple';
        defaultState?: 'closed' | 'first' | 'all';
        variant?: 'default' | 'boxed' | 'separated';
        iconType?: 'none' | 'icon' | 'image';
        iconColor?: string;
        items?: AccordionItem[];
    };
    onChange: (config: any) => void;
}

const AccordionConfigPanel: React.FC<AccordionConfigPanelProps> = ({ config, onChange }) => {
    const [expandedItem, setExpandedItem] = useState<number | false>(false);

    const handleChange = (field: string, value: any) => {
        onChange({ ...config, [field]: value });
    };

    const handleItemChange = (index: number, field: keyof AccordionItem, value: string) => {
        const newItems = [...(config.items || [])];
        newItems[index] = { ...newItems[index], [field]: value };
        handleChange('items', newItems);
    };

    const addItem = () => {
        const newItem: AccordionItem = {
            title: 'New Question',
            content: 'Answer goes here...',
        };
        const newItems = [...(config.items || []), newItem];
        handleChange('items', newItems);
        setExpandedItem(newItems.length - 1);
    };

    const removeItem = (index: number) => {
        const newItems = [...(config.items || [])];
        newItems.splice(index, 1);
        handleChange('items', newItems);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Section Title (Optional)"
                value={config.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                fullWidth
                size="small"
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl fullWidth size="small">
                    <InputLabel>Selection Mode</InputLabel>
                    <Select
                        value={config.selectionMode || 'single'}
                        label="Selection Mode"
                        onChange={(e) => handleChange('selectionMode', e.target.value)}
                    >
                        <MenuItem value="single">Single (Accordion)</MenuItem>
                        <MenuItem value="multiple">Multiple (Expandable)</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                    <InputLabel>Default State</InputLabel>
                    <Select
                        value={config.defaultState || 'closed'}
                        label="Default State"
                        onChange={(e) => handleChange('defaultState', e.target.value)}
                    >
                        <MenuItem value="closed">All Closed</MenuItem>
                        <MenuItem value="first">First Open</MenuItem>
                        <MenuItem value="all">All Open</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                    <InputLabel>Variant</InputLabel>
                    <Select
                        value={config.variant || 'default'}
                        label="Variant"
                        onChange={(e) => handleChange('variant', e.target.value)}
                    >
                        <MenuItem value="default">Default (Border Bottom)</MenuItem>
                        <MenuItem value="boxed">Boxed (Light Background)</MenuItem>
                        <MenuItem value="separated">Separated (Individual Cards)</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                    <InputLabel>Icon Type</InputLabel>
                    <Select
                        value={config.iconType || 'none'}
                        label="Icon Type"
                        onChange={(e) => handleChange('iconType', e.target.value)}
                    >
                        <MenuItem value="none">None</MenuItem>
                        <MenuItem value="icon">React Icon</MenuItem>
                        <MenuItem value="image">Custom Image</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {config.iconType === 'icon' && (
                <TextField
                    label="Icon Color"
                    type="color"
                    value={config.iconColor || '#d112ad'}
                    onChange={(e) => handleChange('iconColor', e.target.value)}
                    size="small"
                    fullWidth
                    helperText="Choose the color for icons"
                />
            )}

            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2">Questions ({config.items?.length || 0})</Typography>
                <Button startIcon={<AddIcon />} onClick={addItem} size="small">
                    Add Item
                </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {config.items?.map((item, index) => (
                    <Accordion
                        key={index}
                        expanded={expandedItem === index}
                        onChange={(_, isExpanded) => setExpandedItem(isExpanded ? index : false)}
                        disableGutters
                        variant="outlined"
                        sx={{ '&:before': { display: 'none' } }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: '200px' }}>
                                {item.title || `Question ${index + 1}`}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Question"
                                    value={item.title}
                                    onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                                    size="small"
                                    fullWidth
                                />
                                <TextField
                                    label="Answer"
                                    value={item.content}
                                    onChange={(e) => handleItemChange(index, 'content', e.target.value)}
                                    size="small"
                                    multiline
                                    rows={4}
                                    fullWidth
                                />

                                {config.iconType === 'icon' && (
                                    <IconPicker
                                        label="Select Icon"
                                        value={item.icon || ''}
                                        onChange={(newIcon) => handleItemChange(index, 'icon', newIcon)}
                                        fullWidth
                                    />
                                )}

                                {config.iconType === 'image' && (
                                    <FileManagerButton
                                        fullWidth
                                        label={item.image ? "Change Image" : "Select Image"}
                                        onSelect={(files) => {
                                            if (files.length > 0) {
                                                handleItemChange(index, 'image', files[0].url);
                                            }
                                        }}
                                        trigger={
                                            <TextField
                                                label="Image URL"
                                                size="small"
                                                fullWidth
                                                value={item.image || ''}
                                                onChange={(e) => handleItemChange(index, 'image', e.target.value)}
                                                InputProps={{
                                                    endAdornment: (
                                                        <Button size="small">Select</Button>
                                                    )
                                                }}
                                            />
                                        }
                                    />
                                )}

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeItem(index);
                                        }}
                                        size="small"
                                    >
                                        Remove
                                    </Button>
                                </Box>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                ))}

                {(!config.items || config.items.length === 0) && (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                        No items added yet. Click "Add Item" to start.
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default AccordionConfigPanel;
