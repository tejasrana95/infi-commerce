import mongoose from 'mongoose';
import { config } from './index';

export const connectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(config.database.mongoUri);
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
