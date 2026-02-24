'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/api';
import { useAuth } from './AuthContext';
import { AdminNotification } from '@/types';

interface AdminNotificationContextType {
    notifications: AdminNotification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const AdminNotificationContext = createContext<AdminNotificationContextType | undefined>(undefined);

const getSocketUrl = () => {
    const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim();

    // Prefer a valid absolute URL from env.
    if (rawApiUrl) {
        try {
            const parsed = new URL(rawApiUrl);
            return parsed.origin;
        } catch {
            // Allow values like "localhost:3001/api" (without protocol)
            if (/^[^/]+:\d+(\/.*)?$/.test(rawApiUrl)) {
                return `http://${rawApiUrl.replace(/\/api\/?$/, '')}`;
            }
        }
    }

    // Browser fallback (useful for misconfigured env like "https")
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    return 'http://localhost:3001';
};

export function AdminNotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const previousCountRef = useRef(0);
    const socketRef = useRef<Socket | null>(null);

    // Request notification permission & Init Audio
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        audioRef.current = new Audio('/notification/notification.mp3');
    }, []);

    const fetchNotifications = useCallback(async (silent = false) => {
        if (!user) return;

        if (!silent) setLoading(true);
        try {
            const response = await api.get('/notifications/admin', {
                params: { limit: 20 }
            });

            if (response.data.success) {
                const newNotifications = response.data.notifications;
                const newUnreadCount = response.data.unreadCount;

                setNotifications(newNotifications);
                setUnreadCount(newUnreadCount);
                previousCountRef.current = newUnreadCount;
            }
        } catch (error) {
            console.error('Failed to fetch admin notifications:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [user]);

    // Handle new notification via Socket.IO
    const handleNewNotification = useCallback((notification: AdminNotification) => {
        // Add notification to the list
        setNotifications(prev => [notification, ...prev]);
        
        // Increment unread count
        setUnreadCount(prev => prev + 1);

        // Trigger notifications (Browser + Sound)
        if (!notification.isRead) {
            // 1. Browser Notification
            if ('Notification' in window && Notification.permission === 'granted') {
                try {
                    new Notification(notification.title, {
                        body: notification.message,
                        icon: '/icons/icon-192x192.png'
                    });
                } catch (e) {
                    console.error('Notification error:', e);
                }
            }

            // 2. Audio Fallback
            try {
                const promise = audioRef.current?.play();
                if (promise) {
                    promise.catch(() => {
                        // Autoplay policy might block this
                    });
                }
            } catch { }
        }

        previousCountRef.current = previousCountRef.current + 1;
    }, []);

    // Handle notification read event
    const handleNotificationRead = useCallback(({ notificationId }: { notificationId: string }) => {
        setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        previousCountRef.current = Math.max(0, previousCountRef.current - 1);
    }, []);

    // Handle all notifications read event
    const handleAllNotificationsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        previousCountRef.current = 0;
    }, []);

    // Initialize Socket.IO connection
    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem('accesstoken');
        if (!token) return;
        const socketUrl = getSocketUrl();

        // Create socket connection
        const socket = io(socketUrl, {
            auth: {
                token
            },
            transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
            console.log('Socket.IO connected for admin notifications');
        });

        socket.on('disconnect', () => {
            console.log('Socket.IO disconnected');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error.message);
        });

        // Listen for new notifications
        socket.on('admin-notification', handleNewNotification);

        // Listen for notification read events
        socket.on('notification-read', handleNotificationRead);

        // Listen for all notifications read event
        socket.on('all-notifications-read', handleAllNotificationsRead);

        socketRef.current = socket;

        // Cleanup on unmount
        return () => {
            socket.off('admin-notification', handleNewNotification);
            socket.off('notification-read', handleNotificationRead);
            socket.off('all-notifications-read', handleAllNotificationsRead);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user, handleNewNotification, handleNotificationRead, handleAllNotificationsRead]);

    const markAsRead = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            previousCountRef.current = Math.max(0, previousCountRef.current - 1);

            await api.put(`/notifications/admin/${id}/read`);
        } catch (error) {
            console.error('Failed to mark as read:', error);
            fetchNotifications(true);
        }
    };

    const markAllAsRead = async () => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            previousCountRef.current = 0;

            await api.put('/notifications/admin/read-all');
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            fetchNotifications(true);
        }
    };

    // Initial fetch on mount or user change
    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user, fetchNotifications]);

    return (
        <AdminNotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            fetchNotifications,
            markAsRead,
            markAllAsRead
        }}>
            {children}
        </AdminNotificationContext.Provider>
    );
}

export function useAdminNotifications() {
    const context = useContext(AdminNotificationContext);
    if (context === undefined) {
        throw new Error('useAdminNotifications must be used within a AdminNotificationProvider');
    }
    return context;
}
