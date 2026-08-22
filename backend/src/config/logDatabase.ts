import mongoose, { Connection } from 'mongoose';

let logDbConnection: Connection | null = null;

export const isLogDbConfigured = (): boolean => {
    return Boolean(process.env.LOG_MONGODB_URI && process.env.LOG_MONGODB_URI.trim() !== '');
};

export const connectLogDatabase = async (): Promise<Connection | null> => {
    if (!isLogDbConfigured()) {
        console.warn('LOG_MONGODB_URI is not configured. Dedicated Activity & API Logging system is disabled.');
        return null;
    }

    try {
        const logUri = process.env.LOG_MONGODB_URI!;
        
        logDbConnection = mongoose.createConnection(logUri, {
            autoIndex: true,
            maxPoolSize: 20,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        logDbConnection.on('connected', () => {
            console.log('Successfully connected to dedicated Log MongoDB Cluster');
        });

        logDbConnection.on('error', (err) => {
            console.error('Dedicated Log MongoDB Connection Error:', err);
        });

        logDbConnection.on('disconnected', () => {
            console.warn('Dedicated Log MongoDB Disconnected');
        });

        return logDbConnection;
    } catch (error) {
        console.error('Failed to initialize dedicated Log MongoDB Connection:', error);
        return null;
    }
};

export const getLogDbConnection = (): Connection => {
    if (!logDbConnection) {
        if (!isLogDbConfigured()) {
            throw new Error('Log database connection requested but LOG_MONGODB_URI is not configured.');
        }
        logDbConnection = mongoose.createConnection(process.env.LOG_MONGODB_URI!);
    }
    return logDbConnection;
};
