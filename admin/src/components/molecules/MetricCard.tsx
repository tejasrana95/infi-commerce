import { memo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: React.ReactNode;
    loading?: boolean;
}

const MetricCard = memo(({
    title,
    value,
    change,
    changeLabel = 'vs last month',
    icon,
    loading = false
}: MetricCardProps) => {
    const isPositive = change !== undefined && change >= 0;
    const hasChange = change !== undefined;

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2.5,
                height: '100%',
                transition: 'all 0.15s ease-in-out',
                '&:hover': {
                    boxShadow: 2,
                },
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.75rem',
                    }}
                >
                    {title}
                </Typography>
                {icon && (
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '6px',
                            bgcolor: 'primary.50',
                            color: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {icon}
                    </Box>
                )}
            </Box>

            <Typography
                variant="h4"
                sx={{
                    fontWeight: 700,
                    mb: hasChange ? 1 : 0,
                    color: 'text.primary',
                }}
            >
                {loading ? '-' : value}
            </Typography>

            {hasChange && (
                <Box display="flex" alignItems="center" gap={0.5}>
                    {isPositive ? (
                        <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    ) : (
                        <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                    )}
                    <Typography
                        variant="body2"
                        sx={{
                            color: isPositive ? 'success.main' : 'error.main',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                        }}
                    >
                        {isPositive ? '+' : ''}{change}%
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '0.8125rem' }}
                    >
                        {changeLabel}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
});

MetricCard.displayName = 'MetricCard';

export default MetricCard;
