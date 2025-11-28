import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Get all caterings (with items)
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                c.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'product_id', ci.product_id,
                            'quantity', ci.quantity,
                            'name', p.name,
                            'description', p.description,
                            'price_per_kg', p.price_per_kg,
                            'image_url', p.image_url,
                            'images', p.images,
                            'pieces_per_kg', p.pieces_per_kg,
                            'min_order_quantity', p.min_order_quantity,
                            'order_increment', p.order_increment,
                            'show_servings', p.show_servings,
                            'servings_per_unit', p.servings_per_unit,
                            'allow_multiple', p.allow_multiple,
                            'max_order_quantity', p.max_order_quantity,
                            'is_gluten_free', p.is_gluten_free,
                            'is_lactose_free', p.is_lactose_free,
                            'is_sold_by_piece', p.is_sold_by_piece,
                            'price_per_piece', p.price_per_piece
                        ) ORDER BY p.name
                    ) FILTER (WHERE ci.id IS NOT NULL),
                    '[]'
                ) as items
            FROM caterings c
            LEFT JOIN catering_items ci ON c.id = ci.catering_id
            LEFT JOIN products p ON ci.product_id = p.id
            GROUP BY c.id
            ORDER BY c.sort_order ASC, c.created_at DESC
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reorder packages
router.put('/reorder', async (req, res) => {
    const { packages } = req.body; // Array of { id, sort_order }

    if (!packages || !Array.isArray(packages)) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const pkg of packages) {
            await client.query(
                'UPDATE caterings SET sort_order = $1 WHERE id = $2',
                [pkg.sort_order, pkg.id]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Packages reordered successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
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
