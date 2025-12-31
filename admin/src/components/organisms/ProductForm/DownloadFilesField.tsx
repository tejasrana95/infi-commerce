'use client';

import { Box, Paper, Grid, Typography, IconButton, TextField, Button } from '@mui/material';
import { Controller } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import FileManagerButton from '../../molecules/FileManagerButton';

interface DownloadFilesFieldProps {
    control: any;
}

export default function DownloadFilesField({ control }: DownloadFilesFieldProps) {
    return (
        <Grid size={{ xs: 12 }}>
            <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>Download Files</Typography>
            <Controller
                name="downloadFiles"
                control={control}
                render={({ field }) => {
                    const files = field.value || [];

                    return (
                        <Box>
                            {files.map((file: any, index: number) => (
                                <Paper key={index} sx={{ p: 2, mb: 2 }} variant="outlined">
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="subtitle2">File {index + 1}</Typography>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => field.onChange(files.filter((_: any, i: number) => i !== index))}
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                value={file.name}
                                                onChange={(e) => {
                                                    const updated = [...files];
                                                    updated[index] = { ...updated[index], name: e.target.value };
                                                    field.onChange(updated);
                                                }}
                                                label="File Name"
                                                fullWidth
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <TextField
                                                    value={file.url}
                                                    onChange={(e) => {
                                                        const updated = [...files];
                                                        updated[index] = { ...updated[index], url: e.target.value };
                                                        field.onChange(updated);
                                                    }}
                                                    label="File URL"
                                                    fullWidth
                                                    size="small"
                                                />
                                                <FileManagerButton
                                                    onSelect={(selectedFiles) => {
                                                        if (selectedFiles.length > 0) {
                                                            const selectedFile = selectedFiles[0];
                                                            const updated = [...files];
                                                            updated[index] = {
                                                                ...updated[index],
                                                                url: selectedFile.url,
                                                                name: updated[index].name || selectedFile.originalName,
                                                                fileSize: selectedFile.size || updated[index].fileSize
                                                            };
                                                            field.onChange(updated);
                                                        }
                                                    }}
                                                    multiple={false}
                                                    label="Select"
                                                    size="small"
                                                />
                                            </Box>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 2 }}>
                                            <TextField
                                                value={file.fileSize}
                                                onChange={(e) => {
                                                    const updated = [...files];
                                                    updated[index] = { ...updated[index], fileSize: parseInt(e.target.value) || 0 };
                                                    field.onChange(updated);
                                                }}
                                                label="Size (bytes)"
                                                type="number"
                                                fullWidth
                                                size="small"
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            ))}
                            <Button
                                startIcon={<AddIcon />}
                                onClick={() => field.onChange([...files, { name: '', url: '', fileSize: 0 }])}
                                variant="outlined"
                            >
                                Add Download File
                            </Button>
                        </Box>
                    );
                }}
            />
        </Grid>
    );
}
