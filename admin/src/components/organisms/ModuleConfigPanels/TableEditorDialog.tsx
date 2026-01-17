'use client';

import React, { useState, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Box,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tooltip,
    Typography,
    Popover,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import IconPicker from '@/components/atoms/IconPicker';
import { ColorPicker } from '@/components/atoms';

interface TableEditorDialogProps {
    open: boolean;
    onClose: () => void;
    headers: string[];
    rows: any[][];
    onSave: (headers: string[], rows: any[][]) => void;
}

export default function TableEditorDialog({ open, onClose, headers: initialHeaders, rows: initialRows, onSave }: TableEditorDialogProps) {
    const [headers, setHeaders] = useState<string[]>(initialHeaders);
    const [rows, setRows] = useState<any[][]>(initialRows);
    const [iconPickerAnchor, setIconPickerAnchor] = useState<{ anchor: HTMLElement; row: number; col: number; type: 'prefix' | 'suffix' } | null>(null);
    const [colorPickerAnchor, setColorPickerAnchor] = useState<{ anchor: HTMLElement; row: number; col: number; type: 'text' | 'bg' } | null>(null);
    const editorRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    React.useEffect(() => {
        if (open) {
            setHeaders(initialHeaders);
            const formattedRows = initialRows.map(row =>
                row.map(cell => {
                    if (typeof cell === 'string') {
                        return { content: cell, prefixIcon: '', suffixIcon: '', textColor: '', bgColor: '' };
                    }
                    // Ensure backward compatibility
                    return { ...cell, textColor: cell.textColor || '', bgColor: cell.bgColor || '' };
                })
            );
            setRows(formattedRows);
        }
    }, [open, initialHeaders, initialRows]);

    const addColumn = () => {
        setHeaders([...headers, `Header ${headers.length + 1}`]);
        setRows(rows.map(row => [...row, { content: '', prefixIcon: '', suffixIcon: '' }]));
    };

    const removeColumn = (index: number) => {
        if (headers.length <= 1) return;
        setHeaders(headers.filter((_, i) => i !== index));
        setRows(rows.map(row => row.filter((_, i) => i !== index)));
    };

    const addRow = () => {
        setRows([...rows, new Array(headers.length).fill(null).map(() => ({ content: '', prefixIcon: '', suffixIcon: '' }))]);
    };

    const removeRow = (index: number) => {
        setRows(rows.filter((_, i) => i !== index));
    };

    const updateHeader = (index: number, value: string) => {
        const newHeaders = [...headers];
        newHeaders[index] = value;
        setHeaders(newHeaders);
    };

    const updateCellContent = (rowIndex: number, colIndex: number) => {
        const ref = editorRefs.current[`${rowIndex}-${colIndex}`];
        if (ref) {
            const newRows = [...rows];
            newRows[rowIndex] = [...newRows[rowIndex]];
            newRows[rowIndex][colIndex] = {
                ...newRows[rowIndex][colIndex],
                content: ref.innerHTML
            };
            setRows(newRows);
        }
    };

    const updateCellIcon = (rowIndex: number, colIndex: number, iconType: 'prefix' | 'suffix', icon: string) => {
        const newRows = [...rows];
        newRows[rowIndex] = [...newRows[rowIndex]];
        if (iconType === 'prefix') {
            newRows[rowIndex][colIndex].prefixIcon = icon;
        } else {
            newRows[rowIndex][colIndex].suffixIcon = icon;
        }
        setRows(newRows);
        setIconPickerAnchor(null);
    };

    const updateCellColor = (rowIndex: number, colIndex: number, colorType: 'text' | 'bg', color: string) => {
        const newRows = [...rows];
        newRows[rowIndex] = [...newRows[rowIndex]];
        if (colorType === 'text') {
            newRows[rowIndex][colIndex].textColor = color;
        } else {
            newRows[rowIndex][colIndex].bgColor = color;
        }
        setRows(newRows);
    };

    const handleFormatting = (command: string, value?: string) => {
        document.execCommand(command, false, value);
    };

    const handleSave = () => {
        onSave(headers, rows);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen

            PaperProps={{ sx: { height: '90vh', width: '98vw' } }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box>
                    <Typography variant="h6">Table Editor</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Use Ctrl+B for Bold, Ctrl+I for Italic, Ctrl+U for Underline
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                <Box sx={{ mb: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={addColumn}>
                        Add Column
                    </Button>
                    <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={addRow}>
                        Add Row
                    </Button>
                </Box>

                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 'calc(90vh - 200px)' }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                {headers.map((header, index) => (
                                    <TableCell
                                        key={index}
                                        sx={{ bgcolor: '#fafafa', fontWeight: 600, minWidth: 250, position: 'relative' }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                value={header}
                                                onChange={(e) => updateHeader(index, e.target.value)}
                                                variant="standard"
                                                InputProps={{ style: { fontWeight: 600 } }}
                                            />
                                            {headers.length > 1 && (
                                                <IconButton size="small" onClick={() => removeColumn(index)} color="error">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {row.map((cell, colIndex) => (
                                        <TableCell key={colIndex} sx={{ verticalAlign: 'top', p: 2, position: 'relative' }}>
                                            {/* Content editor */}
                                            <Box
                                                ref={(el: HTMLDivElement | null) => {
                                                    editorRefs.current[`${rowIndex}-${colIndex}`] = el;
                                                    // Set initial content only when ref is first set
                                                    if (el && el.innerHTML === '') {
                                                        el.innerHTML = cell.content || '';
                                                    }
                                                }}
                                                contentEditable
                                                suppressContentEditableWarning
                                                onInput={() => updateCellContent(rowIndex, colIndex)}
                                                sx={{
                                                    minHeight: 50,
                                                    p: 1.5,
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: 1,
                                                    outline: 'none',
                                                    backgroundColor: cell.bgColor || 'transparent',
                                                    color: cell.textColor || 'inherit',
                                                    '&:focus': {
                                                        borderColor: 'primary.main',
                                                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
                                                    },
                                                    '&:empty:before': {
                                                        content: '"Click to edit..."',
                                                        color: '#999',
                                                    }
                                                }}
                                            />

                                            {/* Color and Icon management buttons - compact inline */}
                                            <Box sx={{ display: 'flex', gap: 0.5, mt: 1, alignItems: 'center' }}>
                                                <Tooltip title="Text color">
                                                    <Box
                                                        onClick={(e) => setColorPickerAnchor({ anchor: e.currentTarget, row: rowIndex, col: colIndex, type: 'text' })}
                                                        sx={{
                                                            width: 24,
                                                            height: 24,
                                                            bgcolor: cell.textColor || '#000000',
                                                            border: '1px solid #ddd',
                                                            borderRadius: 1,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            position: 'relative'
                                                        }}
                                                    >
                                                        <Typography variant="caption" sx={{ color: '#fff', fontSize: '10px', textShadow: '0 0 2px #000', fontWeight: 'bold' }}>T</Typography>
                                                    </Box>
                                                </Tooltip>

                                                <Tooltip title="Background color">
                                                    <Box
                                                        onClick={(e) => setColorPickerAnchor({ anchor: e.currentTarget, row: rowIndex, col: colIndex, type: 'bg' })}
                                                        sx={{
                                                            width: 24,
                                                            height: 24,
                                                            bgcolor: cell.bgColor || '#ffffff',
                                                            backgroundImage: !cell.bgColor ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                                                            backgroundSize: '8px 8px',
                                                            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                                                            border: '1px solid #ddd',
                                                            borderRadius: 1,
                                                            cursor: 'pointer'
                                                        }}
                                                    />
                                                </Tooltip>

                                                {(cell.textColor || cell.bgColor) && (
                                                    <Tooltip title="Clear colors">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                updateCellColor(rowIndex, colIndex, 'text', '');
                                                                updateCellColor(rowIndex, colIndex, 'bg', '');
                                                            }}
                                                            sx={{ width: 24, height: 24, p: 0 }}
                                                        >
                                                            <CloseIcon sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}



                                                <Tooltip title="Prefix icon">
                                                    <Button
                                                        size="small"
                                                        variant={cell.prefixIcon ? 'contained' : 'outlined'}
                                                        onClick={(e) => setIconPickerAnchor({ anchor: e.currentTarget, row: rowIndex, col: colIndex, type: 'prefix' })}
                                                        sx={{
                                                            fontSize: '0.65rem',
                                                            py: 0.25,
                                                            px: 0.75,
                                                            minWidth: 50,
                                                            height: 24,
                                                        }}
                                                    >
                                                        {cell.prefixIcon ? '✓' : 'Pre'}
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip title="Suffix icon">
                                                    <Button
                                                        size="small"
                                                        variant={cell.suffixIcon ? 'contained' : 'outlined'}
                                                        onClick={(e) => setIconPickerAnchor({ anchor: e.currentTarget, row: rowIndex, col: colIndex, type: 'suffix' })}
                                                        sx={{
                                                            fontSize: '0.65rem',
                                                            py: 0.25,
                                                            px: 0.75,
                                                            minWidth: 50,
                                                            height: 24,
                                                        }}
                                                    >
                                                        {cell.suffixIcon ? '✓' : 'Suf'}
                                                    </Button>
                                                </Tooltip>
                                                {colIndex === row.length - 1 && (
                                                    <>
                                                        <Tooltip title="Delete row">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => removeRow(rowIndex)}
                                                                color="error"
                                                                sx={{ width: 24, height: 24, p: 0 }}
                                                            >
                                                                <DeleteIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </Box>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Icon Picker Popover */}
                <Popover
                    open={Boolean(iconPickerAnchor)}
                    anchorEl={iconPickerAnchor?.anchor}
                    onClose={() => setIconPickerAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                    <Box sx={{ p: 2, width: 350 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Select {iconPickerAnchor?.type === 'prefix' ? 'Prefix' : 'Suffix'} Icon
                        </Typography>
                        <IconPicker
                            value={iconPickerAnchor ? rows[iconPickerAnchor.row][iconPickerAnchor.col][iconPickerAnchor.type === 'prefix' ? 'prefixIcon' : 'suffixIcon'] : ''}
                            onChange={(icon) => iconPickerAnchor && updateCellIcon(iconPickerAnchor.row, iconPickerAnchor.col, iconPickerAnchor.type, icon)}
                        />
                        {iconPickerAnchor && (rows[iconPickerAnchor.row][iconPickerAnchor.col][iconPickerAnchor.type === 'prefix' ? 'prefixIcon' : 'suffixIcon']) && (
                            <Button
                                size="small"
                                onClick={() => iconPickerAnchor && updateCellIcon(iconPickerAnchor.row, iconPickerAnchor.col, iconPickerAnchor.type, '')}
                                sx={{ mt: 1 }}
                                fullWidth
                                variant="outlined"
                                color="error"
                            >
                                Remove Icon
                            </Button>
                        )}
                    </Box>
                </Popover>

                {/* Color Picker Popover */}
                <Popover
                    open={Boolean(colorPickerAnchor)}
                    anchorEl={colorPickerAnchor?.anchor}
                    onClose={() => setColorPickerAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                    <Box sx={{ p: 2, width: 250 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Select {colorPickerAnchor?.type === 'text' ? 'Text' : 'Background'} Color
                        </Typography>
                        <ColorPicker
                            value={colorPickerAnchor ? (colorPickerAnchor.type === 'text' ? rows[colorPickerAnchor.row][colorPickerAnchor.col].textColor : rows[colorPickerAnchor.row][colorPickerAnchor.col].bgColor) : ''}
                            onChange={(color) => colorPickerAnchor && updateCellColor(colorPickerAnchor.row, colorPickerAnchor.col, colorPickerAnchor.type, color)}
                            fullWidth
                        />
                        <Button
                            size="small"
                            onClick={() => colorPickerAnchor && updateCellColor(colorPickerAnchor.row, colorPickerAnchor.col, colorPickerAnchor.type, '')}
                            sx={{ mt: 1 }}
                            fullWidth
                            variant="outlined"
                            color="error"
                        >
                            Clear Color
                        </Button>
                    </Box>
                </Popover>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button onClick={handleSave} variant="contained" color="primary" size="large">
                    Save Table
                </Button>
            </DialogActions>
        </Dialog>
    );
}
