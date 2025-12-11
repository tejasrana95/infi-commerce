import { Chip } from '@mui/material';

interface StatusChipProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export default function StatusChip({ 
  active, 
  activeLabel = 'Active', 
  inactiveLabel = 'Inactive' 
}: StatusChipProps) {
  return (
    <Chip
      label={active ? activeLabel : inactiveLabel}
      color={active ? 'success' : 'default'}
      size="small"
      sx={{ fontWeight: 600 }}
    />
  );
}
