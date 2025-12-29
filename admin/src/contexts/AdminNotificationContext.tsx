'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from './AuthContext';

export interface AdminNotification {
    _id: string;
    type: 'order' | 'customer' | 'return' | 'system';
    title: string;
    message: string;
    data?: any;
    isRead: boolean;
    createdAt: string;
}

interface AdminNotificationContextType {
    notifications: AdminNotification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const AdminNotificationContext = createContext<AdminNotificationContextType | undefined>(undefined);

export function AdminNotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const previousCountRef = useRef(0);

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

                // Trigger notifications (Browser + Sound) if new unread items arrived
                if (newUnreadCount > previousCountRef.current && newNotifications.length > 0) {
                    // 1. Browser Notification
                    // Try to find the newest unread notification
                    // Assuming API returns sorted by newest first
                    const latest = newNotifications.find((n: AdminNotification) => !n.isRead);

                    if (latest && 'Notification' in window && Notification.permission === 'granted') {
                        try {
                            new Notification(latest.title, {
                                body: latest.message,
                                icon: '/icons/icon-192x192.png' // Optional: generic icon or leave default
                            });
                        } catch (e) {
                            console.error('Notification error:', e);
                        }
                    }

                    // 2. Audio Fallback
                    try {
                        const promise = audioRef.current?.play();
                        if (promise) {
                            promise.catch(e => {
                                // Autoplay policy might block this
                                console.log('Audio play blocked:', e);
                            });
                        }
                    } catch (e) { }
                }
                previousCountRef.current = newUnreadCount;
            }
        } catch (error) {
            console.error('Failed to fetch admin notifications:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [user]);

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

    // Initial fetch and polling
    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(() => {
            fetchNotifications(true);
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, [fetchNotifications]);

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
