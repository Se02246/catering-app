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

async function migrate() {
    console.log('🚗 Starting migration: Creating garage_vehicles table...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS garage_vehicles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                consumption_km_l DECIMAL(5, 2) NOT NULL DEFAULT 16.0,
                image_url TEXT,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Check if there are any vehicles
        const check = await client.query('SELECT COUNT(*) FROM garage_vehicles');
        const count = parseInt(check.rows[0].count);

        if (count === 0) {
            console.log('Seeding initial vehicles into garage...');
            const seedQuery = `
                INSERT INTO garage_vehicles (name, consumption_km_l, image_url, is_default)
                VALUES 
                (
                    'Kia Sportage 2026', 
                    15.5, 
                    'https://image.pollinations.ai/prompt/3d%20isometric%20render%20of%20a%20modern%20white%20Kia%20Sportage%20car%2C%20studio%20lighting%2C%20clean%20background%2C%203d%20blender%20render%20style?width=400&height=300&nologo=true&seed=101', 
                    true
                ),
                (
                    'Fiat Doblò Maxi', 
                    16.0, 
                    'https://image.pollinations.ai/prompt/3d%20isometric%20render%20of%20a%20white%20Fiat%20Doblo%20cargo%20van%2C%20studio%20lighting%2C%20clean%20background%2C%203d%20blender%20render%20style?width=400&height=300&nologo=true&seed=202', 
                    false
                );
            `;
            await client.query(seedQuery);
        }

        await client.query('COMMIT');
        console.log('✅ garage_vehicles table is ready and seeded!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
