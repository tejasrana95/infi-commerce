'use client';

import React from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { useTheme, alpha } from '@mui/material/styles';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import Image from 'next/image';

export default function NotFound() {
    const theme = useTheme();

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                position: 'relative',
                overflow: 'hidden',
                py: 4,
            }}
        >
            {/* Abstract Background Decoration */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -100,
                    right: -100,
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
                    zIndex: 0,
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: -150,
                    left: -150,
                    width: 500,
                    height: 500,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.08)} 0%, transparent 70%)`,
                    zIndex: 0,
                }}
            />

            <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                    }}
                >
                    {/* Animated 404 Text */}
                    <Box
                        sx={{
                            position: 'relative',
                            mb: 4,
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                bottom: -10,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 60,
                                height: 4,
                                borderRadius: 2,
                                bgcolor: 'primary.main',
                                opacity: 0.6,
                            }
                        }}
                    >
                        <Typography
                            variant="h1"
                            sx={{
                                fontSize: { xs: '8rem', md: '12rem' },
                                fontWeight: 900,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                lineHeight: 1,
                                letterSpacing: '-0.05em',
                                mb: 0,
                            }}
                        >
                            404
                        </Typography>
                    </Box>

                    <Box sx={{ mb: 6 }}>
                        <Typography variant="h3" gutterBottom fontWeight={700} color="text.primary">
                            Oops! Page not found
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', fontSize: '1.1rem' }}>
                            The page you're looking for might have been moved, deleted, or never existed in the first place. Don't worry, even the best of us get lost sometimes.
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Button
                            component={Link}
                            href="/dashboard"
                            variant="contained"
                            size="large"
                            startIcon={<HomeRoundedIcon />}
                            sx={{
                                px: 4,
                                py: 1.5,
                                borderRadius: 3,
                                fontSize: '1rem',
                                fontWeight: 600,
                                boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.25)}`,
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
                                }
                            }}
                        >
                            Back to Dashboard
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<ErrorOutlineRoundedIcon />}
                            onClick={() => window.location.reload()}
                            sx={{
                                px: 4,
                                py: 1.5,
                                borderRadius: 3,
                                fontSize: '1rem',
                                fontWeight: 600,
                                borderWidth: 2,
                                '&:hover': {
                                    borderWidth: 2,
                                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                                }
                            }}
                        >
                            Reload Page
                        </Button>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
