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
    const { name, description, price_per_kg, image_url, pieces_per_kg, min_order_quantity, order_increment, show_servings, servings_per_unit, is_visible, images, is_gluten_free, is_lactose_free, is_sold_by_piece, price_per_piece, discounted_price } = req.body;
    try {
        // Ensure images array is populated, fallback to image_url if needed
        const imagesArray = images || (image_url ? [image_url] : []);
        const mainImage = imagesArray.length > 0 ? imagesArray[0] : image_url;

        const result = await pool.query(
            'INSERT INTO products (name, description, price_per_kg, image_url, pieces_per_kg, min_order_quantity, order_increment, show_servings, servings_per_unit, is_visible, allow_multiple, max_order_quantity, images, is_gluten_free, is_lactose_free, is_sold_by_piece, price_per_piece, discounted_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *',
            [name, description, price_per_kg, mainImage, pieces_per_kg, min_order_quantity || 1, (order_increment !== undefined && order_increment !== null) ? order_increment : 1, show_servings || false, servings_per_unit, is_visible !== undefined ? is_visible : true, req.body.allow_multiple || false, req.body.max_order_quantity || null, imagesArray, is_gluten_free || false, is_lactose_free || false, is_sold_by_piece || false, price_per_piece || null, discounted_price || null]
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
    const { name, description, price_per_kg, image_url, pieces_per_kg, min_order_quantity, order_increment, show_servings, servings_per_unit, is_visible, allow_multiple, images, is_gluten_free, is_lactose_free, is_sold_by_piece, price_per_piece, discounted_price } = req.body;
    try {
        const imagesArray = images || (image_url ? [image_url] : []);
        const mainImage = imagesArray.length > 0 ? imagesArray[0] : image_url;

        const result = await pool.query(
            'UPDATE products SET name = $1, description = $2, price_per_kg = $3, image_url = $4, pieces_per_kg = $5, min_order_quantity = $6, order_increment = $7, show_servings = $8, servings_per_unit = $9, is_visible = $10, allow_multiple = $11, max_order_quantity = $12, images = $13, is_gluten_free = $14, is_lactose_free = $15, is_sold_by_piece = $16, price_per_piece = $17, discounted_price = $18 WHERE id = $19 RETURNING *',
            [name, description, price_per_kg, mainImage, pieces_per_kg, min_order_quantity || 1, (order_increment !== undefined && order_increment !== null) ? order_increment : 1, show_servings || false, servings_per_unit, is_visible !== undefined ? is_visible : true, allow_multiple || false, req.body.max_order_quantity || null, imagesArray, is_gluten_free || false, is_lactose_free || false, is_sold_by_piece || false, price_per_piece || null, discounted_price || null, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({
            ...result.rows[0],
            _debug_received_discount: discounted_price
        });
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
