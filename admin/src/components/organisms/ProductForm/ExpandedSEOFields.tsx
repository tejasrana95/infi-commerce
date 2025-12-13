'use client';

import { useState } from 'react';
import { Box, Grid, TextField, IconButton, Chip } from '@mui/material';
import { Controller } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';

interface ExpandedSEOFieldsProps {
    control: any;
}

export default function ExpandedSEOFields({ control }: ExpandedSEOFieldsProps) {
    const [keywordInput, setKeywordInput] = useState('');

    return (
        <>
            <Grid size={{ xs: 12 }}>
                <Controller
                    name="seo.metaKeywords"
                    control={control}
                    render={({ field }) => {
                        const keywords = field.value || [];

                        return (
                            <Box>
                                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                    <TextField
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (keywordInput.trim()) {
                                                    field.onChange([...keywords, keywordInput.trim()]);
                                                    setKeywordInput('');
                                                }
                                            }
                                        }}
                                        label="Meta Keywords"
                                        placeholder="Add keyword and press Enter"
                                        size="small"
                                        fullWidth
                                    />
                                    <IconButton
                                        onClick={() => {
                                            if (keywordInput.trim()) {
                                                field.onChange([...keywords, keywordInput.trim()]);
                                                setKeywordInput('');
                                            }
                                        }}
                                        color="primary"
                                    >
                                        <AddIcon />
                                    </IconButton>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {keywords.map((keyword: string, index: number) => (
                                        <Chip
                                            key={index}
                                            label={keyword}
                                            onDelete={() => field.onChange(keywords.filter((_: string, i: number) => i !== index))}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        );
                    }}
                />
            </Grid>

            <Grid size={{ xs: 12 }}>
                <Controller
                    name="seo.focusKeyword"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Focus Keyword"
                            fullWidth
                            helperText="Primary keyword for SEO"
                        />
                    )}
                />
            </Grid>

            <Grid size={{ xs: 12 }}>
                <Controller
                    name="seo.ogTitle"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="OG Title"
                            fullWidth
                            helperText="Open Graph title for social sharing"
                        />
                    )}
                />
            </Grid>

            <Grid size={{ xs: 12 }}>
                <Controller
                    name="seo.ogDescription"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="OG Description"
                            fullWidth
                            multiline
                            rows={2}
                            helperText="Open Graph description for social sharing"
                        />
                    )}
                />
            </Grid>
        </>
    );
}
