import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function PageHeader({ 
  title, 
  subtitle, 
  actionLabel, 
  actionHref,
  onAction 
}: PageHeaderProps) {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="flex-start"
      mb={3}
      flexWrap="wrap"
      gap={2}
    >
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {(actionLabel && (actionHref || onAction)) && (
        actionHref ? (
          <Button
            component={Link}
            href={actionHref}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            {actionLabel}
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAction}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            {actionLabel}
          </Button>
        )
      )}
    </Box>
  );
}
