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
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Create settings table if it doesn't exist
        await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

        // Insert default header text if not exists
        const defaultHeaderText = "Catering dolci e salati preparati con passione per i tuoi eventi speciali.\n\nSe hai domande o richieste, per favor, fammele dopo aver inviato il preventivo, faro` del mio meglio per aiutarti.";

        await client.query(`
      INSERT INTO settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO NOTHING;
    `, ['header_text', defaultHeaderText]);

        await client.query('COMMIT');
        console.log('Settings table created and default values initialized successfully');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
