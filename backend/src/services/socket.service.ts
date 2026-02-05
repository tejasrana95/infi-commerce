import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config';

interface SocketUser {
    id: string;
    role: string;
    storeId?: string;
}

interface AuthenticatedSocket extends Socket {
    user?: SocketUser;
}

class SocketService {
    private io: SocketIOServer | null = null;

    /**
     * Initialize Socket.IO server
     */
    initialize(httpServer: HTTPServer): void {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: "*",
                credentials: true,
            },
            path: '/socket.io/',
        });

        // Authentication middleware
        this.io.use(async (socket: AuthenticatedSocket, next) => {
            try {
                const token = socket.handshake.auth.token;

                if (!token) {
                    return next(new Error('Authentication token required'));
                }

                // Verify JWT token
                const decoded = jwt.verify(token, config.jwt.secret) as SocketUser;

                // Only allow admin roles
                const adminRoles = ['admin', 'store_admin', 'super_admin'];
                if (!decoded.role || !adminRoles.includes(decoded.role)) {
                    return next(new Error('Unauthorized: Admin access required'));
                }

                socket.user = decoded;
                next();
            } catch (error) {
                next(new Error('Invalid authentication token'));
            }
        });

        // Handle connections
        this.io.on('connection', (socket: AuthenticatedSocket) => {
            console.log(`Admin connected: ${socket.user?.id} (${socket.user?.role})`);

            // Join admin notification room
            socket.join('admin-notifications');

            // If user has specific store, also join store-specific room
            if (socket.user?.storeId) {
                socket.join(`admin-notifications:${socket.user.storeId}`);
            }

            // Handle disconnection
            socket.on('disconnect', () => {
                console.log(`Admin disconnected: ${socket.user?.id}`);
            });

            // Optional: Handle manual notification fetch request
            socket.on('fetch-notifications', () => {
                // Client can request a refresh if needed
                // This is handled via HTTP API, so no action needed here
            });
        });

        console.log('Socket.IO server initialized');
    }

    /**
     * Emit a new notification to admins
     */
    emitAdminNotification(notification: {
        _id: string;
        type: string;
        title: string;
        message: string;
        data?: any;
        recipient?: string | null;
        isRead: boolean;
        createdAt: Date;
    }): void {
        if (!this.io) {
            console.warn('Socket.IO not initialized');
            return;
        }

        try {
            // If notification has specific recipient, emit to that user's room
            if (notification.recipient) {
                // For targeted notifications, we could join user-specific rooms
                // For now, emit to general admin room and let client filter
                this.io.to('admin-notifications').emit('admin-notification', notification);
            } else {
                // Broadcast to all admins
                this.io.to('admin-notifications').emit('admin-notification', notification);
            }

            console.log(`Emitted admin notification: ${notification.type} - ${notification.title}`);
        } catch (error) {
            console.error('Error emitting admin notification:', error);
        }
    }

    /**
     * Emit notification read event
     */
    emitNotificationRead(notificationId: string): void {
        if (!this.io) {
            return;
        }

        this.io.to('admin-notifications').emit('notification-read', { notificationId });
    }

    /**
     * Emit all notifications marked as read event
     */
    emitAllNotificationsRead(): void {
        if (!this.io) {
            return;
        }

        this.io.to('admin-notifications').emit('all-notifications-read');
    }

    /**
     * Get Socket.IO instance (for potential advanced usage)
     */
    getIO(): SocketIOServer | null {
        return this.io;
    }
}

// Export singleton instance
export const socketService = new SocketService();
