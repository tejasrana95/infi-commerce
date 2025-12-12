import { memo } from 'react';
import { Chip } from '@mui/material';

interface StatusChipProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

const StatusChip = memo(({
  active,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive'
}: StatusChipProps) => {
  return (
    <Chip
      label={active ? activeLabel : inactiveLabel}
      color={active ? 'success' : 'default'}
      size="small"
      sx={{
        height: 22,
        fontSize: '0.75rem',
        fontWeight: 600,
        '& .MuiChip-label': {
          px: 1,
          py: 0,
        },
      }}
    />
  );
});

StatusChip.displayName = 'StatusChip';

export default StatusChip;
