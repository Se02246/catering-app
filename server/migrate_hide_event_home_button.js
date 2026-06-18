import { pool } from './db.js';

async function migrate() {
    console.log('Starting migration: Adding hide_event_home_button to settings table...');
    const client = await pool.connect();
    try {
        // Insert the setting if it doesn't exist, default to 'false'
        await client.query(`
            INSERT INTO settings (key, value)
            VALUES ('hide_event_home_button', 'false')
            ON CONFLICT (key) DO NOTHING;
        `);
        console.log('Migration completed: hide_event_home_button setting initialized.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
