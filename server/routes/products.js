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
    const { name, description, price_per_kg, image_url, pieces_per_kg, min_order_quantity, order_increment, show_servings, servings_per_unit, is_visible } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO products (name, description, price_per_kg, image_url, pieces_per_kg, min_order_quantity, order_increment, show_servings, servings_per_unit, is_visible, allow_multiple, max_order_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
            [name, description, price_per_kg, image_url, pieces_per_kg, min_order_quantity || 1, (order_increment !== undefined && order_increment !== null) ? order_increment : 1, show_servings || false, servings_per_unit, is_visible !== undefined ? is_visible : true, req.body.allow_multiple || false, req.body.max_order_quantity || null]
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
    const { name, description, price_per_kg, image_url, pieces_per_kg, min_order_quantity, order_increment, show_servings, servings_per_unit, is_visible, allow_multiple } = req.body;
    try {
        const result = await pool.query(
            'UPDATE products SET name = $1, description = $2, price_per_kg = $3, image_url = $4, pieces_per_kg = $5, min_order_quantity = $6, order_increment = $7, show_servings = $8, servings_per_unit = $9, is_visible = $10, allow_multiple = $11, max_order_quantity = $12 WHERE id = $13 RETURNING *',
            [name, description, price_per_kg, image_url, pieces_per_kg, min_order_quantity || 1, (order_increment !== undefined && order_increment !== null) ? order_increment : 1, show_servings || false, servings_per_unit, is_visible !== undefined ? is_visible : true, allow_multiple || false, req.body.max_order_quantity || null, id]
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
