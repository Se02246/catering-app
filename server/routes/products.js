import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add a product
router.post('/', async (req, res) => {
    const { name, description, price_per_kg, image_url } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO products (name, description, price_per_kg, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, price_per_kg, image_url]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update a product
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, price_per_kg, image_url } = req.body;
    try {
        const result = await pool.query(
            'UPDATE products SET name = $1, description = $2, price_per_kg = $3, image_url = $4 WHERE id = $5 RETURNING *',
            [name, description, price_per_kg, image_url, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a product
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
