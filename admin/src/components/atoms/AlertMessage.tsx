import { memo } from 'react';
import { Alert, AlertProps, Collapse } from '@mui/material';

interface AlertMessageProps extends Omit<AlertProps, 'onClose'> {
    message: string;
    open?: boolean;
    onClose?: () => void;
}

const AlertMessage = memo(({
    message,
    open = true,
    onClose,
    severity = 'info',
    ...props
}: AlertMessageProps) => {
    return (
        <Collapse in={open}>
            <Alert
                severity={severity}
                onClose={onClose}
                sx={{
                    mb: 2,
                    fontSize: '0.875rem',
                    ...props.sx,
                }}
                {...props}
            >
                {message}
            </Alert>
        </Collapse>
    );
});

AlertMessage.displayName = 'AlertMessage';

export default AlertMessage;
