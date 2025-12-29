/**
 * Static Default Notification Templates
 * 
 * These templates are used as defaults when users click "Load Default" in the admin UI.
 * They are NOT stored in the database - they serve as static content for initialization.
 */

export interface DefaultTemplate {
    type: string;
    channel: 'email' | 'sms' | 'whatsapp' | 'telegram';
    name: string;
    subject?: string;
    htmlContent?: string;
    textContent: string;
    variables: string[];
}

// Template type definitions with their available variables
export const TEMPLATE_TYPES = {
    welcome: {
        label: 'Welcome',
        description: 'Sent when a new user registers',
        variables: ['firstName', 'lastName', 'email', 'storeName', 'loginUrl'],
    },
    verify_email: {
        label: 'Email Verification',
        description: 'Sent to verify email address',
        variables: ['firstName', 'verifyUrl', 'storeName'],
    },
    password_reset: {
        label: 'Password Reset',
        description: 'Sent when user requests password reset',
        variables: ['firstName', 'resetUrl', 'storeName'],
    },
    order_created: {
        label: 'Order Created',
        description: 'Sent when order is placed',
        variables: ['firstName', 'orderNumber', 'total', 'itemCount', 'orderUrl', 'storeName'],
    },
    order_pending: {
        label: 'Order Pending',
        description: 'Sent when order is marked as pending',
        variables: ['firstName', 'orderNumber', 'total', 'itemCount', 'orderUrl', 'storeName'],
    },
    order_processing: {
        label: 'Order Processing',
        description: 'Sent when order is being processed',
        variables: ['firstName', 'orderNumber', 'total', 'itemCount', 'orderUrl', 'storeName'],
    },
    order_shipped: {
        label: 'Order Shipped',
        description: 'Sent when order is shipped',
        variables: ['firstName', 'orderNumber', 'trackingNumber', 'trackingUrl', 'storeName'],
    },
    order_delivered: {
        label: 'Order Delivered',
        description: 'Sent when order is delivered',
        variables: ['firstName', 'orderNumber', 'reviewUrl', 'storeName'],
    },
    order_cancelled: {
        label: 'Order Cancelled',
        description: 'Sent when order is cancelled',
        variables: ['firstName', 'orderNumber', 'reason', 'storeName'],
    },
    order_refunded: {
        label: 'Order Refunded',
        description: 'Sent when refund is processed',
        variables: ['firstName', 'orderNumber', 'amount', 'storeName'],
    },
    order_failed: {
        label: 'Order Failed',
        description: 'Sent when payment fails',
        variables: ['firstName', 'orderNumber', 'total', 'orderUrl', 'storeName'],
    },
    admin_order_created: {
        label: 'Admin: New Order',
        description: 'Sent to admin when a new order is placed',
        variables: ['orderNumber', 'customerName', 'total', 'status', 'orderId', 'storeName'],
    },
    admin_order_updated: {
        label: 'Admin: Order Updated',
        description: 'Sent to admin when an order status is updated',
        variables: ['orderNumber', 'customerName', 'total', 'status', 'orderId', 'storeName'],
    },
    admin_return_requested: {
        label: 'Admin: Return Requested',
        description: 'Sent to admin when a return is requested',
        variables: ['orderNumber', 'customerName', 'total', 'status', 'orderId', 'storeName'],
    },
    admin_order_cancelled: {
        label: 'Admin: Order Cancelled',
        description: 'Sent to admin when an order is cancelled',
        variables: ['orderNumber', 'customerName', 'total', 'status', 'orderId', 'storeName'],
    },
    admin_customer_signup: {
        label: 'Admin: New Customer',
        description: 'Sent to admin when a new customer registers',
        variables: ['email', 'firstName', 'phone', 'storeName'],
    }
} as const;

export type TemplateType = keyof typeof TEMPLATE_TYPES;

