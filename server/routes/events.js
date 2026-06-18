import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Helper to generate unique slug
async function generateUniqueSlug(name, currentEventId = null, dbClient = null) {
    const client = dbClient || pool;
    
    // Normalize and remove accents (e.g. à -> a)
    const cleanName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    let baseSlug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric except spaces and hyphens
        .trim()
        .replace(/\s+/g, '-');        // Replace spaces with single hyphens
    
    if (!baseSlug) {
        baseSlug = 'event';
    }

    let slug = baseSlug;
    let counter = 1;
    let exists = true;

    while (exists) {
        let query = 'SELECT id FROM events WHERE slug = $1';
        let params = [slug];
        if (currentEventId) {
            query += ' AND id != $2';
            params.push(currentEventId);
        }
        const res = await client.query(query, params);
        if (res.rows.length === 0) {
            exists = false;
        } else {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    }
    return slug;
}

// Get all events (with associated products)
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                e.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', p.id,
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
                            'is_gluten_free', p.is_gluten_free,
                            'is_lactose_free', p.is_lactose_free,
                            'is_vegetarian', p.is_vegetarian,
                            'is_vegan', p.is_vegan,
                            'is_sold_by_piece', p.is_sold_by_piece,
                            'price_per_piece', p.price_per_piece,
                            'hide_quantity', p.hide_quantity,
                            'hide_unit_price', p.hide_unit_price,
                            'hide_in_menu', p.hide_in_menu
                        ) ORDER BY ep.sort_order ASC, ep.id ASC
                    ) FILTER (WHERE ep.id IS NOT NULL),
                    '[]'::json
                ) as products
            FROM events e
            LEFT JOIN event_products ep ON e.id = ep.event_id
            LEFT JOIN products p ON ep.product_id = p.id
            GROUP BY e.id
            ORDER BY e.sort_order ASC, e.created_at DESC
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single event by slug
router.get('/slug/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
        const query = `
            SELECT 
                e.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', p.id,
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
                            'is_gluten_free', p.is_gluten_free,
                            'is_lactose_free', p.is_lactose_free,
                            'is_vegetarian', p.is_vegetarian,
                            'is_vegan', p.is_vegan,
                            'is_sold_by_piece', p.is_sold_by_piece,
                            'price_per_piece', p.price_per_piece,
                            'hide_quantity', p.hide_quantity,
                            'hide_unit_price', p.hide_unit_price,
                            'hide_in_menu', p.hide_in_menu
                        ) ORDER BY ep.sort_order ASC, ep.id ASC
                    ) FILTER (WHERE ep.id IS NOT NULL),
                    '[]'::json
                ) as products
            FROM events e
            LEFT JOIN event_products ep ON e.id = ep.event_id
            LEFT JOIN products p ON ep.product_id = p.id
            WHERE e.slug = $1
            GROUP BY e.id
        `;

        const result = await pool.query(query, [slug]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create event
router.post('/', async (req, res) => {
    const {
        name, date_text, is_visible, hide_at,
        where_title, where_image_url, where_link, where_description,
        products_title, products_description,
        info_title, info_description,
        product_ids
    } = req.body;

    if (!name || !date_text) {
        return res.status(400).json({ error: 'Name and Date are required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Generate unique slug
        const slug = await generateUniqueSlug(name, null, client);

        const eventResult = await client.query(
            `INSERT INTO events (
                slug, name, date_text, is_visible, hide_at,
                where_title, where_image_url, where_link, where_description,
                products_title, products_description,
                info_title, info_description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
            [
                slug, name, date_text, is_visible !== undefined ? is_visible : true, hide_at || null,
                where_title || 'Quando e Dove saremo', where_image_url || null, where_link || null, where_description || null,
                products_title || 'I prodotti che porteremo', products_description || null,
                info_title || 'Altre informazioni', info_description || null
            ]
        );
        const eventId = eventResult.rows[0].id;

        if (product_ids && Array.isArray(product_ids)) {
            for (let [idx, prodId] of product_ids.entries()) {
                await client.query(
                    'INSERT INTO event_products (event_id, product_id, sort_order) VALUES ($1, $2, $3)',
                    [eventId, prodId, idx]
                );
            }
        }

        await client.query('COMMIT');
        
        // Fetch full event with products
        const fullEventQuery = `
            SELECT 
                e.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', p.id,
                            'name', p.name,
                            'image_url', p.image_url,
                            'images', p.images,
                            'description', p.description,
                            'is_gluten_free', p.is_gluten_free,
                            'is_lactose_free', p.is_lactose_free,
                            'is_vegetarian', p.is_vegetarian,
                            'is_vegan', p.is_vegan,
                            'is_sold_by_piece', p.is_sold_by_piece,
                            'price_per_piece', p.price_per_piece,
                            'price_per_kg', p.price_per_kg
                        ) ORDER BY ep.sort_order ASC, ep.id ASC
                    ) FILTER (WHERE ep.id IS NOT NULL),
                    '[]'::json
                ) as products
            FROM events e
            LEFT JOIN event_products ep ON e.id = ep.event_id
            LEFT JOIN products p ON ep.product_id = p.id
            WHERE e.id = $1
            GROUP BY e.id
        `;
        const fullEventRes = await client.query(fullEventQuery, [eventId]);
        res.json(fullEventRes.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

// Reorder events
router.put('/reorder', async (req, res) => {
    const { events } = req.body; // Array of { id, sort_order }
    if (!events || !Array.isArray(events)) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const ev of events) {
            await client.query('UPDATE events SET sort_order = $1 WHERE id = $2', [ev.sort_order, ev.id]);
        }
        await client.query('COMMIT');
        res.json({ message: 'Events reordered successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

// Update event
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        name, date_text, is_visible, hide_at,
        where_title, where_image_url, where_link, where_description,
        products_title, products_description,
        info_title, info_description,
        product_ids
    } = req.body;

    if (!name || !date_text) {
        return res.status(400).json({ error: 'Name and Date are required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if event exists and if name has changed
        const existingRes = await client.query('SELECT name, slug FROM events WHERE id = $1', [id]);
        if (existingRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Event not found' });
        }

        let slug = existingRes.rows[0].slug;
        if (existingRes.rows[0].name !== name) {
            slug = await generateUniqueSlug(name, id, client);
        }

        const eventResult = await client.query(
            `UPDATE events SET 
                slug = $1, name = $2, date_text = $3, is_visible = $4, hide_at = $5,
                where_title = $6, where_image_url = $7, where_link = $8, where_description = $9,
                products_title = $10, products_description = $11,
                info_title = $12, info_description = $13
            WHERE id = $14 RETURNING *`,
            [
                slug, name, date_text, is_visible !== undefined ? is_visible : true, hide_at || null,
                where_title, where_image_url, where_link, where_description,
                products_title, products_description,
                info_title, info_description,
                id
            ]
        );

        // Delete existing associated products
        await client.query('DELETE FROM event_products WHERE event_id = $1', [id]);

        // Insert new associated products
        if (product_ids && Array.isArray(product_ids)) {
            for (let [idx, prodId] of product_ids.entries()) {
                await client.query(
                    'INSERT INTO event_products (event_id, product_id, sort_order) VALUES ($1, $2, $3)',
                    [id, prodId, idx]
                );
            }
        }

        await client.query('COMMIT');

        // Fetch full updated event with products
        const fullEventQuery = `
            SELECT 
                e.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', p.id,
                            'name', p.name,
                            'image_url', p.image_url,
                            'images', p.images,
                            'description', p.description,
                            'is_gluten_free', p.is_gluten_free,
                            'is_lactose_free', p.is_lactose_free,
                            'is_vegetarian', p.is_vegetarian,
                            'is_vegan', p.is_vegan,
                            'is_sold_by_piece', p.is_sold_by_piece,
                            'price_per_piece', p.price_per_piece,
                            'price_per_kg', p.price_per_kg
                        ) ORDER BY ep.sort_order ASC, ep.id ASC
                    ) FILTER (WHERE ep.id IS NOT NULL),
                    '[]'::json
                ) as products
            FROM events e
            LEFT JOIN event_products ep ON e.id = ep.event_id
            LEFT JOIN products p ON ep.product_id = p.id
            WHERE e.id = $1
            GROUP BY e.id
        `;
        const fullEventRes = await client.query(fullEventQuery, [id]);
        res.json(fullEventRes.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

// Delete event
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM events WHERE id = $1', [id]);
        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
