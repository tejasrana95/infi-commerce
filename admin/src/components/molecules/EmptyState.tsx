import { Box, Typography, Button, Paper } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import Link from 'next/link';

interface EmptyStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function EmptyState({ 
  title = 'No data found',
  message, 
  actionLabel, 
  actionHref,
  onAction 
}: EmptyStateProps) {
  return (
    <Paper
      sx={{
        p: 6,
        textAlign: 'center',
        border: '2px dashed',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <InboxIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {message}
      </Typography>
      {(actionLabel && (actionHref || onAction)) && (
        actionHref ? (
          <Button component={Link} href={actionHref} variant="contained">
            {actionLabel}
          </Button>
        ) : (
          <Button variant="contained" onClick={onAction}>
            {actionLabel}
          </Button>
        )
      )}
    </Paper>
  );
}
