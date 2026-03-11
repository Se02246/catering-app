import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Get a setting by key
router.get('/:key', async (req, res) => {
    const { key } = req.params;
    try {
        // Enable Vercel CDN caching
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=3600');
        const result = await pool.query('SELECT value FROM settings WHERE key = $1', [key]);
        if (result.rows.length > 0) {
            res.json({ value: result.rows[0].value });
        } else {
            res.status(404).json({ error: 'Setting not found' });
        }
    } catch (err) {
        console.error('Error fetching setting:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a setting by key
router.put('/:key', async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;

    if (!value) {
        return res.status(400).json({ error: 'Value is required' });
    }

    try {
        await pool.query(`
      INSERT INTO settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = $2
    `, [key, value]);
        res.json({ message: 'Setting updated successfully', key, value });
    } catch (err) {
        console.error('Error updating setting:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
