'use client';

import { Box, TextField, Typography, MenuItem, Select, FormControl, InputLabel, Button, IconButton, Accordion, AccordionSummary, AccordionDetails, Checkbox, FormControlLabel, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';

interface PricingTableConfigPanelProps {
    config: {
        plans: any[];
        columns: number;
        [key: string]: any;
    };
    onChange: (config: any) => void;
}

export default function PricingTableConfigPanel({ config, onChange }: PricingTableConfigPanelProps) {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    const handleAddPlan = () => {
        const newPlans = [...(config.plans || []), {
            id: crypto.randomUUID(),
            name: 'Basic',
            price: '19',
            currency: '$',
            period: '/mo',
            features: [
                { text: 'Feature 1', included: true },
                { text: 'Feature 2', included: false }
            ],
            ctaText: 'Get Started',
            isFeatured: false
        }];
        handleChange('plans', newPlans);
    };

    const handlePlanChange = (index: number, key: string, value: any) => {
        const newPlans = [...(config.plans || [])];
        newPlans[index] = { ...newPlans[index], [key]: value };
        handleChange('plans', newPlans);
    };

    const handleFeatureChange = (planIndex: number, featureIndex: number, key: string, value: any) => {
        const newPlans = [...(config.plans || [])];
        const newFeatures = [...newPlans[planIndex].features];
        newFeatures[featureIndex] = { ...newFeatures[featureIndex], [key]: value };
        newPlans[planIndex].features = newFeatures;
        handleChange('plans', newPlans);
    };

    const addFeature = (planIndex: number) => {
        const newPlans = [...(config.plans || [])];
        newPlans[planIndex].features.push({ text: 'New Feature', included: true });
        handleChange('plans', newPlans);
    };

    const removeFeature = (planIndex: number, featureIndex: number) => {
        const newPlans = [...(config.plans || [])];
        newPlans[planIndex].features.splice(featureIndex, 1);
        handleChange('plans', newPlans);
    };

    const deletePlan = (index: number) => {
        const newPlans = [...(config.plans || [])];
        newPlans.splice(index, 1);
        handleChange('plans', newPlans);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth size="small">
                <InputLabel>Columns</InputLabel>
                <Select
                    value={config.columns || 3}
                    label="Columns"
                    onChange={(e) => handleChange('columns', e.target.value)}
                >
                    <MenuItem value={1}>1 Column</MenuItem>
                    <MenuItem value={2}>2 Columns</MenuItem>
                    <MenuItem value={3}>3 Columns</MenuItem>
                    <MenuItem value={4}>4 Columns</MenuItem>
                </Select>
            </FormControl>

            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">Pricing Plans</Typography>
                    <Button startIcon={<AddIcon />} size="small" onClick={handleAddPlan}>
                        Add Plan
                    </Button>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {(config.plans || []).map((plan: any, index: number) => (
                        <Accordion key={plan.id || index} disableGutters>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="body2">{plan.name || 'Untitled Plan'}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        <TextField
                                            label="Plan Name"
                                            size="small"
                                            fullWidth
                                            value={plan.name || ''}
                                            onChange={(e) => handlePlanChange(index, 'name', e.target.value)}
                                        />
                                        <TextField
                                            label="Badge (Optional)"
                                            size="small"
                                            fullWidth
                                            value={plan.badge || ''}
                                            onChange={(e) => handlePlanChange(index, 'badge', e.target.value)}
                                            helperText="e.g. Best Value"
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TextField
                                            label="Currency"
                                            size="small"
                                            sx={{ width: 80 }}
                                            value={plan.currency || ''}
                                            onChange={(e) => handlePlanChange(index, 'currency', e.target.value)}
                                        />
                                        <TextField
                                            label="Price"
                                            size="small"
                                            fullWidth
                                            value={plan.price || ''}
                                            onChange={(e) => handlePlanChange(index, 'price', e.target.value)}
                                        />
                                        <TextField
                                            label="Period"
                                            size="small"
                                            sx={{ width: 100 }}
                                            value={plan.period || ''}
                                            onChange={(e) => handlePlanChange(index, 'period', e.target.value)}
                                        />
                                    </Box>

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={plan.isFeatured || false}
                                                onChange={(e) => handlePlanChange(index, 'isFeatured', e.target.checked)}
                                            />
                                        }
                                        label="Use Highlighted Style"
                                    />

                                    <Divider textAlign="left">Features</Divider>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {plan.features?.map((feature: any, fIndex: number) => (
                                            <Box key={fIndex} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                <Checkbox
                                                    size="small"
                                                    checked={feature.included}
                                                    onChange={(e) => handleFeatureChange(index, fIndex, 'included', e.target.checked)}
                                                />
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    placeholder="Feature text"
                                                    value={feature.text}
                                                    onChange={(e) => handleFeatureChange(index, fIndex, 'text', e.target.value)}
                                                />
                                                <IconButton size="small" onClick={() => removeFeature(index, fIndex)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                        <Button size="small" startIcon={<AddIcon />} onClick={() => addFeature(index)}>
                                            Add Feature
                                        </Button>
                                    </Box>

                                    <Divider />

                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        <TextField
                                            label="CTA Text"
                                            size="small"
                                            fullWidth
                                            value={plan.ctaText || ''}
                                            onChange={(e) => handlePlanChange(index, 'ctaText', e.target.value)}
                                        />
                                        <TextField
                                            label="CTA Link"
                                            size="small"
                                            fullWidth
                                            value={plan.ctaLink || ''}
                                            onChange={(e) => handlePlanChange(index, 'ctaLink', e.target.value)}
                                        />
                                    </Box>

                                    <Button
                                        color="error"
                                        variant="outlined"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => deletePlan(index)}
                                    >
                                        Delete Entire Plan
                                    </Button>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            </Box>
        </Box>
    );
}
