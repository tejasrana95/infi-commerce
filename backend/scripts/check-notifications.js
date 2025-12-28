
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

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

async function checkNotifications(orderNumber) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const order = await Order.findOne({ orderNumber });
        if (!order) {
            console.log(`Order ${orderNumber} not found`);
        } else {
            console.log(`Checking notifications for Order: ${orderNumber} (${order._id})`);
            const notifications = await NotificationQueue.find({ orderId: order._id }).sort({ createdAt: -1 });
            if (notifications.length === 0) {
                console.log('No notifications found for this order ID');
            } else {
                notifications.forEach(n => {
                    console.log(`[${n.createdAt.toISOString()}] Channel: ${n.channel}, Status: ${n.status}, Recipient: ${n.recipient}`);
                    if (n.error) {
                        console.log(`   Error: ${n.error}`);
                    }
                });
            }
        }

        console.log('\nChecking notifications for recipient: +919530107998');
        const byRecipient = await NotificationQueue.find({
            recipient: { $regex: '9530107998' }
        }).sort({ createdAt: -1 }).limit(5);

        if (byRecipient.length === 0) {
            console.log('No notifications found for this recipient');
        } else {
            byRecipient.forEach(n => {
                console.log(`[${n.createdAt.toISOString()}] Channel: ${n.channel}, Status: ${n.status}, Recipient: ${n.recipient}, OrderId: ${n.orderId}`);
                if (n.error) {
                    console.log(`   Error: ${n.error}`);
                }
            });
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

const orderNumber = process.argv[2] || 'ORD-202512-000032';
checkNotifications(orderNumber);
