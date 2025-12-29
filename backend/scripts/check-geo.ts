
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const checkGeo = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        const Geo = mongoose.connection.collection('geos');
        const count = await Geo.countDocuments();
        console.log(`Total Geo documents: ${count}`);

        const countries = await Geo.countDocuments({ type: 'country' });
        console.log(`Total Countries: ${countries}`);

        if (countries > 0) {
            const firstCountry = await Geo.findOne({ type: 'country' });
            console.log('First country sample:', JSON.stringify(firstCountry, null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkGeo();
