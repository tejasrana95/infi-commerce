import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import mongoose from 'mongoose';
import Geo from '../src/models/Geo';
import { connectDatabase } from '../src/config/database';

dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Dataset with:
 * country.iso2
 * country.states[]
 * state.name
 */
const DATA_URL =
    'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/refs/heads/master/json/countries%2Bstates%2Bcities.json';

/**
 * ✅ ONLY these countries will be seeded
 */
const ALLOWED_COUNTRY_CODES = ['IN', 'US', 'CA', 'AU'];

const seedGeo = async () => {
    try {
        console.log('Connecting to database...');
        await connectDatabase();

        console.log('Connected DB:', mongoose.connection.name);
        console.log('Collection:', Geo.collection.name);

        // Optional clean start
        await Geo.deleteMany({});
        console.log('Existing geo data cleared');

        console.log('Fetching geo data...');
        const response = await axios.get(DATA_URL);

        const countries =
            typeof response.data === 'string'
                ? JSON.parse(response.data)
                : response.data;

        if (!Array.isArray(countries)) {
            throw new Error('Invalid dataset format');
        }

        console.log('Total countries received:', countries.length);

        let countryCount = 0;
        let stateCount = 0;

        for (const country of countries) {
            const countryCode = country.iso2?.toUpperCase()?.trim();

            if (!country.name || !countryCode) continue;

            // ✅ ALLOWLIST CHECK
            if (!ALLOWED_COUNTRY_CODES.includes(countryCode)) continue;

            // ---------- COUNTRY ----------
            const countryDoc = await Geo.findOneAndUpdate(
                { type: 'country', code: countryCode },
                {
                    name: country.name,
                    type: 'country',
                    code: countryCode,
                    parentId: null,
                    isActive: true,
                    isShippingAvailable: true
                },
                { upsert: true, new: true }
            );

            countryCount++;

            // ---------- STATES ----------
            if (!Array.isArray(country.states)) continue;

            for (const state of country.states) {
                if (!state.name) continue;

                const stateExists = await Geo.exists({
                    type: 'state',
                    parentId: countryDoc._id,
                    name: state.name
                });

                if (stateExists) continue;

                await Geo.create({
                    name: state.name,
                    type: 'state',
                    code: null, // 🔒 Avoid duplicate ISO/state code collisions
                    parentId: countryDoc._id,
                    isActive: true,
                    isShippingAvailable: true
                });

                stateCount++;
            }
        }

        console.log('--- SEED COMPLETE ---');
        console.log('Countries added:', countryCount);
        console.log('States added:', stateCount);

        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
};

seedGeo();
