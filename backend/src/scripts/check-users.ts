
import mongoose from 'mongoose';
import { config } from '../config';
import User from '../models/User';

async function checkUsers() {
    try {
        await mongoose.connect(config.database.mongoUri);
        console.log('✅ Connected to MongoDB');

        const count = await User.countDocuments();
        console.log(`Users count: ${count}`);

        const users = await User.find({});
        console.log('Users found:', JSON.stringify(users, null, 2));

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUsers();
