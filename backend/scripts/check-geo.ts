
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const checkGeo = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        const Geo = mongoose.connection.collection('geos');
        const count = await Geo.countDocuments();

        const countries = await Geo.countDocuments({ type: 'country' });

        if (countries > 0) {
            const firstCountry = await Geo.findOne({ type: 'country' });
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkGeo();
