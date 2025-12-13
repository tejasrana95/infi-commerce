'use client';

import { Box, Paper, Grid, Typography, IconButton, TextField, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { Controller } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

interface VideosFieldProps {
    control: any;
}

export default function VideosField({ control }: VideosFieldProps) {
    return (
        <Grid size={{ xs: 12 }}>
            <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>Product Videos</Typography>
            <Controller
                name="videos"
                control={control}
                render={({ field }) => {
                    const videos = field.value || [];

                    return (
                        <Box>
                            {videos.map((video: any, index: number) => (
                                <Paper key={index} sx={{ p: 2, mb: 2 }} variant="outlined">
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="subtitle2">Video {index + 1}</Typography>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => field.onChange(videos.filter((_: any, i: number) => i !== index))}
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, md: 3 }}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Type</InputLabel>
                                                <Select
                                                    value={video.type}
                                                    onChange={(e) => {
                                                        const updated = [...videos];
                                                        updated[index] = { ...updated[index], type: e.target.value };
                                                        field.onChange(updated);
                                                    }}
                                                    label="Type"
                                                >
                                                    <MenuItem value="youtube">YouTube</MenuItem>
                                                    <MenuItem value="vimeo">Vimeo</MenuItem>
                                                    <MenuItem value="url">Direct URL</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 9 }}>
                                            <TextField
                                                value={video.url}
                                                onChange={(e) => {
                                                    const updated = [...videos];
                                                    updated[index] = { ...updated[index], url: e.target.value };
                                                    field.onChange(updated);
                                                }}
                                                label="Video URL"
                                                fullWidth
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <TextField
                                                value={video.title || ''}
                                                onChange={(e) => {
                                                    const updated = [...videos];
                                                    updated[index] = { ...updated[index], title: e.target.value };
                                                    field.onChange(updated);
                                                }}
                                                label="Title (optional)"
                                                fullWidth
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <TextField
                                                value={video.thumbnail || ''}
                                                onChange={(e) => {
                                                    const updated = [...videos];
                                                    updated[index] = { ...updated[index], thumbnail: e.target.value };
                                                    field.onChange(updated);
                                                }}
                                                label="Thumbnail URL (optional)"
                                                fullWidth
                                                size="small"
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            ))}
                            <Button
                                startIcon={<AddIcon />}
                                onClick={() => field.onChange([...videos, { type: 'youtube', url: '', thumbnail: '', title: '' }])}
                                variant="outlined"
                            >
                                Add Video
                            </Button>
                        </Box>
                    );
                }}
            />
        </Grid>
    );
}
