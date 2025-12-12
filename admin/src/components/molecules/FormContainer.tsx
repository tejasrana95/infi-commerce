import { memo, ReactNode } from 'react';
import { Paper, Box, Typography, Divider } from '@mui/material';

interface FormContainerProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    actions?: ReactNode;
}

const FormContainer = memo(({ title, subtitle, children, actions }: FormContainerProps) => {
    return (
        <Paper
            sx={{
                p: 2.5,
                borderRadius: 2,
            }}
        >
            <Box mb={2}>
                <Typography variant="h6" component="h2" fontWeight={600} gutterBottom>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                        {subtitle}
                    </Typography>
                )}
            </Box>

            {(title || subtitle) && <Divider sx={{ mb: 2.5 }} />}

            <Box>{children}</Box>

            {actions && (
                <>
                    <Divider sx={{ my: 2.5 }} />
                    <Box display="flex" gap={1.5} justifyContent="flex-end">
                        {actions}
                    </Box>
                </>
            )}
        </Paper>
    );
});

FormContainer.displayName = 'FormContainer';

export default FormContainer;
