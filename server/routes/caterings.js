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
                `SELECT ci.quantity, p.name, p.price_per_kg, p.image_url 
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
    const { name, description, total_price, image_url, items } = req.body;
    // items is an array of { product_id, quantity }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const cateringResult = await client.query(
            'INSERT INTO caterings (name, description, total_price, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, total_price, image_url]
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

export default router;
