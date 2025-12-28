
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const NotificationQueueSchema = new mongoose.Schema({
    channel: String,
    status: String,
    recipient: String,
    error: String,
    orderId: mongoose.Schema.Types.ObjectId,
    createdAt: Date
}, { collection: 'notificationqueues' });

const NotificationQueue = mongoose.model('NotificationQueue', NotificationQueueSchema);

const OrderSchema = new mongoose.Schema({
    orderNumber: String
}, { collection: 'orders' });

const Order = mongoose.model('Order', OrderSchema);

async function checkNotifications(orderNumber: string) {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const order = await Order.findOne({ orderNumber });
        if (!order) {
            console.log(`Order ${orderNumber} not found`);
            return;
        }

        console.log(`Checking notifications for Order: ${orderNumber} (${order._id})`);

        const notifications = await NotificationQueue.find({
            orderId: order._id
        }).sort({ createdAt: -1 });

        if (notifications.length === 0) {
            console.log('No notifications found for this order');
        } else {
            notifications.forEach(n => {
                const timestamp = n.createdAt instanceof Date ? n.createdAt.toISOString() : 'N/A';
                console.log(`[${timestamp}] Channel: ${n.channel}, Status: ${n.status}, Recipient: ${n.recipient}`);
                if (n.error) {
                    console.log(`   Error: ${n.error}`);
                }
            });
        }

        await mongoose.disconnect();
    } catch (error: any) {
        console.error('Error:', error);
    }
}

const orderNumber = process.argv[2] || 'ORD-202512-000032';
checkNotifications(orderNumber);
