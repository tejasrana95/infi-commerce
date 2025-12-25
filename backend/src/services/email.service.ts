/**
 * Email Service - now uses the notification queue system
 * 
 * This service provides helper functions for sending transactional emails
 * through the notification queue, which uses store-specific email settings.
 */

import { notificationService } from './notification.service';

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Send password reset email via notification queue
 */
export const sendPasswordResetEmail = async (
    storeId: string,
    storeName: string,
    to: string,
    resetToken: string,
    firstName: string
): Promise<boolean> => {
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
        await notificationService.queueNotification({
            storeId,
            channel: 'email',
            priority: 'high',
            type: 'password_reset',
            recipient: to,
            recipientName: firstName,
            templateData: {
                firstName,
                storeName,
                resetUrl,
            },
        });
        return true;
    } catch (error) {
        console.error('[Email Service] Failed to queue password reset email:', error);
        return false;
    }
};

/**
 * Send email verification email via notification queue
 */
export const sendEmailVerificationEmail = async (
    storeId: string,
    storeName: string,
    to: string,
    verificationToken: string,
    firstName: string
): Promise<boolean> => {
    const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    try {
        await notificationService.queueNotification({
            storeId,
            channel: 'email',
            priority: 'high',
            type: 'verify_email',
            recipient: to,
            recipientName: firstName,
            templateData: {
                firstName,
                storeName,
                verifyUrl,
            },
        });
        return true;
    } catch (error) {
        console.error('[Email Service] Failed to queue verification email:', error);
        return false;
    }
};

/**
 * Send welcome email after registration via notification queue
 */
export const sendWelcomeEmail = async (
    storeId: string,
    storeName: string,
    to: string,
    firstName: string
): Promise<boolean> => {
    const loginUrl = `${frontendUrl}/login`;

    try {
        await notificationService.queueNotification({
            storeId,
            channel: 'email',
            priority: 'normal',
            type: 'welcome',
            recipient: to,
            recipientName: firstName,
            templateData: {
                firstName,
                storeName,
                loginUrl,
            },
        });
        return true;
    } catch (error) {
        console.error('[Email Service] Failed to queue welcome email:', error);
        return false;
    }
};

export default {
    sendPasswordResetEmail,
    sendEmailVerificationEmail,
    sendWelcomeEmail,
};
