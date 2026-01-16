import mongoose from 'mongoose';
import { config } from './index';

export const connectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(config.database.mongoUri, {
            maxPoolSize: 20,        // Increase from default 10
            minPoolSize: 5,         // Keep minimum connections ready
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ MongoDB connection established successfully');

        mongoose.connection.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
        });

    } catch (error) {
        console.error('❌ Unable to connect to MongoDB:', error);
        process.exit(1);
    }
};

export default mongoose;
