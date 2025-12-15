import React, { useState } from 'react';
import {
    Box,
    Card,
    CardActionArea,
    CardContent,
    CardMedia,
    Typography,
    Grid,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Chip,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { PRESET_TEMPLATES, ThemePreset } from '@/constants/templatePresets';
import { ThemeConfig } from '@/types';

interface TemplateSelectorProps {
    currentConfig: ThemeConfig;
    onSelect: (config: ThemeConfig) => void;
}

export default function TemplateSelector({ currentConfig, onSelect }: TemplateSelectorProps) {
    const [selectedTheme, setSelectedTheme] = useState<ThemePreset | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleThemeClick = (theme: ThemePreset) => {
        setSelectedTheme(theme);
        setConfirmOpen(true);
    };

    const handleConfirm = () => {
        if (selectedTheme) {
            // Ensure templateId is explicitly set from the selected theme preset
            // This ensures logic downstream can use this ID for component mapping
            const configWithId = {
                ...selectedTheme.config,
                templateId: selectedTheme.id,
            };
            onSelect(configWithId);
            setConfirmOpen(false);
            setSelectedTheme(null);
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Select a Template
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose a pre-designed template to instantly style your store. You can customize it further in the other tabs.
            </Typography>

            <Grid container spacing={3}>
                {PRESET_TEMPLATES.map((theme) => {
                    const isActive = currentConfig.templateId === theme.id;
                    return (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={theme.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s',
                                    transform: isActive ? 'translateY(-4px)' : 'none',
                                    boxShadow: isActive ? 8 : 1,
                                    border: isActive ? 2 : 0,
                                    borderColor: 'primary.main',
                                    position: 'relative',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 8,
                                    },
                                }}
                            >
                                {isActive && (
                                    <Chip
                                        icon={<CheckCircleIcon />}
                                        label="Active"
                                        color="primary"
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: 12,
                                            right: 12,
                                            zIndex: 1,
                                        }}
                                    />
                                )}
                                <CardActionArea onClick={() => handleThemeClick(theme)} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                                    <Box
                                        sx={{
                                            height: 140,
                                            bgcolor: theme.thumbnail,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                        }}
                                    >
                                        <Typography variant="h3" sx={{ opacity: 0.5, fontWeight: 'bold' }}>
                                            Aa
                                        </Typography>
                                    </Box>
                                    <CardContent>
                                        <Typography gutterBottom variant="h6" component="div">
                                            {theme.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {theme.description}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Confirmation Dialog */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Apply "{selectedTheme?.name}"?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This will overwrite your current header, footer, colors, and font settings. This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} variant="contained" color="primary">
                        Apply Template
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
