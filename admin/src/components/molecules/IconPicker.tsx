import React, { useState } from 'react';
import {
    Box,
    Grid,
    Paper,
    TextField,
    CircularProgress,
    Typography,
} from '@mui/material';
import * as MuiIcons from '@mui/icons-material';

interface IconPickerProps {
    onSelect: (iconName: string) => void;
}

export default function IconPicker({ onSelect }: IconPickerProps) {
    const [searchTerm, setSearchTerm] = useState('');

    // Get all available icons from MUI Icons
    const iconNames = Object.keys(MuiIcons).filter(
        (name) => name.endsWith('Icon') && !name.includes('Outlined') && !name.includes('Rounded') && !name.includes('TwoTone')
    );

    // Filter icons based on search term
    const filteredIcons = iconNames.filter((name) =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getIconComponent = (iconName: string) => {
        const IconComponent = (MuiIcons as any)[iconName];
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

            {filteredIcons.length > 0 ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: 1 }}>
                    {filteredIcons.slice(0, 50).map((iconName) => (
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