// Static default templates
export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
    // ============================================
    // Welcome
    // ============================================
    {
        type: 'welcome',
        channel: 'email',
        name: 'Welcome Email',
        subject: 'Welcome to {{storeName}}!',
        htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Welcome, {{firstName}}!</h1>
        <p style="color: #666; line-height: 1.6;">Thank you for joining {{storeName}}. We're excited to have you!</p>
        <p style="color: #666; line-height: 1.6;">Start exploring our amazing products and enjoy your shopping experience.</p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="{{loginUrl}}" style="display: inline-block; background: #000; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px;">Start Shopping</a>
        </div>
    </div>
</body>
</html>`,
        textContent: 'Welcome to {{storeName}}, {{firstName}}! Thank you for joining us. Start shopping at {{loginUrl}}',
        variables: ['firstName', 'storeName', 'loginUrl'],
    },
    {
        type: 'welcome',
        channel: 'sms',
        name: 'Welcome SMS',
        textContent: 'Welcome to {{storeName}}, {{firstName}}! Thank you for joining us.',
        variables: ['firstName', 'storeName'],
    },
    {
        type: 'welcome',
        channel: 'whatsapp',
        name: 'Welcome WhatsApp',
        textContent: 'Welcome to {{storeName}}, {{firstName}}! Thank you for joining us.',
        variables: ['firstName', 'storeName'],
    },

    // ============================================
    // Verify Email
    // ============================================
    {
        type: 'verify_email',
        channel: 'email',
        name: 'Email Verification',
        subject: 'Verify your email address',
        htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Verify Your Email</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">Please verify your email address to complete your registration.</p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="{{verifyUrl}}" style="display: inline-block; background: #000; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px;">Verify Email</a>
        </div>
        <p style="color: #999; font-size: 14px;">This link expires in 24 hours.</p>
    </div>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, verify your email at {{verifyUrl}}. This link expires in 24 hours.',
        variables: ['firstName', 'verifyUrl'],
    },
    {
        type: 'verify_email',
        channel: 'sms',
        name: 'Email Verification SMS',
        textContent: 'Hi {{firstName}}, please verify your email for {{storeName}} at: {{verifyUrl}}',
        variables: ['firstName', 'storeName', 'verifyUrl'],
    },
    {
        type: 'verify_email',
        channel: 'whatsapp',
        name: 'Email Verification WhatsApp',
        textContent: 'Hi {{firstName}}, please verify your email for {{storeName}} by clicking here: {{verifyUrl}}',
        variables: ['firstName', 'storeName', 'verifyUrl'],
    },

    // ============================================
    // Password Reset
    // ============================================
    {
        type: 'password_reset',
        channel: 'email',
        name: 'Password Reset',
        subject: 'Reset your password',
        htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Reset Your Password</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">We received a request to reset your password. Click below to create a new one:</p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="{{resetUrl}}" style="display: inline-block; background: #000; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px;">Reset Password</a>
        </div>
        <p style="color: #999; font-size: 14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, reset your password at {{resetUrl}}. This link expires in 1 hour.',
        variables: ['firstName', 'resetUrl'],
    },
    {
        type: 'password_reset',
        channel: 'sms',
        name: 'Password Reset SMS',
        textContent: 'Hi {{firstName}}, reset your password for {{storeName}} at: {{resetUrl}}',
        variables: ['firstName', 'storeName', 'resetUrl'],
    },
    {
        type: 'password_reset',
        channel: 'whatsapp',
        name: 'Password Reset WhatsApp',
        textContent: 'Hi {{firstName}}, you requested a password reset for {{storeName}}. Link: {{resetUrl}}',
        variables: ['firstName', 'storeName', 'resetUrl'],
    },

    // ============================================
    // Order Created
    // ============================================
    {
        type: 'order_created',
        channel: 'email',
        name: 'Order Confirmation',
        subject: 'Order #{{orderNumber}} Confirmed!',
        htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Thank You for Your Order!</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">Your order <strong>#{{orderNumber}}</strong> has been confirmed.</p>
        <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; color: #333;"><strong>Order Total:</strong> {{total}}</p>
            <p style="margin: 8px 0 0; color: #666;"><strong>Items:</strong> {{itemCount}}</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
            <a href="{{orderUrl}}" style="display: inline-block; background: #000; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px;">View Order</a>
        </div>
    </div>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, your order #{{orderNumber}} for {{total}} has been confirmed. View at {{orderUrl}}',
        variables: ['firstName', 'orderNumber', 'total', 'itemCount', 'orderUrl'],
    },
    {
        type: 'order_created',
        channel: 'sms',
        name: 'Order Confirmation SMS',
        textContent: 'Order #{{orderNumber}} confirmed! Total: {{total}}. Track at {{orderUrl}}',
        variables: ['orderNumber', 'total', 'orderUrl'],
    },
    {
        type: 'order_created',
        channel: 'whatsapp',
        name: 'Order Confirmation WhatsApp',
        textContent: 'Hi {{firstName}}, your order #{{orderNumber}} from {{storeName}} has been confirmed! Total: {{total}}.',
        variables: ['firstName', 'orderNumber', 'storeName', 'total'],
    },
    // ============================================
    // Order Pending
    // ============================================
    {
        type: 'order_pending',
        channel: 'email',
        name: 'Order Pending Email',
        subject: 'Update Regarding Your Order #{{orderNumber}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Order Status: Pending</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">Your order <strong>#{{orderNumber}}</strong> is currently pending. We will notify you once it moves to the next stage.</p>
        <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; color: #333;"><strong>Order Total:</strong> {{total}}</p>
            <p style="margin: 8px 0 0; color: #666;"><strong>Items:</strong> {{itemCount}}</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
            <a href="{{orderUrl}}" style="display: inline-block; background: #000; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px;">View Order Status</a>
        </div>
    </div>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, your order #{{orderNumber}} for {{total}} is currently pending. View status at {{orderUrl}}',
        variables: ['firstName', 'orderNumber', 'total', 'itemCount', 'orderUrl'],
    },
    {
        type: 'order_pending',
        channel: 'sms',
        name: 'Order Pending SMS',
        textContent: 'Order #{{orderNumber}} is pending. Total: {{total}}. View at {{orderUrl}}',
        variables: ['orderNumber', 'total', 'orderUrl'],
    },
    {
        type: 'order_pending',
        channel: 'whatsapp',
        name: 'Order Pending WhatsApp',
        textContent: 'Hi {{firstName}}, your order #{{orderNumber}} from {{storeName}} is currently pending.',
        variables: ['firstName', 'orderNumber', 'storeName'],
    },
    // ============================================
    // Order Processing
    // ============================================
    {
        type: 'order_processing',
        channel: 'email',
        name: 'Order Processing Email',
        subject: 'We are processing your order #{{orderNumber}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Your Order is Being Processed</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">Good news! We're now processing your order <strong>#{{orderNumber}}</strong> and getting it ready for shipment.</p>
        <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; color: #333;"><strong>Order Total:</strong> {{total}}</p>
            <p style="margin: 8px 0 0; color: #666;"><strong>Items:</strong> {{itemCount}}</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
            <a href="{{orderUrl}}" style="display: inline-block; background: #000; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px;">Check Details</a>
        </div>
    </div>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, we are now processing your order #{{orderNumber}}. View details at {{orderUrl}}',
        variables: ['firstName', 'orderNumber', 'total', 'itemCount', 'orderUrl'],
    },
    {
        type: 'order_processing',
        channel: 'sms',
        name: 'Order Processing SMS',
        textContent: 'Order #{{orderNumber}} is being processed. View at {{orderUrl}}',
        variables: ['orderNumber', 'orderUrl'],
    },
    {
        type: 'order_processing',
        channel: 'whatsapp',
        name: 'Order Processing WhatsApp',
        textContent: 'Hi {{firstName}}, we are now processing your order #{{orderNumber}} from {{storeName}}.',
        variables: ['firstName', 'orderNumber', 'storeName'],
    },
    // ============================================
    // Order Shipped
    // ============================================
    {
        type: 'order_shipped',
        channel: 'email',
        name: 'Order Shipped',
        subject: 'Your Order #{{orderNumber}} Has Shipped!',
        htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Your Order is On Its Way!</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">Great news! Your order <strong>#{{orderNumber}}</strong> has been shipped.</p>
        <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; color: #333;"><strong>Tracking Number:</strong> {{trackingNumber}}</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
            <a href="{{trackingUrl}}" style="display: inline-block; background: #000; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px;">Track Package</a>
        </div>
    </div>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, order #{{orderNumber}} shipped! Tracking: {{trackingNumber}}. Track at {{trackingUrl}}',
        variables: ['firstName', 'orderNumber', 'trackingNumber', 'trackingUrl'],
    },
    {
        type: 'order_shipped',
        channel: 'sms',
        name: 'Order Shipped SMS',
        textContent: 'Order #{{orderNumber}} shipped! Track: {{trackingUrl}}',
        variables: ['orderNumber', 'trackingUrl'],
    },
    {
        type: 'order_shipped',
        channel: 'whatsapp',
        name: 'Order Shipped WhatsApp',
        textContent: 'Hi {{firstName}}, your order #{{orderNumber}} from {{storeName}} has been shipped! Track here: {{trackingUrl}}',
        variables: ['firstName', 'orderNumber', 'storeName', 'trackingUrl'],
    },
    // ============================================
    // Order Delivered
    // ============================================
    {
        type: 'order_delivered',
        channel: 'email',
        name: 'Order Delivered',
        subject: 'Your Order #{{orderNumber}} Has Been Delivered!',
        htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Order Delivered!</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">Your order <strong>#{{orderNumber}}</strong> has been delivered. We hope you enjoy your purchase!</p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="{{reviewUrl}}" style="display: inline-block; background: #000; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px;">Leave a Review</a>
        </div>
    </div>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, your order #{{orderNumber}} has been delivered! Leave a review at {{reviewUrl}}',
        variables: ['firstName', 'orderNumber', 'reviewUrl'],
    },
    {
        type: 'order_delivered',
        channel: 'sms',
        name: 'Order Delivered SMS',
        textContent: 'Hi {{firstName}}, your order #{{orderNumber}} from {{storeName}} has been delivered! Review: {{reviewUrl}}',
        variables: ['firstName', 'orderNumber', 'storeName', 'reviewUrl'],
    },
    {
        type: 'order_delivered',
        channel: 'whatsapp',
        name: 'Order Delivered WhatsApp',
        textContent: 'Hi {{firstName}}, your order #{{orderNumber}} from {{storeName}} has been delivered! We hope you love it. Review: {{reviewUrl}}',
        variables: ['firstName', 'orderNumber', 'storeName', 'reviewUrl'],
    },

    // ============================================
    // Order Cancelled
    // ============================================
    {
        type: 'order_cancelled',
        channel: 'email',
        name: 'Order Cancelled',
        subject: 'Order #{{orderNumber}} Cancelled',
        htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Order Cancelled</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">Your order <strong>#{{orderNumber}}</strong> has been cancelled.</p>
        {{#if reason}}<p style="color: #666; line-height: 1.6;"><strong>Reason:</strong> {{reason}}</p>{{/if}}
        <p style="color: #666; line-height: 1.6;">If you have any questions, please contact our support team.</p>
    </div>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, your order #{{orderNumber}} has been cancelled. {{#if reason}}Reason: {{reason}}{{/if}}',
        variables: ['firstName', 'orderNumber', 'reason'],
    },
    {
        type: 'order_cancelled',
        channel: 'sms',
        name: 'Order Cancelled SMS',
        textContent: 'Order #{{orderNumber}} from {{storeName}} has been cancelled.',
        variables: ['orderNumber', 'storeName'],
    },
    {
        type: 'order_cancelled',
        channel: 'whatsapp',
        name: 'Order Cancelled WhatsApp',
        textContent: 'Hi {{firstName}}, we regret to inform you that your order #{{orderNumber}} from {{storeName}} has been cancelled.',
        variables: ['firstName', 'orderNumber', 'storeName'],
    },

    // ============================================
    // Order Refunded
    // ============================================
    {
        type: 'order_refunded',
        channel: 'email',
        name: 'Order Refunded',
        subject: 'Refund Processed for Order #{{orderNumber}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Refund Processed</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">A refund of <strong>{{amount}}</strong> has been processed for order <strong>#{{orderNumber}}</strong>.</p>
        <p style="color: #666; line-height: 1.6;">The refund should appear in your account within 5-10 business days.</p>
    </div>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, a refund of {{amount}} for order #{{orderNumber}} has been processed.',
        variables: ['firstName', 'orderNumber', 'amount'],
    },
    {
        type: 'order_refunded',
        channel: 'sms',
        name: 'Order Refunded SMS',
        textContent: 'Refund of {{amount}} for order #{{orderNumber}} from {{storeName}} has been processed.',
        variables: ['amount', 'orderNumber', 'storeName'],
    },
    {
        type: 'order_refunded',
        channel: 'whatsapp',
        name: 'Order Refunded WhatsApp',
        textContent: 'Hi {{firstName}}, a refund of {{amount}} for order #{{orderNumber}} from {{storeName}} has been processed.',
        variables: ['firstName', 'amount', 'orderNumber', 'storeName'],
    },

    // ============================================
    // Cart Abandoned
    // ============================================
    {
        type: 'cart_abandoned',
        channel: 'email',
        name: 'Abandoned Cart Reminder',
        subject: 'You left something behind!',
        htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Forgot Something?</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">You have {{itemCount}} item(s) waiting in your cart. Complete your purchase before they're gone!</p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="{{cartUrl}}" style="display: inline-block; background: #000; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px;">Complete Purchase</a>
        </div>
    </div>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, you have {{itemCount}} items in your cart! Complete your purchase at {{cartUrl}}',
        variables: ['firstName', 'itemCount', 'cartUrl'],
    },

    // ============================================
    // Review Request
    // ============================================
    {
        type: 'review_request',
        channel: 'email',
        name: 'Review Request',
        subject: 'How was your purchase?',
        htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Share Your Thoughts!</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">We hope you're enjoying <strong>{{productName}}</strong>. Would you mind leaving a review?</p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="{{reviewUrl}}" style="display: inline-block; background: #000; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px;">Write a Review</a>
        </div>
    </div>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, enjoying {{productName}}? Leave a review at {{reviewUrl}}',
        variables: ['firstName', 'productName', 'reviewUrl'],
    },

    // ============================================
    // Back in Stock
    // ============================================
    {
        type: 'back_in_stock',
        channel: 'email',
        name: 'Back in Stock Alert',
        subject: '{{productName}} is back in stock!',
        htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Good News!</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;"><strong>{{productName}}</strong> is back in stock! Grab it before it sells out again.</p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="{{productUrl}}" style="display: inline-block; background: #000; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px;">Shop Now</a>
        </div>
    </div>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, {{productName}} is back in stock! Shop now at {{productUrl}}',
        variables: ['firstName', 'productName', 'productUrl'],
    },
    // ============================================
    // Order Failed
    // ============================================
    {
        type: 'order_failed',
        channel: 'email',
        name: 'Order Failed Email',
        subject: 'Payment Failed: Order #{{orderNumber}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #d32f2f; margin-bottom: 24px;">Payment Failed</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">We were unable to process the payment for your order <strong>#{{orderNumber}}</strong>.</p>
        <div style="background: #fff5f5; border: 1px solid #feb2b2; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; color: #c53030;"><strong>Order Total:</strong> {{total}}</p>
        </div>
        <p style="color: #666; line-height: 1.6;">Please visit your order page to try the payment again or use a different payment method.</p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="{{orderUrl}}" style="display: inline-block; background: #000; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px;">Retry Payment</a>
        </div>
    </div>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, payment for order #{{orderNumber}} from {{storeName}} has failed. Total: {{total}}. Please try again: {{orderUrl}}',
        variables: ['firstName', 'orderNumber', 'total', 'orderUrl'],
    },
    {
        type: 'order_failed',
        channel: 'sms',
        name: 'Order Failed SMS',
        textContent: 'Payment failed for Order #{{orderNumber}}. Total: {{total}}. Please visit {{orderUrl}} to retry.',
        variables: ['orderNumber', 'total', 'orderUrl'],
    },
    {
        type: 'order_failed',
        channel: 'whatsapp',
        name: 'Order Failed WhatsApp',
        textContent: 'Hi {{firstName}}, payment for order #{{orderNumber}} from {{storeName}} has failed. Total: {{total}}. Retry here: {{orderUrl}}',
        variables: ['firstName', 'orderNumber', 'storeName', 'total', 'orderUrl'],
    },
    {
        type: 'order_created',
        channel: 'telegram',
        name: 'Order Confirmation Telegram',
        textContent: 'Hi {{firstName}}, your order #<b>{{orderNumber}}</b> from {{storeName}} has been confirmed! Total: {{total}}.',
        variables: ['firstName', 'orderNumber', 'storeName', 'total'],
    },
    {
        type: 'order_shipped',
        channel: 'telegram',
        name: 'Order Shipped Telegram',
        textContent: 'Hi {{firstName}}, your order #<b>{{orderNumber}}</b> from {{storeName}} has been shipped! Track here: {{trackingUrl}}',
        variables: ['firstName', 'orderNumber', 'storeName', 'trackingUrl'],
    },

    // ============================================
    // Admin Notifications
    // ============================================
    {
        type: 'admin_order_created',
        channel: 'email',
        name: 'Admin: New Order Notification',
        subject: '[New Order] #{{orderNumber}} - {{total}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
    <h2>New Order Received!</h2>
    <p><strong>Order Number:</strong> #{{orderNumber}}</p>
    <p><strong>Customer:</strong> {{customerName}}</p>
    <p><strong>Total:</strong> {{total}}</p>
    <p><strong>Status:</strong> {{status}}</p>
    <p><a href="{{storeUrl}}/admin/orders/{{orderId}}" style="padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">View Order in Admin</a></p>
</body>
</html>`,
        textContent: 'New Order Received! Order #{{orderNumber}}, Customer: {{customerName}}, Total: {{total}}, Status: {{status}}',
        variables: ['orderNumber', 'customerName', 'total', 'status', 'orderId'],
    },
    {
        type: 'admin_order_created',
        channel: 'telegram',
        name: 'Admin: New Order Telegram',
        textContent: '🚀 <b>New Order Received in {{storeName}}!</b>\n\n<b>Order:</b> #{{orderNumber}}\n<b>Customer:</b> {{customerName}}\n<b>Total:</b> {{total}}\n<b>Status:</b> {{status}}',
        variables: ['orderNumber', 'customerName', 'total', 'status', 'storeName'],
    },
    {
        type: 'admin_order_updated',
        channel: 'email',
        name: 'Admin: Order Status Updated',
        subject: '[Order Updated] #{{orderNumber}} is now {{status}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
    <h2>Order Status Updated</h2>
    <p><strong>Order Number:</strong> #{{orderNumber}}</p>
    <p><strong>Customer:</strong> {{customerName}}</p>
    <p><strong>New Status:</strong> {{status}}</p>
    <p><a href="{{storeUrl}}/admin/orders/{{orderId}}" style="padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">Update Details</a></p>
</body>
</html>`,
        textContent: 'Order #{{orderNumber}} status updated to {{status}}. Customer: {{customerName}}',
        variables: ['orderNumber', 'customerName', 'status', 'orderId'],
    },
    {
        type: 'admin_order_updated',
        channel: 'telegram',
        name: 'Admin: Order Updated Telegram',
        textContent: '📝 <b>Order Status Updated in {{storeName}}!</b>\n\n<b>Order:</b> #{{orderNumber}}\n<b>Customer:</b> {{customerName}}\n<b>New Status:</b> {{status}}',
        variables: ['orderNumber', 'customerName', 'status', 'storeName'],
    },
    {
        type: 'admin_customer_signup',
        channel: 'email',
        name: 'Admin: New Customer Signup',
        subject: '[New Customer] {{firstName}} has registered',
        htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
    <h2>New Customer Registration</h2>
    <p><strong>Name:</strong> {{firstName}}</p>
    <p><strong>Email:</strong> {{email}}</p>
    {{#if phone}}<p><strong>Phone:</strong> {{phone}}</p>{{/if}}
</body>
</html>`,
        textContent: 'New Customer Registered: {{firstName}} ({{email}}). Phone: {{phone}}',
        variables: ['firstName', 'email', 'phone', 'storeName'],
    },
    {
        type: 'admin_order_cancelled',
        channel: 'email',
        name: 'Admin: Order Cancelled',
        subject: '[Order Cancelled] #{{orderNumber}} - {{total}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
    <h2>Order Cancelled</h2>
    <p><strong>Order Number:</strong> #{{orderNumber}}</p>
    <p><strong>Customer:</strong> {{customerName}}</p>
    <p><strong>Total:</strong> {{total}}</p>
    <p><strong>Status:</strong> {{status}}</p>
    <p><a href="{{storeUrl}}/admin/orders/{{orderId}}" style="padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">Update Details</a></p>
</body>
</html>`,
        textContent: 'Order #{{orderNumber}} cancelled. Customer: {{customerName}}, Total: {{total}}, Status: {{status}}',
        variables: ['orderNumber', 'customerName', 'total', 'status', 'orderId', 'storeUrl', 'storeName'],
    },
    {
        type: 'admin_customer_signup',
        channel: 'telegram',
        name: 'Admin: New Customer Telegram',
        textContent: '👤 <b>New Customer Registered in {{storeName}}!</b>\n\n<b>Name:</b> {{firstName}}\n<b>Email:</b> {{email}}\n<b>Phone:</b> {{phone}}',
        variables: ['firstName', 'email', 'phone', 'storeName'],
    },
    {
        type: 'admin_order_cancelled',
        channel: 'telegram',
        name: 'Admin: Order Cancelled Telegram',
        textContent: '❌ <b>Order Cancelled in {{storeName}}!</b>\n\n<b>Order:</b> #{{orderNumber}}\n<b>Customer:</b> {{customerName}}\n<b>Total:</b> {{total}}',
        variables: ['orderNumber', 'customerName', 'total', 'storeName'],
    },
    {
        type: 'admin_return_requested',
        channel: 'telegram',
        name: 'Admin: Return Requested Telegram',
        textContent: '↩️ <b>Return Requested in {{storeName}}!</b>\n\n<b>Order:</b> #{{orderNumber}}\n<b>Customer:</b> {{customerName}}\n<b>Total:</b> {{total}}',
        variables: ['orderNumber', 'customerName', 'total', 'storeName'],
    }
];

/**
 * Get default template by type and channel
 */
export function getDefaultTemplateContent(type: string, channel: 'email' | 'sms' | 'whatsapp' | 'telegram'): DefaultTemplate | null {
    return DEFAULT_TEMPLATES.find(t => t.type === type && t.channel === channel) || null;
}

/**
 * Get all available template types
 */
export function getTemplateTypes() {
    return Object.entries(TEMPLATE_TYPES).map(([key, value]) => ({
        value: key,
        label: value.label,
        description: value.description,
        variables: value.variables,
    }));
}

/**
 * Get variables for a specific template type
 */
export function getTemplateVariables(type: string): string[] {
    const templateType = TEMPLATE_TYPES[type as TemplateType];
    return templateType ? [...templateType.variables] : [];
}
