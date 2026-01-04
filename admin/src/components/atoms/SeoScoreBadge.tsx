import React from 'react';
import { Typography, Box } from '@mui/material';

interface SeoScoreBadgeProps {
    score?: number;
}

const SeoScoreBadge: React.FC<SeoScoreBadgeProps> = ({ score }) => {
    if (score === undefined || score === null) {
        return (
            <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
                <Typography variant="caption" color="text.secondary">N/A</Typography>
            </Box>
        );
    }

    const getColor = (s: number) => {
        if (s >= 70) return 'success.main';
        if (s >= 40) return 'warning.main';
        return 'error.main';
    };

    return (
        <Box display="flex" flexDirection="column" justifyContent="center" height="100%">
            <Typography
                variant="body2"
                fontWeight="bold"
                sx={{ color: getColor(score) }}
            >
                {score}/100
            </Typography>
        </Box>
    );
};

export default SeoScoreBadge;
