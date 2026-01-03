'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
    Grid,
    IconButton,
    InputAdornment,
    Tooltip,
    CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import * as BiIcons from 'react-icons/bi';
import * as IoIcons from 'react-icons/io5';
import * as LucideIcons from 'lucide-react';

interface IconPickerProps {
    value: string;
    onChange: (iconName: string) => void;
    label?: string;
    variant?: 'outlined' | 'filled' | 'standard';
    size?: 'small' | 'medium';
    fullWidth?: boolean;
}

export default function IconPicker({
    value,
    onChange,
    label = 'Select Icon',
    variant = 'outlined',
    size = 'small',
    fullWidth = false
}: IconPickerProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [displayLimit, setDisplayLimit] = useState(100);
    const [allIcons, setAllIcons] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Load icons only once on mount to avoid heavy processing on every render
    useEffect(() => {
        setLoading(true);
        // Use timeout to allow UI to render first if needed, though mostly fast enough
        setTimeout(() => {
            const faKeys = Object.keys(FaIcons).filter(key => key !== 'default');
            const mdKeys = Object.keys(MdIcons).filter(key => key !== 'default');
            const biKeys = Object.keys(BiIcons).filter(key => key !== 'default');
            const ioKeys = Object.keys(IoIcons).filter(key => key !== 'default');

            // Lucide exports icons as named exports, but also some utility functions. 
            // Most Lucide icons seem to be PascalCase. 
            // We can filter for things that look like React components (usually valid pascal case names provided by the lib).
            // A simple heuristic is that they don't start with lower case.
            const lucideKeys = Object.keys(LucideIcons).filter(key =>
                key !== 'default' &&
                key !== 'createLucideIcon' &&
                /^[A-Z]/.test(key)
            );

            setAllIcons([...faKeys, ...mdKeys, ...biKeys, ...ioKeys, ...lucideKeys]);
            setLoading(false);
        }, 0);
    }, []);

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setSearchTerm('');
        setDisplayLimit(100);
    };

    const handleSelect = (iconName: string) => {
        onChange(iconName);
        handleClose();
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setDisplayLimit(100); // Reset limit on search
    };

    const handleLoadMore = () => {
        setDisplayLimit(prev => prev + 100);
    };

    // Filter icons based on search
    const filteredIcons = useMemo(() => {
        if (!searchTerm) return allIcons;
        const lowerTerm = searchTerm.toLowerCase();
        return allIcons.filter(icon =>
            icon.toLowerCase().includes(lowerTerm)
        );
    }, [allIcons, searchTerm]);

    const visibleIcons = filteredIcons.slice(0, displayLimit);

    // Helper to render icon by name
    const renderIcon = (iconName: string, iconSize = 24) => {
        try {
            if (iconName.startsWith('Fa')) {
                const Icon = (FaIcons as any)[iconName];
                return Icon ? <Icon size={iconSize} /> : null;
            }
            if (iconName.startsWith('Md')) {
                const Icon = (MdIcons as any)[iconName];
                return Icon ? <Icon size={iconSize} /> : null;
            }
            if (iconName.startsWith('Bi')) {
                const Icon = (BiIcons as any)[iconName];
                return Icon ? <Icon size={iconSize} /> : null;
            }
            if (iconName.startsWith('Io')) {
                const Icon = (IoIcons as any)[iconName];
                return Icon ? <Icon size={iconSize} /> : null;
            }
            // Fallback to Lucide for others or explicitly check
            const Icon = (LucideIcons as any)[iconName];
            return Icon ? <Icon size={iconSize} /> : null;
        } catch (e) {
            console.warn(`Failed to render icon: ${iconName}`, e);
            return null;
        }
    };

    return (
        <>
            <Box onClick={handleOpen} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                    value={value || ''}
                    label={label}
                    size={size}
                    variant={variant}
                    fullWidth={fullWidth}
                    InputProps={{
                        readOnly: true,
                        startAdornment: value ? (
                            <InputAdornment position="start">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>
                                    {renderIcon(value, 20)}
                                </Box>
                            </InputAdornment>
                        ) : null,
                        endAdornment: (
                            <InputAdornment position="end">
                                <Button size="small" onClick={handleOpen}>
                                    Change
                                </Button>
                            </InputAdornment>
                        )
                    }}
                    onClick={handleOpen}
                />
            </Box>

            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                scroll="paper"
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        Select Icon
                        <IconButton onClick={handleClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <TextField
                        autoFocus
                        margin="dense"
                        placeholder="Search icons (e.g. 'user', 'arrow')..."
                        type="text"
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }
                        }}
                        sx={{ mt: 2 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                        Showing {visibleIcons.length} of {filteredIcons.length} available icons
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ minHeight: 300 }}>
                        {loading ? (
                            <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                                <CircularProgress />
                            </Box>
                        ) : visibleIcons.length > 0 ? (
                            <>
                                <Grid container spacing={1}>
                                    {visibleIcons.map((iconName) => (
                                        <Grid size={{ xs: 3, sm: 2, md: 1.5 }} key={iconName}>
                                            <Tooltip title={iconName}>
                                                <Button
                                                    variant={value === iconName ? 'contained' : 'outlined'}
                                                    sx={{
                                                        width: '100%',
                                                        height: 60,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 0.5,
                                                        p: 1,
                                                        borderColor: 'divider',
                                                        color: value === iconName ? 'primary.contrastText' : 'text.primary',
                                                        textTransform: 'none',
                                                        overflow: 'hidden',
                                                        '&:hover': {
                                                            bgcolor: value === iconName ? 'primary.dark' : 'action.hover',
                                                        }
                                                    }}
                                                    onClick={() => handleSelect(iconName)}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 24 }}>
                                                        {renderIcon(iconName, 24)}
                                                    </Box>
                                                    <Typography variant="caption" sx={{
                                                        fontSize: '0.65rem',
                                                        maxWidth: '100%',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        display: 'block'
                                                    }}>
                                                        {iconName}
                                                    </Typography>
                                                </Button>
                                            </Tooltip>
                                        </Grid>
                                    ))}
                                </Grid>
                                {visibleIcons.length < filteredIcons.length && (
                                    <Box display="flex" justifyContent="center" mt={2}>
                                        <Button onClick={handleLoadMore} variant="outlined" size="small">
                                            Load More
                                        </Button>
                                    </Box>
                                )}
                            </>
                        ) : (
                            <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                                <Typography color="text.secondary">
                                    No icons found matching "{searchTerm}"
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
