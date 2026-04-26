import mongoose from 'mongoose';
import { config } from './index';

const hasMongoCredentials = (mongoUri: string): boolean => {
    const match = mongoUri.match(/^mongodb(?:\+srv)?:\/\/([^@]+)@/i);

    if (!match) {
        return false;
    }

    const userInfo = match[1];
    const separatorIndex = userInfo.indexOf(':');

    if (separatorIndex <= 0) {
        return false;
    }

    return userInfo.slice(separatorIndex + 1).length > 0;
};

export const connectDatabase = async (): Promise<void> => {
    try {
        if (config.env === 'production' && !hasMongoCredentials(config.database.mongoUri)) {
            throw new Error('MONGODB_URI appears to be missing credentials. Include username/password and authSource if required by your MongoDB setup.');
        }

        await mongoose.connect(config.database.mongoUri, {
            maxPoolSize: 20,        // Increase from default 10
            minPoolSize: 5,         // Keep minimum connections ready
            serverSelectionTimeoutMS: 10000,  // Increased from 5s to 10s
            socketTimeoutMS: 60000,  // Increased from 45s to 60s
            connectTimeoutMS: 10000, // Add explicit connection timeout
            retryWrites: true,      // Enable retry writes for better reliability
            retryReads: true,       // Enable retry reads
        });
        console.log('===========================================');
        console.log('===========================================');

        console.log('MongoDB connection established successfully');

        console.log('===========================================');
        console.log('===========================================');

        mongoose.connection.on('error', (error) => {
            console.error('MongoDB connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
        });

    } catch (error) {
        console.error('Unable to connect to MongoDB:', error);
        process.exit(1);
    }
};

export default mongoose;
