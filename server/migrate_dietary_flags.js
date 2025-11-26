import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

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

        // Add columns to products table
        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS is_gluten_free BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS is_lactose_free BOOLEAN DEFAULT FALSE;
        `);
        console.log('Updated products table');

        // Add columns to caterings table
        await client.query(`
            ALTER TABLE caterings 
            ADD COLUMN IF NOT EXISTS is_gluten_free BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS is_lactose_free BOOLEAN DEFAULT FALSE;
        `);
        console.log('Updated caterings table');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
};

migrate();
