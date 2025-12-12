import { memo } from 'react';
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

const PageHeader = memo(({
  title,
  subtitle,
  actionLabel,
  actionHref,
  onAction
}: PageHeaderProps) => {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      mb={2}
      flexWrap="wrap"
      gap={1.5}
    >
      <Box>
        <Typography
          variant="h5"
          component="h1"
          fontWeight={700}
          sx={{ mb: subtitle ? 0.5 : 0 }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
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
            size="medium"
            sx={{
              minWidth: { xs: '100%', sm: 'auto' },
              height: 36,
            }}
          >
            {actionLabel}
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAction}
            size="medium"
            sx={{
              minWidth: { xs: '100%', sm: 'auto' },
              height: 36,
            }}
          >
            {actionLabel}
          </Button>
        )
      )}
    </Box>
  );
});

PageHeader.displayName = 'PageHeader';

export default PageHeader;
