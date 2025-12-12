import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inficommerce';

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');

        const db = mongoose.connection.db;
        const collection = db!.collection('geos');

        console.log('Dropping old indexes...');

        try {
            await collection.dropIndex('countryCode_1');
            console.log('✓ Dropped countryCode_1 index');
        } catch (err: any) {
            console.log('- countryCode_1 index not found (already dropped or never existed)');
        }

        try {
            await collection.dropIndex('isActive_1');
            console.log('✓ Dropped isActive_1 index');
        } catch (err: any) {
            console.log('- isActive_1 index not found');
        }

        try {
            await collection.dropIndex('isShippingAvailable_1');
            console.log('✓ Dropped isShippingAvailable_1 index');
        } catch (err: any) {
            console.log('- isShippingAvailable_1 index not found');
        }

        console.log('\nMigration completed successfully!');
        console.log('You can now restart your backend server.');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

migrate();
