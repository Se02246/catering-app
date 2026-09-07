import pg from 'pg';
import 'dotenv/config';

// Ensure PostgreSQL DATE (OID 1082) is returned as a plain string 'YYYY-MM-DD'
// to avoid local timezone conversions and off-by-one day bugs.
pg.types.setTypeParser(1082, (val) => val);

const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Neon
    }
});
