import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Grid,
    Paper,
    TextField,
    CircularProgress,
    Typography,
} from '@mui/material';

// Lazy-load MUI icons only when the IconPicker is used.
// This avoids bundling ~10,000 icon components into every page chunk.
type IconsModule = Record<string, React.ComponentType<any>>;

async function loadMuiIcons(): Promise<IconsModule> {
    const mod = await import('@mui/icons-material');
    return mod as unknown as IconsModule;
}

interface IconPickerProps {
    onSelect: (iconName: string) => void;
}

export default function IconPicker({ onSelect }: IconPickerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [iconsModule, setIconsModule] = useState<IconsModule | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        loadMuiIcons().then((mod) => {
            if (!cancelled) {
                setIconsModule(mod);
                setLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, []);

    const iconNames = useMemo(() => {
        if (!iconsModule) return [];
        return Object.keys(iconsModule).filter(
            (name) =>
                name.endsWith('Icon') &&
                !name.includes('Outlined') &&
                !name.includes('Rounded') &&
                !name.includes('TwoTone')
        );
    }, [iconsModule]);

    const filteredIcons = useMemo(() => {
        if (!searchTerm) return iconNames.slice(0, 50);
        const lower = searchTerm.toLowerCase();
        return iconNames.filter((name) => name.toLowerCase().includes(lower)).slice(0, 50);
    }, [iconNames, searchTerm]);

    const getIconComponent = (iconName: string) => {
        if (!iconsModule) return null;
        const IconComponent = iconsModule[iconName];
        return IconComponent ? <IconComponent sx={{ fontSize: 32 }} /> : null;
    };

    return (
        <Box sx={{ p: 2 }}>
            <TextField
                fullWidth
                placeholder="Search icons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
            />

            {loading ? (
                <Box textAlign="center" py={3}>
                    <CircularProgress size={24} />
                </Box>
            ) : filteredIcons.length > 0 ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: 1 }}>
                    {filteredIcons.map((iconName) => (
                        <Box key={iconName}>
                            <Paper
                                onClick={() => onSelect(iconName)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    p: 1.5,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        bgcolor: 'primary.light',
                                        color: 'white',
                                    },
                                }}
                            >
                                {getIconComponent(iconName)}
                            </Paper>
                        </Box>
                    ))}
                </Box>
            ) : (
                <Box textAlign="center" py={3}>
                    <Typography color="text.secondary">No icons found</Typography>
                </Box>
            )}
        </Box>
    );
}
