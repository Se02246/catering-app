import { pool } from './db.js';

async function migrateReviewVotes() {
    try {
        console.log('Starting review votes migration...');
        
        // Add helpful_count and unhelpful_count columns
        await pool.query(`
            ALTER TABLE reviews 
            ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS unhelpful_count INTEGER DEFAULT 0;
        `);
        
        console.log('Migration completed successfully. Added helpful_count and unhelpful_count to reviews table.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
}

migrateReviewVotes();
