import React, { useState, MouseEvent } from 'react';
import {
    IconButton,
    Badge,
    Menu,
    MenuItem,
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    Button,
    Divider,
    Avatar
} from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import CircleIcon from '@mui/icons-material/Circle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import InfoIcon from '@mui/icons-material/Info';
import { useRouter } from 'next/navigation';
import { useAdminNotifications } from '../../contexts/AdminNotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationMenu = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useAdminNotifications();
    const router = useRouter();
    const open = Boolean(anchorEl);

    const handleClick = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = async (notification: any) => {
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }
        handleClose();

        // Navigate logic
        if ((notification.type === 'order' || notification.type === 'return') && notification.data?.orderId) {
            router.push(`/orders/${notification.data.orderId}`);
        } else if (notification.type === 'customer' && notification.data?.customerId) {
            // Assuming route /customers/:id exists, or we might need to go to list
            // router.push(`/customers/${notification.data.customerId}`); // Optional: Check routes
            router.push('/customers');
        } else if (notification.type === 'return') {
            router.push('/orders?tab=returns'); // Example
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'order': return <ShoppingCartIcon fontSize="small" />;
            case 'customer': return <PersonAddIcon fontSize="small" />;
            case 'return': return <AssignmentReturnIcon fontSize="small" />;
            default: return <InfoIcon fontSize="small" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'order': return 'primary.main';
            case 'customer': return 'success.main';
            case 'return': return 'warning.main';
            default: return 'info.main';
        }
    };

    return (
        <>
            <IconButton
                onClick={handleClick}
                size="small"
                sx={{ color: 'text.secondary' }}
                aria-controls={open ? 'notification-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
            >
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsOutlinedIcon fontSize="small" />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                id="notification-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                slotProps={{
                    paper: {
                        elevation: 0,
                        sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                            mt: 1.5,
                            width: 360,
                            maxHeight: 480,
                            overflowY: 'auto',
                            '&::before': {
                                content: '""',
                                display: 'block',
                                position: 'absolute',
                                top: 0,
                                right: 14,
                                width: 10,
                                height: 10,
                                bgcolor: 'background.paper',
                                transform: 'translateY(-50%) rotate(45deg)',
                                zIndex: 0,
                            },
                        },
                    }
                }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                        Notifications
                    </Typography>
                    {unreadCount > 0 && (
                        <Button
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                markAllAsRead();
                            }}
                        >
                            Mark all as read
                        </Button>
                    )}
                </Box>
                <Divider />

                <List sx={{ p: 0 }}>
                    {notifications.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                No notifications
                            </Typography>
                        </Box>
                    ) : (
                        notifications.map((notification) => (
                            <ListItem
                                key={notification._id}
                                alignItems="flex-start"
                                disablePadding
                                sx={{
                                    cursor: 'pointer',
                                    bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                                    '&:hover': { bgcolor: 'action.selected' },
                                    transition: 'background-color 0.2s',

                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationClick(notification);
                                }}
                            >
                                <Box sx={{ display: 'flex', width: '100%', p: 2, gap: 2 }}>
                                    <Avatar sx={{ bgcolor: `${getColor(notification.type)}20`, color: getColor(notification.type), width: 32, height: 32 }}>
                                        {getIcon(notification.type)}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" fontWeight={notification.isRead ? 400 : 600} gutterBottom>
                                            {notification.title}
                                        </Typography>
                                        <Typography variant="caption" display="block" color="text.secondary" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                                            {notification.message}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </Typography>
                                    </Box>
                                    {!notification.isRead && (
                                        <CircleIcon sx={{ width: 8, height: 8, color: 'primary.main', mt: 1 }} />
                                    )}
                                </Box>
                            </ListItem>
                        ))
                    )}
                </List>
            </Menu>
        </>
    );
};

export default NotificationMenu;
