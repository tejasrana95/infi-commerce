import { memo } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  fullHeight?: boolean;
}

const LoadingSpinner = memo(({
  message = 'Loading...',
  size = 32,
  fullHeight = false
}: LoadingSpinnerProps) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight={fullHeight ? '60vh' : '200px'}
      gap={1.5}
      py={2}
    >
      <CircularProgress size={size} thickness={4} />
      {message && (
        <Typography variant="body2" color="text.secondary" fontSize="0.813rem">
          {message}
        </Typography>
      )}
    </Box>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
