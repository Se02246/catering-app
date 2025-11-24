import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkAdminPassword() {
    try {
        const result = await pool.query('SELECT username, password_hash FROM users WHERE username = $1', ['admin']);

        if (result.rows.length > 0) {
            console.log('Current admin user in database:');
            console.log('Username:', result.rows[0].username);
            console.log('Password:', result.rows[0].password_hash);
        } else {
            console.log('No admin user found in database');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAdminPassword();
