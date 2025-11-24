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

        // Check if admin user exists
        const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);

        if (userCheck.rows.length > 0) {
            // Update existing admin password
            await pool.query(
                'UPDATE users SET password_hash = $1 WHERE username = $2',
                ['160902Se!', 'admin']
            );
            console.log('✅ Admin password updated successfully to: 160902Se!');
        } else {
            // Create admin user with new password
            await pool.query(
                'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
                ['admin', '160902Se!']
            );
            console.log('✅ Admin user created successfully with password: 160902Se!');
        }

        console.log('\nLogin credentials:');
        console.log('Username: admin');
        console.log('Password: 160902Se!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating password:', error);
        process.exit(1);
    }
}

updateAdminPassword();
