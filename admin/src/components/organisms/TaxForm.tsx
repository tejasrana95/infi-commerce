'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    FormControlLabel,
    Switch,
    IconButton,
    Typography,
    Button,
    Divider,
    Alert,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { TaxRate, SubTax } from '@/types';

interface TaxFormProps {
    initialData?: TaxRate | null;
    onSubmit: (data: Partial<TaxRate>) => void;
}

export default function TaxForm({ initialData, onSubmit }: TaxFormProps) {
    const [name, setName] = useState('');
    const [rate, setRate] = useState<number>(0);
    const [isSplit, setIsSplit] = useState(false);
    const [subTaxes, setSubTaxes] = useState<SubTax[]>([]);
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);

    // Initialize form with existing tax rate data
    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setRate(initialData.rate);
            setIsSplit(initialData.isSplit);
            setSubTaxes(initialData.subTaxes || []);
            setDescription(initialData.description || '');
            setIsActive(initialData.isActive);
        } else {
            // Reset form for new tax
            setName('');
            setRate(0);
            setIsSplit(false);
            setSubTaxes([]);
            setDescription('');
            setIsActive(true);
        }
    }, [initialData]);

    // Calculate total rate from sub-taxes
    const calculatedRate = isSplit
        ? subTaxes.reduce((sum, st) => sum + (st.rate || 0), 0)
        : rate;

    const handleAddSubTax = () => {
        setSubTaxes([...subTaxes, { name: '', rate: 0 }]);
    };

    const handleRemoveSubTax = (index: number) => {
        setSubTaxes(subTaxes.filter((_, i) => i !== index));
    };

    const handleSubTaxChange = (index: number, field: keyof SubTax, value: string | number) => {
        const updated = [...subTaxes];
        if (field === 'rate') {
            updated[index].rate = parseFloat(value as string) || 0;
        } else {
            updated[index].name = value as string;
        }
        setSubTaxes(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        onSubmit({
            name,
            rate: isSplit ? calculatedRate : rate,
            isSplit,
            subTaxes: isSplit ? subTaxes : undefined,
            description: description || undefined,
            isActive,
        });
    };

    return (
        <form id="tax-form" onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <TextField
                    label="Tax Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    fullWidth
                    placeholder="e.g., GST 18%, VAT 20%, Sales Tax 10%"
                    helperText="A descriptive name for this tax rate"
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={isSplit}
                            onChange={(e) => {
                                setIsSplit(e.target.checked);
                                if (e.target.checked && subTaxes.length === 0) {
                                    setSubTaxes([{ name: '', rate: 0 }, { name: '', rate: 0 }]);
                                }
                            }}
                        />
                    }
                    label="Split Tax (e.g., CGST + SGST)"
                />

                {!isSplit ? (
                    <TextField
                        label="Tax Rate (%)"
                        type="number"
                        value={rate}
                        onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                        required
                        fullWidth
                        inputProps={{ min: 0, step: 0.01 }}
                    />
                ) : (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Sub-Taxes
                        </Typography>

                        {subTaxes.map((subTax, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    gap: 2,
                                    alignItems: 'center',
                                    mb: 1,
                                }}
                            >
                                <TextField
                                    label="Sub-Tax Name"
                                    value={subTax.name}
                                    onChange={(e) => handleSubTaxChange(index, 'name', e.target.value)}
                                    size="small"
                                    sx={{ flex: 2 }}
                                    placeholder="e.g., CGST, SGST"
                                />
                                <TextField
                                    label="Rate (%)"
                                    type="number"
                                    value={subTax.rate}
                                    onChange={(e) => handleSubTaxChange(index, 'rate', e.target.value)}
                                    size="small"
                                    sx={{ flex: 1 }}
                                    inputProps={{ min: 0, step: 0.01 }}
                                />
                                <IconButton
                                    onClick={() => handleRemoveSubTax(index)}
                                    disabled={subTaxes.length <= 2}
                                    color="error"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        ))}

                        <Button
                            startIcon={<AddIcon />}
                            onClick={handleAddSubTax}
                            size="small"
                            sx={{ mt: 1 }}
                        >
                            Add Sub-Tax
                        </Button>

                        <Alert severity="info" sx={{ mt: 2 }}>
                            <strong>Total Tax Rate: {calculatedRate}%</strong>
                        </Alert>
                    </Box>
                )}

                <Divider sx={{ my: 1 }} />

                <TextField
                    label="Description (Optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Optional description for this tax rate"
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                        />
                    }
                    label="Active"
                />
            </Box>
        </form>
    );
}
