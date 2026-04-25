import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Get all reviews
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ error: 'Server error fetching reviews' });
    }
});

// Add a review (Optional: useful for admin testing or adding reviews from dashboard later)
router.post('/', async (req, res) => {
    const { author_name, rating, comment, image_url } = req.body;
    if (!author_name || !rating || !comment) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO reviews (author_name, rating, comment, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [author_name, rating, comment, image_url || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding review:', err);
        res.status(500).json({ error: 'Server error adding review' });
    }
});

// Delete a review
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).json({ error: 'Server error deleting review' });
    }
});

export default router;
