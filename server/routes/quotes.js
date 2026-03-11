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
        // Try exact match first if it's a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(id)) {
            const result = await pool.query('SELECT * FROM quotes WHERE id = $1', [id]);
            if (result.rows.length > 0) {
                return res.json(result.rows[0]);
            }
        }

        // If not found or not a full UUID, try a prefix match (casting UUID to TEXT)
        // Using ILIKE for case-insensitive matching
        const partialResult = await pool.query(
            'SELECT * FROM quotes WHERE id::text ILIKE $1 LIMIT 1',
            [`${id}%`]
        );

        if (partialResult.rows.length === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        res.json(partialResult.rows[0]);
    } catch (err) {
        console.error('Error fetching quote:', err);
        res.status(500).json({ error: 'Server error fetching quote' });
    }
});

// Update an existing quote (Admin)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { items, total_price } = req.body;
    try {
        const result = await pool.query(
            'UPDATE quotes SET items = $1, total_price = $2 WHERE id = $3 RETURNING *',
            [JSON.stringify(items), total_price, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating quote:', err);
        res.status(500).json({ error: 'Server error updating quote' });
    }
});

export default router;
