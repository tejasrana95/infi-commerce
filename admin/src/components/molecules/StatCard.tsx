import { Card, CardContent, Typography, Box } from '@mui/material';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
}

export default function StatCard({ icon, title, value, subtitle }: StatCardProps) {
  return (
    <Card
      sx={{
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
      }}
    >
      <CardContent>
        <Box display="flex" gap={2} alignItems="flex-start">
          <Box sx={{ fontSize: 40, lineHeight: 1 }}>{icon}</Box>
          <Box flex={1}>
            <Typography
              variant="overline"
              color="text.secondary"
              display="block"
              sx={{ fontWeight: 600, letterSpacing: 1 }}
            >
              {title}
            </Typography>
            <Typography variant="h4" component="div" gutterBottom sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
