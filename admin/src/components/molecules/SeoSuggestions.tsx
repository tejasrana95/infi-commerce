import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Fade,
    Divider
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface SeoSuggestionsProps {
    suggestions?: string[];
    score?: number;
}

const SeoSuggestions: React.FC<SeoSuggestionsProps> = ({ suggestions = [], score = 0 }) => {
    if (suggestions.length === 0) return null;

    return (
        <Fade in={suggestions.length > 0} timeout={400}>
            <Box
                sx={{
                    mt: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    overflow: 'hidden'
                }}
            >
                <Box
                    sx={{
                        px: 2,
                        py: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'grey.50'
                    }}
                >
                    <AutoFixHighIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                        SEO Improvement Suggestions
                    </Typography>
                    {score > 0 && (
                        <Box
                            sx={{
                                ml: 'auto',
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                bgcolor: score >= 70 ? 'success.50' : score >= 40 ? 'warning.50' : 'error.50',
                                color: score >= 70 ? 'success.dark' : score >= 40 ? 'warning.dark' : 'error.dark',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                border: '1px solid',
                                borderColor: score >= 70 ? 'success.200' : score >= 40 ? 'warning.200' : 'error.200',
                                textTransform: 'uppercase',
                                letterSpacing: '0.02em'
                            }}
                        >
                            Score: {score}/100
                        </Box>
                    )}
                </Box>

                <List sx={{ p: 0 }} dense>
                    {suggestions.map((suggestion, index) => (
                        <ListItem
                            key={index}
                            alignItems="flex-start"
                            sx={{
                                py: 1,
                                px: 2,
                                '&:hover': { bgcolor: 'grey.50' },
                                borderBottom: index < suggestions.length - 1 ? '1px solid' : 'none',
                                borderColor: 'grey.100'
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 28, mt: 0.25 }}>
                                <Box
                                    sx={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        bgcolor: 'primary.main',
                                        mt: 0.75,
                                        opacity: 0.6
                                    }}
                                />
                            </ListItemIcon>
                            <ListItemText
                                primary={suggestion}
                                primaryTypographyProps={{
                                    variant: 'body2',
                                    color: 'text.secondary',
                                    sx: { fontSize: '0.85rem', lineHeight: 1.5 }
                                }}
                            />
                        </ListItem>
                    ))}
                </List>

                <Box sx={{ px: 2, py: 1, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.disabled" fontWeight={500}>
                        AI generated insights to optimize search ranking.
                    </Typography>
                </Box>
            </Box>
        </Fade>
    );
};

export default SeoSuggestions;
