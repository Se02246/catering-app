import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        // Enable Vercel CDN caching
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=3600');
        const result = await pool.query('SELECT * FROM products ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add a product
router.post('/', async (req, res) => {
    const { name, description, price_per_kg, image_url, pieces_per_kg, min_order_quantity, order_increment, show_servings, servings_per_unit, is_visible, hide_at, images, is_gluten_free, is_lactose_free, is_sold_by_piece, price_per_piece, hide_quantity, hide_unit_price } = req.body;
    try {
        // Ensure images array is populated, fallback to image_url if needed
        const imagesArray = images || (image_url ? [image_url] : []);
        const mainImage = imagesArray.length > 0 ? imagesArray[0] : image_url;

        const result = await pool.query(
            'INSERT INTO products (name, description, price_per_kg, image_url, pieces_per_kg, min_order_quantity, order_increment, show_servings, servings_per_unit, is_visible, hide_at, allow_multiple, max_order_quantity, images, is_gluten_free, is_lactose_free, is_sold_by_piece, price_per_piece, hide_quantity, hide_unit_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *',
            [name, description, price_per_kg, mainImage, pieces_per_kg, min_order_quantity || 1, (order_increment !== undefined && order_increment !== null) ? order_increment : 1, show_servings || false, servings_per_unit, is_visible !== undefined ? is_visible : true, hide_at || null, req.body.allow_multiple || false, req.body.max_order_quantity || null, imagesArray, is_gluten_free || false, is_lactose_free || false, is_sold_by_piece || false, price_per_piece || null, hide_quantity || false, hide_unit_price || false]
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
    const { name, description, price_per_kg, image_url, pieces_per_kg, min_order_quantity, order_increment, show_servings, servings_per_unit, is_visible, hide_at, allow_multiple, images, is_gluten_free, is_lactose_free, is_sold_by_piece, price_per_piece, hide_quantity, hide_unit_price } = req.body;
    try {
        const imagesArray = images || (image_url ? [image_url] : []);
        const mainImage = imagesArray.length > 0 ? imagesArray[0] : image_url;

        const result = await pool.query(
            'UPDATE products SET name = $1, description = $2, price_per_kg = $3, image_url = $4, pieces_per_kg = $5, min_order_quantity = $6, order_increment = $7, show_servings = $8, servings_per_unit = $9, is_visible = $10, hide_at = $11, allow_multiple = $12, max_order_quantity = $13, images = $14, is_gluten_free = $15, is_lactose_free = $16, is_sold_by_piece = $17, price_per_piece = $18, hide_quantity = $19, hide_unit_price = $20 WHERE id = $21 RETURNING *',
            [name, description, price_per_kg, mainImage, pieces_per_kg, min_order_quantity || 1, (order_increment !== undefined && order_increment !== null) ? order_increment : 1, show_servings || false, servings_per_unit, is_visible !== undefined ? is_visible : true, hide_at || null, allow_multiple || false, req.body.max_order_quantity || null, imagesArray, is_gluten_free || false, is_lactose_free || false, is_sold_by_piece || false, price_per_piece || null, hide_quantity || false, hide_unit_price || false, id]
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

// Recalculate all product prices by a percentage
router.post('/recalculate', async (req, res) => {
    const { percentage } = req.body;
    if (percentage === undefined || isNaN(percentage)) {
        return res.status(400).json({ error: 'Invalid percentage value' });
    }

    const factor = 1 + (parseFloat(percentage) / 100);

    try {
        await pool.query(
            'UPDATE products SET price_per_kg = price_per_kg * $1, price_per_piece = price_per_piece * $1',
            [factor]
        );
        res.json({ success: true, message: `Prices updated by ${percentage}%` });
    } catch (err) {
        console.error('Error recalculating product prices:', err);
        res.status(500).json({ error: 'Server error recalculating prices' });
    }
});

// Batch update product prices
router.post('/batch-update', async (req, res) => {
    const { updates } = req.body; // Array of { id, price_per_kg, price_per_piece }
    if (!Array.isArray(updates)) {
        return res.status(400).json({ error: 'Invalid updates format' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const update of updates) {
            await client.query(
                'UPDATE products SET price_per_kg = $1, price_per_piece = $2 WHERE id = $3',
                [update.price_per_kg, update.price_per_piece, update.id]
            );
        }
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in batch update products:', err);
        res.status(500).json({ error: 'Server error during batch update' });
    } finally {
        client.release();
    }
});

export default router;
