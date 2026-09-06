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

        // Add column to products
        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS is_traditional BOOLEAN DEFAULT FALSE
        `);

        // Add column to caterings
        await client.query(`
            ALTER TABLE caterings 
            ADD COLUMN IF NOT EXISTS is_traditional BOOLEAN DEFAULT FALSE
        `);

        // Add column to catering_items
        await client.query(`
            ALTER TABLE catering_items 
            ADD COLUMN IF NOT EXISTS is_traditional BOOLEAN
        `);

        // Add column to quotes
        await client.query(`
            ALTER TABLE quotes 
            ADD COLUMN IF NOT EXISTS is_traditional BOOLEAN DEFAULT FALSE
        `);

        await client.query('COMMIT');
        console.log('Migration migrate_traditional_tag completed successfully');
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Error in migration migrate_traditional_tag:', err);
    } finally {
        await client.end();
        console.log('Database connection closed');
    }
};

migrate();
