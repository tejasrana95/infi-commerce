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
import DynamicIcon from './DynamicIcon';

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

    const handleOpen = async () => {
        setOpen(true);
        if (allIcons.length === 0) {
            setLoading(true);
            try {
                // Dynamically import libraries only to get keys
                // These will be in their own chunks
                const [fa, md, bi, io, lucide] = await Promise.all([
                    import('react-icons/fa'),
                    import('react-icons/md'),
                    import('react-icons/bi'),
                    import('react-icons/io5'),
                    import('lucide-react')
                ]);

                const faKeys = Object.keys(fa).filter(key => key !== 'default');
                const mdKeys = Object.keys(md).filter(key => key !== 'default');
                const biKeys = Object.keys(bi).filter(key => key !== 'default');
                const ioKeys = Object.keys(io).filter(key => key !== 'default');

                const lucideKeys = Object.keys(lucide).filter(key =>
                    key !== 'default' &&
                    key !== 'createLucideIcon' &&
                    /^[A-Z]/.test(key)
                );

                setAllIcons([...faKeys, ...mdKeys, ...biKeys, ...ioKeys, ...lucideKeys]);
            } catch (error) {
                console.error('Failed to load icons:', error);
            } finally {
                setLoading(false);
            }
        }
    };

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
        return <DynamicIcon name={iconName} size={iconSize} />;
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
