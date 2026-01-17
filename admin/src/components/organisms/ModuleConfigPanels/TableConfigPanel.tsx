'use client';

import React, { useState } from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Typography, Divider, Switch, FormControlLabel, IconButton, Button, AccordionDetails, Accordion, AccordionSummary, Checkbox } from '@mui/material';
import { ColorPicker } from '@/components/atoms';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import { LayoutModule } from '@/types';
import TableEditorDialog from './TableEditorDialog';

interface TableConfigPanelProps {
    module: LayoutModule;
    onChange: (module: LayoutModule) => void;
}

export default function TableConfigPanel({ module, onChange }: TableConfigPanelProps) {
    const [editorOpen, setEditorOpen] = useState(false);

    const config = module.config || {
        headers: ['Header 1', 'Header 2', 'Header 3'],
        rows: [
            ['Cell 1-1', 'Cell 1-2', 'Cell 1-3'],
            ['Cell 2-1', 'Cell 2-2', 'Cell 2-3'],
        ],
        headerBgColor: '#f3f4f6',
        headerTextColor: '#1f2937',
        headerAlignment: 'left',
        stripedRows: true,
        hoverEffect: true,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderStyle: 'solid',
        borderRadius: 8,
        cellPadding: 12,
        cellAlignment: 'left',
        responsiveMode: 'scroll',
    };

    const updateConfig = (key: string, value: any) => {
        onChange({
            ...module,
            config: { ...module.config, [key]: value },
        });
    };

    const handleSaveTableData = (headers: string[], rows: string[][]) => {
        onChange({
            ...module,
            config: {
                ...module.config,
                headers,
                rows
            },
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Table Content Button */}
            <Box>
                <Button
                    variant="contained"
                    fullWidth
                    startIcon={<EditIcon />}
                    onClick={() => setEditorOpen(true)}
                    sx={{ mb: 1 }}
                >
                    Open Table Editor
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                    {config.headers.length} columns × {config.rows.length} rows
                </Typography>
            </Box>

            <Divider />

            {/* Header Styling */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Header Styling</Typography>
                </AccordionSummary>
                <AccordionDetails>

                    <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>


                        <ColorPicker
                            label="Background Color"
                            value={config.headerBgColor || '#f3f4f6'}
                            onChange={(color) => updateConfig('headerBgColor', color)}
                        />

                        <ColorPicker
                            label="Text Color"
                            value={config.headerTextColor || '#1f2937'}
                            onChange={(color) => updateConfig('headerTextColor', color)}
                        />


                        <TextField
                            select
                            label="Header Alignment"
                            size="small"
                            fullWidth
                            value={config.headerAlignment || 'left'}
                            onChange={(e) => updateConfig('headerAlignment', e.target.value)}
                        >
                            <MenuItem value="left">Left</MenuItem>
                            <MenuItem value="center">Center</MenuItem>
                            <MenuItem value="right">Right</MenuItem>
                        </TextField>
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Row Styling */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Row Styling</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <ColorPicker
                            label="Striped Row Color"
                            value={config.styles?.stripedRowColor || config.stripedRowColor || '#fafafa'}
                            onChange={(color) => updateConfig('stripedRowColor', color)}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={config.hoverEffect || false}
                                    onChange={(e) => updateConfig('hoverEffect', e.target.checked)}
                                />
                            }
                            label="Hover Effect"
                        />
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Border & Cell Styling */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Border & Cell Styling</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                        <TextField
                            label="Border Width"
                            type="number"
                            size="small"
                            value={config.borderWidth || 1}
                            onChange={(e) => updateConfig('borderWidth', parseInt(e.target.value))}
                            InputProps={{ endAdornment: 'px' }}
                            sx={{ flex: 1 }}
                        />
                        <TextField
                            select
                            label="Border Style"
                            size="small"
                            value={config.borderStyle || 'solid'}
                            onChange={(e) => updateConfig('borderStyle', e.target.value)}
                            sx={{ flex: 1 }}
                        >
                            <MenuItem value="solid">Solid</MenuItem>
                            <MenuItem value="dashed">Dashed</MenuItem>
                            <MenuItem value="dotted">Dotted</MenuItem>
                        </TextField>

                        <ColorPicker
                            label="Border Color"
                            value={config.borderColor || '#e5e7eb'}
                            onChange={(color) => updateConfig('borderColor', color)}
                        />
                        <TextField
                            label="Border Radius"
                            type="number"
                            size="small"
                            fullWidth
                            value={config.borderRadius || 0}
                            onChange={(e) => updateConfig('borderRadius', parseInt(e.target.value))}
                            InputProps={{ endAdornment: 'px' }}
                        />
                        <TextField
                            label="Cell Padding"
                            type="number"
                            size="small"
                            fullWidth
                            value={config.cellPadding || 12}
                            onChange={(e) => updateConfig('cellPadding', parseInt(e.target.value))}
                            InputProps={{ endAdornment: 'px' }}
                        />
                        <TextField
                            select
                            label="Cell Alignment"
                            size="small"
                            fullWidth
                            value={config.cellAlignment || 'left'}
                            onChange={(e) => updateConfig('cellAlignment', e.target.value)}
                        >
                            <MenuItem value="left">Left</MenuItem>
                            <MenuItem value="center">Center</MenuItem>
                            <MenuItem value="right">Right</MenuItem>
                        </TextField>
                    </Box>

                </AccordionDetails>
            </Accordion>

            {/* Responsive */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Responsive</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <TextField
                        select
                        label="Mobile Mode"
                        size="small"
                        fullWidth
                        value={config.responsiveMode || 'scroll'}
                        onChange={(e) => updateConfig('responsiveMode', e.target.value)}
                    >
                        <MenuItem value="scroll">Horizontal Scroll</MenuItem>
                        <MenuItem value="stack">Stack (Card View)</MenuItem>
                    </TextField>
                </AccordionDetails>
            </Accordion>

            {/* Table Editor Dialog */}
            <TableEditorDialog
                open={editorOpen}
                onClose={() => setEditorOpen(false)}
                headers={config.headers}
                rows={config.rows}
                onSave={handleSaveTableData}
            />
        </Box >
    );
}
