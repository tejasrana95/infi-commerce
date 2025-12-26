import React, { useState } from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Typography, Divider, Button, IconButton, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileManagerButton from '@/components/molecules/FileManagerButton';

interface CardItem {
    title: string;
    description: string;
    image: string;
    link: string;
    ctaText: string;
}

interface CardGroupConfigPanelProps {
    config: {
        title?: string;
        layout?: 'grid' | 'carousel';
        columns?: {
            desktop: number;
            tablet: number;
            mobile: number;
        };
        cards?: CardItem[];
    };
    onChange: (config: any) => void;
}

export const CardGroupConfigPanel: React.FC<CardGroupConfigPanelProps> = ({ config, onChange }) => {
    const [expandedCard, setExpandedCard] = useState<number | false>(false);

    const handleChange = (field: string, value: any) => {
        onChange({ ...config, [field]: value });
    };

    const handleColumnChange = (device: 'desktop' | 'tablet' | 'mobile', value: number) => {
        onChange({
            ...config,
            columns: {
                ...config.columns,
                [device]: value,
            },
        });
    };

    const handleCardChange = (index: number, field: keyof CardItem, value: string) => {
        const newCards = [...(config.cards || [])];
        newCards[index] = { ...newCards[index], [field]: value };
        handleChange('cards', newCards);
    };

    const addCard = () => {
        const newCard: CardItem = {
            title: 'New Card',
            description: '',
            image: '',
            link: '#',
            ctaText: 'Learn More',
        };
        const newCards = [...(config.cards || []), newCard];
        handleChange('cards', newCards);
        setExpandedCard(newCards.length - 1);
    };

    const removeCard = (index: number) => {
        const newCards = [...(config.cards || [])];
        newCards.splice(index, 1);
        handleChange('cards', newCards);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Section Title"
                value={config.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                fullWidth
            />

            <Divider />
            <Typography variant="subtitle2">Layout Settings</Typography>

            <FormControl fullWidth>
                <InputLabel>Layout Type</InputLabel>
                <Select
                    value={config.layout || 'grid'}
                    label="Layout Type"
                    onChange={(e) => handleChange('layout', e.target.value)}
                >
                    <MenuItem value="grid">Grid</MenuItem>
                    <MenuItem value="carousel">Carousel</MenuItem>
                </Select>
            </FormControl>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
                <TextField
                    label="Desktop Cols"
                    type="number"
                    value={config.columns?.desktop || 3}
                    onChange={(e) => handleColumnChange('desktop', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 6 }}
                />
                <TextField
                    label="Tablet Cols"
                    type="number"
                    value={config.columns?.tablet || 2}
                    onChange={(e) => handleColumnChange('tablet', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 4 }}
                />
                <TextField
                    label="Mobile Cols"
                    type="number"
                    value={config.columns?.mobile || 1}
                    onChange={(e) => handleColumnChange('mobile', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 2 }}
                />
            </Box>

            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2">Cards ({config.cards?.length || 0})</Typography>
                <Button startIcon={<AddIcon />} onClick={addCard} size="small">
                    Add Card
                </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {config.cards?.map((card, index) => (
                    <Accordion
                        key={index}
                        expanded={expandedCard === index}
                        onChange={(_, isExpanded) => setExpandedCard(isExpanded ? index : false)}
                        disableGutters
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2">{card.title || `Card ${index + 1}`}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Title"
                                    value={card.title}
                                    onChange={(e) => handleCardChange(index, 'title', e.target.value)}
                                    size="small"
                                    fullWidth
                                />
                                <TextField
                                    label="Description"
                                    value={card.description}
                                    onChange={(e) => handleCardChange(index, 'description', e.target.value)}
                                    size="small"
                                    multiline
                                    rows={2}
                                    fullWidth
                                />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                        Card Image
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                                        {card.image && (
                                            <Box
                                                component="img"
                                                src={card.image}
                                                alt="Preview"
                                                sx={{ height: 60, width: 100, objectFit: 'cover', borderRadius: 1, border: '1px solid #eee' }}
                                            />
                                        )}
                                        <FileManagerButton
                                            onSelect={(files) => {
                                                if (files.length > 0) handleCardChange(index, 'image', files[0].url);
                                            }}
                                            label={card.image ? "Change" : "Select"}
                                            size="small"
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <TextField
                                            value={card.image}
                                            onChange={(e) => handleCardChange(index, 'image', e.target.value)}
                                            size="small"
                                            fullWidth
                                            placeholder="Or URL"
                                        />
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                        label="CTA Text"
                                        value={card.ctaText}
                                        onChange={(e) => handleCardChange(index, 'ctaText', e.target.value)}
                                        size="small"
                                        fullWidth
                                    />
                                    <TextField
                                        label="Link"
                                        value={card.link}
                                        onChange={(e) => handleCardChange(index, 'link', e.target.value)}
                                        size="small"
                                        fullWidth
                                    />
                                </Box>
                                <Button
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => removeCard(index)}
                                    size="small"
                                >
                                    Remove Card
                                </Button>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        </Box>
    );
};
