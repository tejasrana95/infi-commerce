import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Store from '../models/Store';

dotenv.config();

const defaultPosPaymentSettings = {
    enabledMethods: {
        cash: true,
        card: true,
        qr: false
    },
    cashSettings: {
        enableRoundOff: false,
        roundOffTo: 'nearest10',
        requireExactAmount: false
    },
    cardSettings: {
        terminalType: 'manual'
    },
    qrSettings: {
        mode: 'custom',
        verification: {
            mode: 'manual',
            timeout: 600
        },
        displaySettings: {
            showAmount: true,
            showMerchantName: true,
            showPaymentId: true,
            qrLabel: 'Scan to Pay'
        }
    }
};

async function migrate() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        console.log('Connecting to database...');
        await mongoose.connect(mongoUri);
        console.log('Connected to database');

        // Find stores that don't have posPaymentSettings or have incomplete settings
        // We simply checking if posPaymentSettings exists
        const stores = await Store.find({
            $or: [
                { posPaymentSettings: { $exists: false } },
                { posPaymentSettings: null }
            ]
        });

        console.log(`Found ${stores.length} stores to migrate.`);

        let updatedCount = 0;
        let errorCount = 0;

        for (const store of stores) {
            try {
                console.log(`Migrating store: ${store.name} (${store._id})`);

                // We use updateOne to avoid fetching everything and potentially overwriting concurrent changes to other fields
                // although finding them first means we might be stale, but for a migration script run in maintenance window it's fine.
                // Or we can just set it if it's strictly missing.

                await Store.updateOne(
                    { _id: store._id },
                    { $set: { posPaymentSettings: defaultPosPaymentSettings } }
                );

                updatedCount++;
            } catch (err) {
                console.error(`Failed to update store ${store._id}:`, err);
                errorCount++;
            }
        }

        console.log(`Migration completed.`);
        console.log(`Successfully updated: ${updatedCount}`);
        console.log(`Errors: ${errorCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
