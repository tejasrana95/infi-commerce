import { alpha } from "@mui/material";

export const createDataGridStyles = (theme: any) => ({
    border: 'none',
    '& .MuiDataGrid-cell': {
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        py: 1,
    },
    '& .MuiDataGrid-row': {
        cursor: 'pointer',
        position: 'relative',
        '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            transform: 'translateY(-1px)',
            transition: 'all 0.2s ease-in-out',
            boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
            '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '3px',
                backgroundColor: theme.palette.primary.main,
                borderRadius: '0 2px 2px 0',
            },
        },
    },
    '& .MuiDataGrid-columnHeaders': {
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
        borderBottom: `2px solid ${theme.palette.primary.main}`,
        '& .MuiDataGrid-columnHeader': {
            fontWeight: 600,
        },
    },
    '& .MuiDataGrid-footerContainer': {
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        backgroundColor: alpha(theme.palette.background.paper, 0.5),
    },
});
