'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
    Box,
    Typography,
    Card,
    CardActionArea,
    CardContent,
    CircularProgress,
    alpha,
    Chip
} from '@mui/material';
import BackupIcon from '@mui/icons-material/Backup';
import SettingsIcon from '@mui/icons-material/Settings';
import EmailIcon from '@mui/icons-material/Email';
import KeyIcon from '@mui/icons-material/Key';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SecurityIcon from '@mui/icons-material/Security';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CookieIcon from '@mui/icons-material/Cookie';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import PageHeader from '@/components/molecules/PageHeader';

interface SettingCard {
    title: string;
    description: string;
    icon: React.ReactNode;
    link: string;
    badge?: string;
    badgeColor?: 'warning' | 'info' | 'success' | 'error';
    color: string;
    enabled: boolean;
}

export default function SettingsPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && (!user || user.role !== 'super_admin')) {
            router.push(user ? '/dashboard' : '/login');
        }
    }, [user, loading, router]);

    if (loading || !user || user.role !== 'super_admin') {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="50vh">
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary">Loading...</Typography>
            </Box>
        );
    }

    const settingsCards: SettingCard[] = [
        {
            title: 'General Settings',
            description: 'Configure global admin branding, company information, and system-wide parameters.',
            icon: <SettingsIcon sx={{ fontSize: 32 }} />,
            link: '/settings/general',
            badge: 'Super Admin',
            badgeColor: 'warning',
            color: '#10b981',
            enabled: true
        },
        {
            title: 'Backup & Restore',
            description: 'Export and import data in Excel format, manage database backups, and restore snapshots.',
            icon: <BackupIcon sx={{ fontSize: 32 }} />,
            link: '/settings/backup-restore',
            badge: 'Super Admin',
            badgeColor: 'warning',
            color: '#6366f1',
            enabled: true
        },
        {
            title: 'Store Management',
            description: 'Configure multi-store settings, default store, and store-specific options.',
            icon: <StorefrontIcon sx={{ fontSize: 32 }} />,
            link: '/stores',
            badge: 'Super Admin',
            badgeColor: 'warning',
            color: '#8b5cf6',
            enabled: true
        },
        {
            title: 'API Keys',
            description: 'Manage API keys for third-party integrations and external services.',
            icon: <KeyIcon sx={{ fontSize: 32 }} />,
            link: '/settings/api-keys',
            badge: 'Super Admin',
            badgeColor: 'warning',
            color: '#ef4444',
            enabled: true
        },
        {
            title: 'URL Redirections',
            description: 'Manage custom URL redirections that override product, category, and page slugs.',
            icon: <SecurityIcon sx={{ fontSize: 32 }} />,
            link: '/settings/redirections',
            badge: 'Super Admin',
            badgeColor: 'warning',
            color: '#06b6d4',
            enabled: true
        },
        {
            title: 'POS PWA Settings',
            description: 'Configure Progressive Web App settings for the Point of Sale system.',
            icon: <PhoneIphoneIcon sx={{ fontSize: 32 }} />,
            link: '/settings/pos-pwa',
            badge: 'Super Admin',
            badgeColor: 'warning',
            color: '#7c3aed',
            enabled: true
        },
    ];

    return (
        <Box>
            <PageHeader
                title="System Settings"
                subtitle="Manage and configure global system parameters, database backups, and data portability."
            />

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)'
                    },
                    gap: 3
                }}
            >
                {settingsCards.map((card, index) => (
                    <Card
                        key={index}
                        variant="outlined"
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            overflow: 'visible',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            opacity: card.enabled ? 1 : 0.7,
                            '&:hover': card.enabled ? {
                                boxShadow: `0 20px 40px ${alpha(card.color, 0.15)}`,
                                borderColor: card.color,
                                transform: 'translateY(-6px)'
                            } : {},
                            borderRadius: 3,
                            bgcolor: 'background.paper'
                        }}
                    >
                        <CardActionArea
                            component={card.enabled ? Link : 'div'}
                            href={card.enabled ? card.link : undefined}
                            sx={{
                                height: '100%',
                                p: 0.5,
                                cursor: card.enabled ? 'pointer' : 'default'
                            }}
                            disabled={!card.enabled}
                        >
                            <CardContent sx={{ py: 3.5, px: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                {/* Icon Container with Gradient */}
                                <Box
                                    sx={{
                                        width: 72,
                                        height: 72,
                                        borderRadius: 3,
                                        background: `linear-gradient(135deg, ${alpha(card.color, 0.15)} 0%, ${alpha(card.color, 0.05)} 100%)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 3,
                                        color: card.color,
                                        transition: 'all 0.3s ease',
                                        border: `1px solid ${alpha(card.color, 0.1)}`,
                                        ...(card.enabled && {
                                            '.MuiCardActionArea-root:hover &': {
                                                transform: 'scale(1.05)',
                                                background: `linear-gradient(135deg, ${alpha(card.color, 0.2)} 0%, ${alpha(card.color, 0.1)} 100%)`
                                            }
                                        })
                                    }}
                                >
                                    {card.icon}
                                </Box>

                                {/* Title */}
                                <Typography
                                    variant="h6"
                                    component="h3"
                                    sx={{
                                        fontWeight: 700,
                                        mb: 1,
                                        color: 'text.primary',
                                        fontSize: '1.1rem'
                                    }}
                                >
                                    {card.title}
                                </Typography>

                                {/* Description */}
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        mb: 3,
                                        lineHeight: 1.6,
                                        fontSize: '0.875rem',
                                        flex: 1
                                    }}
                                >
                                    {card.description}
                                </Typography>

                                {/* Footer */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        pt: 2,
                                        borderTop: 1,
                                        borderColor: 'divider',
                                        mt: 'auto'
                                    }}
                                >
                                    {card.badge && (
                                        <Chip
                                            label={card.badge}
                                            size="small"
                                            color={card.badgeColor}
                                            sx={{
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                height: 24
                                            }}
                                        />
                                    )}
                                    {card.enabled && (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: 'text.secondary',
                                                fontSize: '0.8rem',
                                                fontWeight: 500,
                                                ml: 'auto',
                                                transition: 'all 0.2s ease',
                                                '.MuiCardActionArea-root:hover &': {
                                                    color: card.color,
                                                    transform: 'translateX(4px)'
                                                }
                                            }}
                                        >
                                            Configure
                                            <NavigateNextIcon sx={{ fontSize: 18, ml: 0.5 }} />
                                        </Box>
                                    )}
                                </Box>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                ))}
            </Box>
        </Box>
    );
}
