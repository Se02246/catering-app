import express from 'express';
import { pool } from '../db.js';
import { sendReviewNotification } from '../utils/email.js';

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

// Add a review
router.post('/', async (req, res) => {
    const { title, author_name, rating, comment, images } = req.body;
    if (!title || !rating) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO reviews (title, author_name, rating, comment, images) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, author_name || null, rating, comment || null, images || []]
        );
        const newReview = result.rows[0];
        
        // Send email notification asynchronously
        const frontendUrl = req.headers.origin || req.protocol + '://' + req.get('host');
        sendReviewNotification(newReview, frontendUrl);

        res.status(201).json(newReview);
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

// Update a review (e.g. add a response)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { response } = req.body;
    
    try {
        const result = await pool.query(
            'UPDATE reviews SET response = $1 WHERE id = $2 RETURNING *',
            [response, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating review:', err);
        res.status(500).json({ error: 'Server error updating review' });
    }
});

// Vote on a review
router.post('/:id/vote', async (req, res) => {
    const { id } = req.params;
    const { type, action } = req.body; // type: 'helpful' | 'unhelpful', action: 'add' | 'remove'
    
    if (!['helpful', 'unhelpful'].includes(type) || !['add', 'remove'].includes(action)) {
        return res.status(400).json({ error: 'Invalid vote parameters' });
    }

    const column = type === 'helpful' ? 'helpful_count' : 'unhelpful_count';
    const operator = action === 'add' ? '+' : '-';
    
    try {
        const query = `
            UPDATE reviews 
            SET ${column} = GREATEST(0, COALESCE(${column}, 0) ${operator} 1) 
            WHERE id = $1 
            RETURNING *
        `;
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error voting on review:', err);
        res.status(500).json({ error: 'Server error voting on review' });
    }
});

export default router;
