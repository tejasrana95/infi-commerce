import React, { useState } from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Typography, Divider, Button, Accordion, AccordionSummary, AccordionDetails, Switch, FormControlLabel } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import IconPicker from '@/components/atoms/IconPicker';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import PageAutocomplete from '@/components/molecules/PageAutocomplete';
import ProductAutoComplete from '@/components/molecules/ProductAutoComplete';
import CategoryAutocomplete from '@/components/molecules/CategoryAutocomplete';

interface LinkItem {
    id: string;
    label: string;
    type: 'page' | 'product' | 'category' | 'blog' | 'url';
    targetId?: string;
    targetSlug?: string;
    url?: string;
    icon?: string;
    image?: string;
    openInNewTab: boolean;
}

interface LinkListConfigPanelProps {
    config: {
        title?: string;
        style?: 'vertical' | 'horizontal' | 'grid' | 'featured' | 'minimalist';
        items?: LinkItem[];
    };
    onChange: (config: any) => void;
    storeId?: string;
}

const LinkListConfigPanel: React.FC<LinkListConfigPanelProps> = ({ config, onChange, storeId }) => {
    const [expandedItem, setExpandedItem] = useState<number | false>(false);

    const handleChange = (field: string, value: any) => {
        onChange({ ...config, [field]: value });
    };

    const handleItemChange = (index: number, updates: Partial<LinkItem>) => {
        const newItems = [...(config.items || [])];
        newItems[index] = { ...newItems[index], ...updates };
        handleChange('items', newItems);
    };

    const addItem = () => {
        const newItem: LinkItem = {
            id: Math.random().toString(36).substr(2, 9),
            label: 'New Link',
            type: 'url',
            url: '',
            openInNewTab: false,
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
                label="Module Title (Optional)"
                value={config.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                fullWidth
                size="small"
            />

            <FormControl fullWidth size="small">
                <InputLabel>Design Style</InputLabel>
                <Select
                    value={config.style || 'vertical'}
                    label="Design Style"
                    onChange={(e) => handleChange('style', e.target.value)}
                >
                    <MenuItem value="vertical">Vertical List (Default)</MenuItem>
                    <MenuItem value="horizontal">Horizontal (Tags / Pills)</MenuItem>
                    <MenuItem value="grid">Grid (Cards with icons/images)</MenuItem>
                    <MenuItem value="featured">Featured (Highlight first link)</MenuItem>
                    <MenuItem value="minimalist">Minimalist (Footer style)</MenuItem>
                </Select>
            </FormControl>

            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2">Links ({config.items?.length || 0})</Typography>
                <Button startIcon={<AddIcon />} onClick={addItem} size="small">
                    Add Link
                </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {config.items?.map((item, index) => (
                    <Accordion
                        key={item.id}
                        expanded={expandedItem === index}
                        onChange={(_, isExpanded) => setExpandedItem(isExpanded ? index : false)}
                        disableGutters
                        variant="outlined"
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: '200px' }}>
                                {item.label || `Link ${index + 1}`}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Link Label"
                                    value={item.label}
                                    onChange={(e) => handleItemChange(index, { label: e.target.value })}
                                    size="small"
                                    fullWidth
                                />

                                <FormControl fullWidth size="small">
                                    <InputLabel>Link Type</InputLabel>
                                    <Select
                                        value={item.type}
                                        label="Link Type"
                                        onChange={(e) => {
                                            handleItemChange(index, {
                                                type: e.target.value as any,
                                                targetId: '',
                                                targetSlug: '',
                                                url: ''
                                            });
                                        }}
                                    >
                                        <MenuItem value="page">Internal Page</MenuItem>
                                        <MenuItem value="product">Product</MenuItem>
                                        <MenuItem value="category">Category</MenuItem>
                                        <MenuItem value="url">Custom URL</MenuItem>
                                    </Select>
                                </FormControl>

                                {item.type === 'page' && (
                                    <PageAutocomplete
                                        storeId={storeId}
                                        value={item.targetId}
                                        onChange={(val, option: any) => {
                                            handleItemChange(index, {
                                                targetId: val || undefined,
                                                targetSlug: option?.slug || '',
                                                label: item.label === 'New Link' && option ? option.title : item.label
                                            });
                                        }}
                                    />
                                )}
                                {item.type === 'product' && (
                                    <ProductAutoComplete
                                        storeId={storeId}
                                        multiple={false}
                                        value={item.targetId}
                                        onChange={(val: any) => {
                                            handleItemChange(index, {
                                                targetId: val?._id || undefined,
                                                targetSlug: val?.slug || '',
                                                label: item.label === 'New Link' && val ? val.name : item.label
                                            });
                                        }}
                                    />
                                )}
                                {item.type === 'category' && (
                                    <CategoryAutocomplete
                                        storeId={storeId}
                                        multiple={false}
                                        value={item.targetId}
                                        onChange={(val, option: any) => {
                                            handleItemChange(index, {
                                                targetId: val || undefined,
                                                targetSlug: option?.slug || '',
                                                label: item.label === 'New Link' && option ? (option.title || option.name) : item.label
                                            });
                                        }}
                                    />
                                )}
                                {item.type === 'url' && (
                                    <TextField
                                        label="URL (e.g. https://google.com or /about)"
                                        value={item.url || ''}
                                        onChange={(e) => handleItemChange(index, { url: e.target.value })}
                                        size="small"
                                        fullWidth
                                    />
                                )}

                                <IconPicker
                                    label="Icon (Optional)"
                                    value={item.icon || ''}
                                    onChange={(newIcon) => handleItemChange(index, { icon: newIcon })}
                                    fullWidth
                                />

                                <FileManagerButton
                                    fullWidth
                                    label={item.image ? "Change Image" : "Select Image"}
                                    onSelect={(files) => {
                                        if (files.length > 0) handleItemChange(index, { image: files[0].url });
                                    }}
                                    trigger={
                                        <TextField
                                            label="Image URL (Optional)"
                                            size="small"
                                            fullWidth
                                            value={item.image || ''}
                                            onChange={(e) => handleItemChange(index, { image: e.target.value })}
                                        />
                                    }
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={item.openInNewTab || false}
                                            onChange={(e) => handleItemChange(index, { openInNewTab: e.target.checked })}
                                        />
                                    }
                                    label="Open in new tab"
                                />

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button color="error" startIcon={<DeleteIcon />} onClick={() => removeItem(index)} size="small">
                                        Remove Link
                                    </Button>
                                </Box>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                ))}

                {(!config.items || config.items.length === 0) && (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                        No links added yet. Click "Add Link" to start.
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default LinkListConfigPanel;
