import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const migrate = async () => {
    try {
        await client.connect();
        console.log('Connected to database');

        await client.query('BEGIN');

        // Add columns to products
        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS is_vegetarian BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS is_vegan BOOLEAN DEFAULT FALSE
        `);

        // Add columns to caterings
        await client.query(`
            ALTER TABLE caterings 
            ADD COLUMN IF NOT EXISTS is_vegetarian BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS is_vegan BOOLEAN DEFAULT FALSE
        `);

        // Add columns to catering_items
        await client.query(`
            ALTER TABLE catering_items 
            ADD COLUMN IF NOT EXISTS is_vegetarian BOOLEAN,
            ADD COLUMN IF NOT EXISTS is_vegan BOOLEAN
        `);

        // Add columns to quotes
        await client.query(`
            ALTER TABLE quotes 
            ADD COLUMN IF NOT EXISTS is_vegetarian BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS is_vegan BOOLEAN DEFAULT FALSE
        `);

        await client.query('COMMIT');
        console.log('Migration migrate_dietary_veg completed successfully');
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Error in migration migrate_dietary_veg:', err);
    } finally {
        await client.end();
    }
};

migrate();
