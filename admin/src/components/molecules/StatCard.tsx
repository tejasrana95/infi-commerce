import { memo } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard = memo(({ icon, title, value, subtitle, trend }: StatCardProps) => {
  return (
    <Card
      sx={{
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" gap={1.5} alignItems="flex-start">
          <Box
            sx={{
              fontSize: 32,
              lineHeight: 1,
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </Box>
          <Box flex={1} minWidth={0}>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                fontSize: '0.688rem',
                mb: 0.5,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: 700,
                mb: subtitle || trend ? 0.5 : 0,
                lineHeight: 1.2,
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Typography
                variant="caption"
                sx={{
                  color: trend.isPositive ? 'success.main' : 'error.main',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              >
                {trend.isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {Math.abs(trend.value)}%
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
