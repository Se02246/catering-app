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
            ADD COLUMN IF NOT EXISTS is_savory BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS is_sweet BOOLEAN DEFAULT FALSE
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully: is_savory and is_sweet added to products table.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
};

migrate();
