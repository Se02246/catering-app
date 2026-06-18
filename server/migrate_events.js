import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function migrate() {
    try {
        console.log('Creating events table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                slug VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                date_text VARCHAR(100) NOT NULL,
                is_visible BOOLEAN DEFAULT TRUE,
                
                where_title VARCHAR(255) DEFAULT 'Quando e Dove saremo',
                where_image_url TEXT,
                where_link TEXT,
                where_description TEXT,
                
                products_title VARCHAR(255) DEFAULT 'I prodotti che porteremo',
                products_description TEXT,
                
                info_title VARCHAR(255) DEFAULT 'Altre informazioni',
                info_description TEXT,
                
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Creating event_products table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS event_products (
                id SERIAL PRIMARY KEY,
                event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                sort_order INTEGER DEFAULT 0
            );
        `);

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
