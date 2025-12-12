'use client';

import { Box, Paper, Typography } from '@mui/material';
import FileManager from '@/components/organisms/FileManager';

export default function FileManagerPage() {
    return (
        <Box>
            <Box mb={3}>
                <Typography variant="h4" fontWeight={600} gutterBottom>
                    File Manager
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Manage your files and folders
                </Typography>
            </Box>

            <Paper sx={{ p: 3 }}>
                <FileManager mode="embedded" />
            </Paper>
        </Box>
    );
}
