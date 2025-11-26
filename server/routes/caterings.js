import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Get all caterings (with items)
router.get('/', async (req, res) => {
    try {
        const cateringsResult = await pool.query('SELECT * FROM caterings ORDER BY created_at DESC');
        const caterings = cateringsResult.rows;

        // For each catering, fetch its items
        // In production, use a JOIN or JSON_AGG for better performance
        for (let catering of caterings) {
            const itemsResult = await pool.query(
                `SELECT ci.product_id, ci.quantity, p.name, p.description, p.price_per_kg, p.image_url, p.images, 
                        p.pieces_per_kg, p.min_order_quantity, p.order_increment, p.show_servings, 
                        p.servings_per_unit, p.allow_multiple, p.max_order_quantity,
                        p.is_gluten_free, p.is_lactose_free
         FROM catering_items ci 
         JOIN products p ON ci.product_id = p.id 
         WHERE ci.catering_id = $1`,
                [catering.id]
            );
            catering.items = itemsResult.rows;
        }

        res.json(caterings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create a new catering package
router.post('/', async (req, res) => {
    const { name, description, total_price, image_url, items, discount_percentage, images, is_gluten_free, is_lactose_free } = req.body;
    // items is an array of { product_id, quantity }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Ensure images array is populated, fallback to image_url if needed
        const imagesArray = images || (image_url ? [image_url] : []);
        const mainImage = imagesArray.length > 0 ? imagesArray[0] : image_url;

        const cateringResult = await client.query(
            'INSERT INTO caterings (name, description, total_price, image_url, discount_percentage, images, is_gluten_free, is_lactose_free) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [name, description, total_price, mainImage, discount_percentage || 0, imagesArray, is_gluten_free || false, is_lactose_free || false]
        );
        const cateringId = cateringResult.rows[0].id;

        for (let item of items) {
            await client.query(
                'INSERT INTO catering_items (catering_id, product_id, quantity) VALUES ($1, $2, $3)',
                [cateringId, item.product_id, item.quantity]
            );
        }

        await client.query('COMMIT');
        res.json({ ...cateringResult.rows[0], items });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

// Update a catering package
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, total_price, image_url, items, discount_percentage, images, is_gluten_free, is_lactose_free } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const imagesArray = images || (image_url ? [image_url] : []);
        const mainImage = imagesArray.length > 0 ? imagesArray[0] : image_url;

        // Update catering details
        const cateringResult = await client.query(
            'UPDATE caterings SET name = $1, description = $2, total_price = $3, image_url = $4, discount_percentage = $5, images = $6, is_gluten_free = $7, is_lactose_free = $8 WHERE id = $9 RETURNING *',
            [name, description, total_price, mainImage, discount_percentage || 0, imagesArray, is_gluten_free || false, is_lactose_free || false, id]
        );

        if (cateringResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Catering package not found' });
        }

        // Delete existing items
        await client.query('DELETE FROM catering_items WHERE catering_id = $1', [id]);

        // Insert new items
        for (let item of items) {
            await client.query(
                'INSERT INTO catering_items (catering_id, product_id, quantity) VALUES ($1, $2, $3)',
                [id, item.product_id, item.quantity]
            );
        }

        await client.query('COMMIT');
        res.json({ ...cateringResult.rows[0], items });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

// Delete a catering package
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Items are deleted automatically via CASCADE if configured, but let's be safe/explicit or rely on FK
        // Assuming ON DELETE CASCADE is NOT set for safety in this snippet, we delete items first.
        // If your schema has ON DELETE CASCADE, this is redundant but harmless.
        await client.query('DELETE FROM catering_items WHERE catering_id = $1', [id]);

        const result = await client.query('DELETE FROM caterings WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Catering package not found' });
        }

        await client.query('COMMIT');
        res.json({ message: 'Catering package deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

export default router;
