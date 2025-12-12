import { memo } from 'react';
import { Paper, Box, Typography, IconButton, Tooltip } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';

interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    action?: React.ReactNode;
    onExport?: () => void;
}

const ChartCard = memo(({ title, subtitle, children, action, onExport }: ChartCardProps) => {
    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2.5,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2.5}>
                <Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" color="text.secondary" fontSize="0.8125rem">
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                <Box display="flex" gap={0.5}>
                    {onExport && (
                        <Tooltip title="Export">
                            <IconButton size="small" onClick={onExport}>
                                <FileDownloadOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {action || (
                        <IconButton size="small">
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            </Box>

            <Box flex={1} minHeight={0}>
                {children}
            </Box>
        </Paper>
    );
});

ChartCard.displayName = 'ChartCard';

export default ChartCard;
