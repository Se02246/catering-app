import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const migrate = async () => {
    try {
        // Add images column to products
        await pool.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
        `);

        // Migrate existing image_url to images array for products
        await pool.query(`
            UPDATE products 
            SET images = ARRAY[image_url] 
            WHERE image_url IS NOT NULL AND images = '{}';
        `);

        // Add images column to caterings
        await pool.query(`
            ALTER TABLE caterings 
            ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
        `);

        // Migrate existing image_url to images array for caterings
        await pool.query(`
            UPDATE caterings 
            SET images = ARRAY[image_url] 
            WHERE image_url IS NOT NULL AND images = '{}';
        `);

        console.log('Migration completed successfully');
    } catch (err) {
        console.error('Migration failed', err);
    } finally {
        await pool.end();
    }
};

migrate();
