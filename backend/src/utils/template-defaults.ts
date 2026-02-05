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
        variables: ['firstName', 'orderNumber', 'total', 'itemCount', 'order_items_table', 'orderUrl', 'storeName'],
    },
    order_pending: {
        label: 'Order Pending',
        description: 'Sent when order is marked as pending',
        variables: ['firstName', 'orderNumber', 'total', 'itemCount', 'order_items_table', 'orderUrl', 'storeName'],
    },
    order_processing: {
        label: 'Order Processing',
        description: 'Sent when order is being processed',
        variables: ['firstName', 'orderNumber', 'total', 'itemCount', 'order_items_table', 'orderUrl', 'storeName'],
    },
    order_shipped: {
        label: 'Order Shipped',
        description: 'Sent when order is shipped',
        variables: ['firstName', 'orderNumber', 'trackingNumber', 'trackingUrl', 'order_items_table', 'storeName'],
    },
    order_delivered: {
        label: 'Order Delivered',
        description: 'Sent when order is delivered',
        variables: ['firstName', 'orderNumber', 'reviewUrl', 'order_items_table', 'storeName'],
    },
    order_cancelled: {
        label: 'Order Cancelled',
        description: 'Sent when order is cancelled',
        variables: ['firstName', 'orderNumber', 'reason', 'order_items_table', 'storeName'],
    },
    order_refunded: {
        label: 'Order Refunded',
        description: 'Sent when refund is processed',
        variables: ['firstName', 'orderNumber', 'amount', 'storeName'],
    },
    order_failed: {
        label: 'Order Failed',
        description: 'Sent when payment fails',
        variables: ['firstName', 'orderNumber', 'total', 'order_items_table', 'orderUrl', 'storeName'],
    },
    admin_order_created: {
        label: 'Admin: New Order',
        description: 'Sent to admin when a new order is placed',
        variables: ['orderNumber', 'customerName', 'total', 'status', 'orderId', 'order_items_table', 'storeName'],
    },
    admin_order_updated: {
        label: 'Admin: Order Updated',
        description: 'Sent to admin when an order status is updated',
        variables: ['orderNumber', 'customerName', 'total', 'status', 'orderId', 'order_items_table', 'storeName'],
    },
    admin_return_requested: {
        label: 'Admin: Return Requested',
        description: 'Sent to admin when a return is requested',
        variables: ['orderNumber', 'customerName', 'total', 'status', 'orderId', 'order_items_table', 'storeName'],
    },
    admin_order_cancelled: {
        label: 'Admin: New Order Cancelled',
        description: 'Sent to admin when an order is cancelled',
        variables: ['orderNumber', 'customerName', 'total', 'status', 'orderId', 'order_items_table', 'storeName'],
    },
    admin_customer_signup: {
        label: 'Admin: New Customer',
        description: 'Sent to admin when a new customer registers',
        variables: ['email', 'firstName', 'phone', 'storeName'],
    },
    return_created: {
        label: 'Return Requested',
        description: 'Sent to customer when they request a return',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'returnItems', 'status', 'reason', 'type', 'total', 'storeName'],
    },
    return_approved: {
        label: 'Return Approved',
        description: 'Sent to customer when return is approved',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'status', 'returnItems', 'amount', 'storeName'],
    },
    return_rejected: {
        label: 'Return Rejected',
        description: 'Sent to customer when return is rejected',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'status', 'adminNote', 'returnItems', 'amount', 'storeName'],
    },
    return_pickup_scheduled: {
        label: 'Pickup Scheduled',
        description: 'Sent to customer when pickup is scheduled for return',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'pickupDate', 'pickupSlot', 'pickupMethod', 'trackingNumber', 'trackingUrl', 'returnItems', 'amount', 'storeName'],
    },
    return_received: {
        label: 'Return Received',
        description: 'Sent to customer when returned items are received',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'status', 'returnItems', 'amount', 'storeName'],
    },
    return_refunded: {
        label: 'Return Refunded',
        description: 'Sent to customer when refund is processed for return',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'amount', 'returnItems', 'storeName'],
    },
    return_partially_refunded: {
        label: 'Return Partially Refunded',
        description: 'Sent to customer when partial refund is processed',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'amount', 'returnItems', 'storeName'],
    },
    return_exchange_shipped: {
        label: 'Exchange Shipped',
        description: 'Sent when exchange items are shipped',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'trackingNumber', 'trackingUrl', 'returnItems', 'amount', 'storeName'],
    },
    return_completed: {
        label: 'Return Completed',
        description: 'Sent when return process is closed',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'returnItems', 'amount', 'storeName'],
    },
    return_cancelled: {
        label: 'Return Cancelled',
        description: 'Sent when return request is cancelled',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'adminNote', 'returnItems', 'storeName'],
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
{{{gmailMarkup}}}
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Thank You for Your Order!</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">Your order <strong>#{{orderNumber}}</strong> has been received.</p>
        
        {{{order_items_table}}}

        <div style="text-align: center; margin: 32px 0;">
            <a href="{{orderUrl}}" style="display: inline-block; background: #000; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px;">View Order</a>
        </div>
    </div>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, your order #{{orderNumber}} for {{total}} has been received. View at {{orderUrl}}',
        variables: ['firstName', 'orderNumber', 'total', 'itemCount', 'orderUrl'],
    },
    {
        type: 'order_created',
        channel: 'sms',
        name: 'Order Confirmation SMS',
        textContent: 'Order #{{orderNumber}} received! Total: {{total}}. Track at {{orderUrl}}',
        variables: ['orderNumber', 'total', 'orderUrl'],
    },
    {
        type: 'order_created',
        channel: 'whatsapp',
        name: 'Order Confirmation WhatsApp',
        textContent: 'Hi {{firstName}}, your order #{{orderNumber}} from {{storeName}} has been received! Total: {{total}}.',
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
{{{gmailMarkup}}}
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Order Status: Pending</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">Your order <strong>#{{orderNumber}}</strong> is currently pending. We will notify you once it moves to the next stage.</p>
        
        {{{order_items_table}}}

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
{{{gmailMarkup}}}
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Your Order is Being Processed</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">Good news! We're now processing your order <strong>#{{orderNumber}}</strong> and getting it ready for shipment.</p>
        
        {{{order_items_table}}}

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
{{{gmailMarkup}}}
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Your Order is On Its Way!</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">Great news! Your order <strong>#{{orderNumber}}</strong> has been shipped.</p>
        
        {{{order_items_table}}}

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
{{{gmailMarkup}}}
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
{{{gmailMarkup}}}
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Order Cancelled</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">Your order <strong>#{{orderNumber}}</strong> has been cancelled.</p>
        {{#if reason}}<p style="color: #666; line-height: 1.6;"><strong>Reason:</strong> {{reason}}</p>{{/if}}
        
        {{{order_items_table}}}

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
{{{gmailMarkup}}}
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
{{{gmailMarkup}}}
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #d32f2f; margin-bottom: 24px;">Payment Failed</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">We were unable to process the payment for your order <strong>#{{orderNumber}}</strong>.</p>
        
        {{{order_items_table}}}

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
        textContent: 'Hi {{firstName}}, your order #<b>{{orderNumber}}</b> from {{storeName}} has been received! Total: {{total}}.',
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
    // Return Notifications
    // ============================================
    {
        type: 'return_created',
        channel: 'email',
        name: 'Return Request Confirmation',
        subject: 'Return Request Received - {{requestNumber}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
    <h2>Return Request Received</h2>
    <p>Hi {{firstName}},</p>
    <p>We have received your return request for Order <strong>#{{orderNumber}}</strong>.</p>
    <p><strong>Request Number:</strong> {{requestNumber}}</p>
    <p><strong>Status:</strong> {{status}}</p>
    
    {{{returnItems}}}

    <p>We will review your request and get back to you shortly.</p>
    <p>Best regards,<br>{{storeName}}</p>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, we received your return request {{requestNumber}} for order {{orderNumber}}. Status: {{status}}',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'returnItems', 'status', 'storeName'],
    },
    {
        type: 'return_approved',
        channel: 'email',
        name: 'Return Approved',
        subject: 'Return Request Approved - {{requestNumber}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
    <h2>Return Request Approved</h2>
    <p>Hi {{firstName}},</p>
    <p>Good news! Your return request <strong>{{requestNumber}}</strong> for Order #{{orderNumber}} has been approved.</p>
    <p>Please follow the instructions provided to ship your items back to us.</p>
    <p>Best regards,<br>{{storeName}}</p>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, your return request {{requestNumber}} has been submitted. Please ship items back.',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'storeName'],
    },
    {
        type: 'return_rejected',
        channel: 'email',
        name: 'Return Rejected',
        subject: 'Update on Return Request - {{requestNumber}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
    <h2>Return Request Update</h2>
    <p>Hi {{firstName}},</p>
    <p>Regarding your return request <strong>{{requestNumber}}</strong> for Order #{{orderNumber}}.</p>
    <p>Unfortunately, we cannot approve your return request at this time.</p>
    
    {{#if adminNote}}
    <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #e53e3e; margin: 15px 0;">
        <strong>Reason:</strong> {{adminNote}}
    </div>
    {{/if}}

    <p>If you have questions, please reply to this email.</p>
    <p>Best regards,<br>{{storeName}}</p>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, your return request {{requestNumber}} has been rejected. {{#if adminNote}}Reason: {{adminNote}}{{/if}}',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'adminNote', 'storeName'],
    },
    // ============================================
    // Return Pickup Scheduled
    // ============================================
    {
        type: 'return_pickup_scheduled',
        channel: 'email',
        name: 'Pickup Scheduled',
        subject: 'Pickup Scheduled for Return - {{requestNumber}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
    <h2>Pickup Scheduled</h2>
    <p>Hi {{firstName}},</p>
    <p>Your return pickup for request <strong>{{requestNumber}}</strong> (Order #{{orderNumber}}) has been scheduled.</p>
    {{#if pickupDate}}<p><strong>Date:</strong> {{pickupDate}}</p>{{/if}}
    {{#if pickupSlot}}<p><strong>Time Slot:</strong> {{pickupSlot}}</p>{{/if}}
    {{#if pickupMethod}}<p><strong>Method:</strong> {{pickupMethod}}</p>{{/if}}
    <p>Please ensure the items are packed and ready for pickup.</p>
    <p>Best regards,<br>{{storeName}}</p>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, pickup for return {{requestNumber}} (Order {{orderNumber}}) is scheduled{{#if pickupDate}} for {{pickupDate}}{{/if}}{{#if pickupSlot}} {{pickupSlot}}{{/if}}.',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'pickupDate', 'pickupSlot', 'pickupMethod', 'storeName'],
    },
    {
        type: 'return_pickup_scheduled',
        channel: 'sms',
        name: 'Pickup Scheduled SMS',
        textContent: 'Pickup for return {{requestNumber}} scheduled{{#if pickupDate}} for {{pickupDate}}{{/if}}. Please keep items ready.',
        variables: ['requestNumber', 'pickupDate', 'storeName'],
    },
    {
        type: 'return_pickup_scheduled',
        channel: 'whatsapp',
        name: 'Pickup Scheduled WhatsApp',
        textContent: 'Hi {{firstName}}, pickup for your return {{requestNumber}} from {{storeName}} is scheduled{{#if pickupDate}} for {{pickupDate}}{{/if}}{{#if pickupSlot}} {{pickupSlot}}{{/if}}.',
        variables: ['firstName', 'requestNumber', 'storeName', 'pickupDate', 'pickupSlot'],
    },
    {
        type: 'return_pickup_scheduled',
        channel: 'telegram',
        name: 'Pickup Scheduled Telegram',
        textContent: '📦 <b>Pickup Scheduled</b>\n\nHi {{firstName}}, pickup for return <b>{{requestNumber}}</b> is scheduled{{#if pickupDate}} for {{pickupDate}}{{/if}}{{#if pickupSlot}} {{pickupSlot}}{{/if}}.',
        variables: ['firstName', 'requestNumber', 'pickupDate', 'pickupSlot', 'storeName'],
    },
    {
        type: 'return_refunded',
        channel: 'email',
        name: 'Return Refunded',
        subject: 'Refund Processed - {{requestNumber}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
    <h2>Refund Processed</h2>
    <p>Hi {{firstName}},</p>
    <p>We have processed a refund regarding return request <strong>{{requestNumber}}</strong> for Order #{{orderNumber}}.</p>
    <p>The amount should reflect in your account shortly.</p>
    <p>Best regards,<br>{{storeName}}</p>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, refund for request {{requestNumber}} (Order {{orderNumber}}) has been processed.',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'storeName'],
    },
    {
        type: 'return_refunded',
        channel: 'sms',
        name: 'Return Refunded SMS',
        textContent: 'Refund for return request {{requestNumber}} has been processed. It will reflect in your account shortly.',
        variables: ['requestNumber', 'storeName'],
    },
    {
        type: 'return_refunded',
        channel: 'whatsapp',
        name: 'Return Refunded WhatsApp',
        textContent: 'Hi {{firstName}}, refund for return request {{requestNumber}} from {{storeName}} has been processed. Amount: {{amount}}',
        variables: ['firstName', 'requestNumber', 'amount', 'storeName'],
    },
    {
        type: 'return_refunded',
        channel: 'telegram',
        name: 'Return Refunded Telegram',
        textContent: '<b>Refund Processed</b>\n\nHi {{firstName}}, refund for return request <b>{{requestNumber}}</b> has been processed. Amount: {{amount}}',
        variables: ['firstName', 'requestNumber', 'amount', 'storeName'],
    },
    {
        type: 'return_received',
        channel: 'email',
        name: 'Return Received',
        subject: 'We Received Your Return - {{requestNumber}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
    <h2>Return Received</h2>
    <p>Hi {{firstName}},</p>
    <p>We have received your returned items for request <strong>{{requestNumber}}</strong> (Order #{{orderNumber}}).</p>
    <p>We will inspect and process your refund shortly.</p>
    <p>Best regards,<br>{{storeName}}</p>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, we have received your return for request {{requestNumber}} (Order {{orderNumber}}).',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'status', 'storeName'],
    },
    {
        type: 'return_received',
        channel: 'sms',
        name: 'Return Received SMS',
        textContent: 'Hi {{firstName}}, we received your return for request {{requestNumber}}. We will process it shortly.',
        variables: ['firstName', 'requestNumber', 'storeName'],
    },
    {
        type: 'return_received',
        channel: 'whatsapp',
        name: 'Return Received WhatsApp',
        textContent: 'Hi {{firstName}}, we received your return for request {{requestNumber}} from {{storeName}}. Thank you!',
        variables: ['firstName', 'requestNumber', 'storeName'],
    },
    {
        type: 'return_received',
        channel: 'telegram',
        name: 'Return Received Telegram',
        textContent: '📦 <b>Return Received</b>\n\nHi {{firstName}}, we have received your return for request <b>{{requestNumber}}</b>. We will process it shortly.',
        variables: ['firstName', 'requestNumber', 'storeName'],
    },
    {
        type: 'return_partially_refunded',
        channel: 'email',
        name: 'Return Partially Refunded',
        subject: 'Partial Refund Processed - {{requestNumber}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
    <h2>Partial Refund Processed</h2>
    <p>Hi {{firstName}},</p>
    <p>We have processed a partial refund of <strong>{{amount}}</strong> for return request <strong>{{requestNumber}}</strong> (Order #{{orderNumber}}).</p>
    <p>The amount should reflect in your account within 5-10 business days.</p>
    <p>Best regards,<br>{{storeName}}</p>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, a partial refund of {{amount}} for request {{requestNumber}} (Order {{orderNumber}}) has been processed.',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'amount', 'storeName'],
    },
    {
        type: 'return_partially_refunded',
        channel: 'sms',
        name: 'Return Partially Refunded SMS',
        textContent: 'Partial refund of {{amount}} for request {{requestNumber}} has been processed.',
        variables: ['amount', 'requestNumber', 'storeName'],
    },
    {
        type: 'return_partially_refunded',
        channel: 'whatsapp',
        name: 'Return Partially Refunded WhatsApp',
        textContent: 'Hi {{firstName}}, a partial refund of {{amount}} for request {{requestNumber}} from {{storeName}} has been processed.',
        variables: ['firstName', 'amount', 'requestNumber', 'storeName'],
    },
    {
        type: 'return_exchange_shipped',
        channel: 'email',
        name: 'Exchange Shipped',
        subject: 'Your Exchange Items Have Shipped - {{requestNumber}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
    <h2>Exchange Shipped</h2>
    <p>Hi {{firstName}},</p>
    <p>Your exchange items for return request <strong>{{requestNumber}}</strong> (Order #{{orderNumber}}) have been shipped!</p>
    <p><strong>Tracking Number:</strong> {{trackingNumber}}</p>
    <p><a href="{{trackingUrl}}" style="padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px; display: inline-block;">Track Package</a></p>
    <p>Best regards,<br>{{storeName}}</p>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, your exchange items for request {{requestNumber}} have shipped! Tracking: {{trackingNumber}}. Track: {{trackingUrl}}',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'trackingNumber', 'trackingUrl', 'storeName'],
    },
    {
        type: 'return_exchange_shipped',
        channel: 'sms',
        name: 'Exchange Shipped SMS',
        textContent: 'Your exchange items for request {{requestNumber}} have shipped! Track: {{trackingUrl}}',
        variables: ['requestNumber', 'trackingUrl'],
    },
    {
        type: 'return_exchange_shipped',
        channel: 'whatsapp',
        name: 'Exchange Shipped WhatsApp',
        textContent: 'Hi {{firstName}}, your exchange items for request {{requestNumber}} from {{storeName}} have shipped! Track: {{trackingUrl}}',
        variables: ['firstName', 'requestNumber', 'storeName', 'trackingUrl'],
    },
    {
        type: 'return_exchange_shipped',
        channel: 'telegram',
        name: 'Exchange Shipped Telegram',
        textContent: '📦 <b>Exchange Shipped</b>\n\nHi {{firstName}}, your exchange items for request <b>{{requestNumber}}</b> have shipped! Track: {{trackingUrl}}',
        variables: ['firstName', 'requestNumber', 'trackingUrl', 'storeName'],
    },
    {
        type: 'return_completed',
        channel: 'email',
        name: 'Return Completed',
        subject: 'Return Process Closed - {{requestNumber}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
    <h2>Return Process Completed</h2>
    <p>Hi {{firstName}},</p>
    <p>Your return request <strong>{{requestNumber}}</strong> for Order #{{orderNumber}} has been completed.</p>
    <p>Thank you for your patience throughout this process.</p>
    <p>Best regards,<br>{{storeName}}</p>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, your return request {{requestNumber}} for order {{orderNumber}} has been completed.',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'storeName'],
    },
    {
        type: 'return_completed',
        channel: 'sms',
        name: 'Return Completed SMS',
        textContent: 'Your return request {{requestNumber}} has been completed. Thank you!',
        variables: ['requestNumber', 'storeName'],
    },
    {
        type: 'return_completed',
        channel: 'whatsapp',
        name: 'Return Completed WhatsApp',
        textContent: 'Hi {{firstName}}, your return request {{requestNumber}} from {{storeName}} has been completed. Thank you!',
        variables: ['firstName', 'requestNumber', 'storeName'],
    },
    {
        type: 'return_completed',
        channel: 'telegram',
        name: 'Return Completed Telegram',
        textContent: '✅ <b>Return Completed</b>\n\nHi {{firstName}}, your return request <b>{{requestNumber}}</b> has been completed. Thank you for your patience!',
        variables: ['firstName', 'requestNumber', 'storeName'],
    },
    // ============================================
    // Return Cancelled
    // ============================================
    {
        type: 'return_cancelled',
        channel: 'email',
        name: 'Return Cancelled',
        subject: 'Return Request Cancelled - {{requestNumber}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
    <h2>Return Request Cancelled</h2>
    <p>Hi {{firstName}},</p>
    <p>Your return request <strong>{{requestNumber}}</strong> for Order #{{orderNumber}} has been cancelled.</p>
    
    {{#if adminNote}}
    <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #666; margin: 15px 0;">
        <strong>Note:</strong> {{adminNote}}
    </div>
    {{/if}}

    <p>If you have questions, please contact our support team.</p>
    <p>Best regards,<br>{{storeName}}</p>
</body>
</html>`,
        textContent: 'Hi {{firstName}}, your return request {{requestNumber}} for order {{orderNumber}} has been cancelled.{{#if adminNote}} Note: {{adminNote}}{{/if}}',
        variables: ['firstName', 'requestNumber', 'orderNumber', 'adminNote', 'storeName'],
    },
    {
        type: 'return_cancelled',
        channel: 'sms',
        name: 'Return Cancelled SMS',
        textContent: 'Your return request {{requestNumber}} has been cancelled. Contact support for details.',
        variables: ['requestNumber', 'storeName'],
    },
    {
        type: 'return_cancelled',
        channel: 'whatsapp',
        name: 'Return Cancelled WhatsApp',
        textContent: 'Hi {{firstName}}, your return request {{requestNumber}} from {{storeName}} has been cancelled.{{#if adminNote}} Note: {{adminNote}}{{/if}}',
        variables: ['firstName', 'requestNumber', 'adminNote', 'storeName'],
    },
    {
        type: 'return_cancelled',
        channel: 'telegram',
        name: 'Return Cancelled Telegram',
        textContent: '❌ <b>Return Cancelled</b>\n\nHi {{firstName}}, your return request <b>{{requestNumber}}</b> has been cancelled.{{#if adminNote}}\n\nNote: {{adminNote}}{{/if}}',
        variables: ['firstName', 'requestNumber', 'adminNote', 'storeName'],
    },
    {
        type: 'admin_return_requested',
        channel: 'email',
        name: 'Admin: Return Requested',
        subject: '[New Return] {{requestNumber}} from {{customerName}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
    <h2>New Return Request</h2>
    <p><strong>Request:</strong> {{requestNumber}}</p>
    <p><strong>Order:</strong> #{{orderNumber}}</p>
    <p><strong>Customer:</strong> {{customerName}}</p>
    <p><strong>Type:</strong> {{type}}</p>
    <p><strong>Items:</strong></p>
    {{{items_table}}}
    
    <p><a href="{{storeUrl}}/admin/returns/{{requestNumber}}" style="padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">View Return</a></p>
</body>
</html>`,
        textContent: 'New Return Request {{requestNumber}} from {{customerName}}. Order #{{orderNumber}}.',
        variables: ['requestNumber', 'orderNumber', 'customerName', 'type', 'items_table', 'storeName'],
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
    <p><strong>Status:</strong> {{status}}</p>
    
    {{{order_items_table}}}

    <p><a href="{{storeUrl}}/admin/orders/{{orderId}}" style="padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">View Order in Admin</a></p>
</body>
</html>`,
        textContent: 'New Order Received! Order #{{orderNumber}}, Customer: {{customerName}}, Total: {{total}}, Status: {{status}}',
        variables: ['orderNumber', 'customerName', 'total', 'status', 'orderId', 'order_items_table'],
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

    {{{order_items_table}}}

    <p><a href="{{storeUrl}}/admin/orders/{{orderId}}" style="padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">Update Details</a></p>
</body>
</html>`,
        textContent: 'Order #{{orderNumber}} status updated to {{status}}. Customer: {{customerName}}',
        variables: ['orderNumber', 'customerName', 'status', 'orderId', 'order_items_table'],
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
    <p><strong>Status:</strong> {{status}}</p>

    {{{order_items_table}}}

    <p><a href="{{storeUrl}}/admin/orders/{{orderId}}" style="padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">Update Details</a></p>
</body>
</html>`,
        textContent: 'Order #{{orderNumber}} cancelled. Customer: {{customerName}}, Total: {{total}}, Status: {{status}}',
        variables: ['orderNumber', 'customerName', 'total', 'status', 'orderId', 'storeUrl', 'storeName', 'order_items_table'],
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
