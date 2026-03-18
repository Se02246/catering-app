import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Updates or creates an admin user based on environment variables.
 * Usage: 
 * 1. Set ADMIN_USERNAME and ADMIN_PASSWORD in your .env or server environment.
 * 2. Run: node server/update_admin_password.js
 */
async function updateAdminPassword() {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    if (!username || !password) {
        console.error('❌ Error: ADMIN_USERNAME and ADMIN_PASSWORD environment variables must be set.');
        process.exit(1);
    }

    try {
        // Check if users table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('Creating users table...');
            await pool.query(`
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
        }

        // We'll update the first user found or create a new one if the table is empty
        const userCheck = await pool.query('SELECT * FROM users LIMIT 1');

        if (userCheck.rows.length > 0) {
            const currentId = userCheck.rows[0].id;
            await pool.query(
                'UPDATE users SET username = $1, password_hash = $2 WHERE id = $3',
                [username, password, currentId]
            );
            console.log(`✅ Admin credentials updated successfully to: ${username}`);
        } else {
            await pool.query(
                'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
                [username, password]
            );
            console.log(`✅ Admin user created successfully as: ${username}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating credentials:', error);
        process.exit(1);
    }
}

updateAdminPassword();
