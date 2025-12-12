import { memo } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import Link from 'next/link';

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const EmptyState = memo(({
  message,
  actionLabel,
  actionHref,
  onAction,
  icon
}: EmptyStateProps) => {
  return (
    <Paper
      sx={{
        p: 4,
        textAlign: 'center',
        bgcolor: 'background.paper',
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          p: 2,
          borderRadius: '50%',
          bgcolor: 'action.hover',
          color: 'text.secondary',
          mb: 2,
        }}
      >
        {icon || <InboxIcon sx={{ fontSize: 40 }} />}
      </Box>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        {message}
      </Typography>
      {(actionLabel && (actionHref || onAction)) && (
        <Box mt={2}>
          {actionHref ? (
            <Button
              component={Link}
              href={actionHref}
              variant="contained"
              size="medium"
            >
              {actionLabel}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={onAction}
              size="medium"
            >
              {actionLabel}
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;
