import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateAdminPassword() {
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

        // We'll update any existing user to Barby or create Barby if none exists
        // This ensures there's only one admin-level user
        const userCheck = await pool.query('SELECT * FROM users LIMIT 1');

        if (userCheck.rows.length > 0) {
            // Update existing user (regardless of current name) to Barby
            const currentId = userCheck.rows[0].id;
            await pool.query(
                'UPDATE users SET username = $1, password_hash = $2 WHERE id = $3',
                ['Barby', '02101976Lai!', currentId]
            );
            console.log('✅ Admin credentials updated successfully to Barby');
        } else {
            // Create Barby user
            await pool.query(
                'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
                ['Barby', '02101976Lai!']
            );
            console.log('✅ Admin user created successfully as Barby');
        }

        console.log('\nLogin credentials updated:');
        console.log('Username: Barby');
        console.log('Password: (hidden)');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating credentials:', error);
        process.exit(1);
    }
}

updateAdminPassword();
