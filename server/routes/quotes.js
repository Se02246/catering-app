import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Save a new quote and get its unique ID
router.post('/', async (req, res) => {
    const { items, total_price } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO quotes (items, total_price) VALUES ($1, $2) RETURNING id',
            [JSON.stringify(items), total_price]
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) {
        console.error('Error saving quote:', err);
        res.status(500).json({ error: 'Server error saving quote' });
    }
});

// Get a quote by ID (Public)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM quotes WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching quote:', err);
        res.status(500).json({ error: 'Server error fetching quote' });
    }
});

export default router;
