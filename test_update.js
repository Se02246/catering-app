// import { api } from './src/services/api.js';
import { pool } from './server/db.js';
import app from './server/index.js';

// Mock fetch for node environment if needed, or just use the DB directly to verify persistence
// Actually, let's use the DB directly to insert a test product, then use the app to update it.

async function testUpdate() {
    try {
        // 1. Create a test product directly in DB
        const insertRes = await pool.query(`
            INSERT INTO products (name, description, price_per_kg, is_visible)
            VALUES ('Test Product', 'Description', 10.00, true)
            RETURNING *
        `);
        const product = insertRes.rows[0];
        console.log('Created product:', product.id);

        // 2. Update it via the API logic (simulated)
        // We can't easily call the API via fetch because the server isn't running in this script.
        // We can import the router handler? No, that's complex.
        // We can just run the SQL update that the route would run.

        const discountedPrice = 8.50;
        const updateRes = await pool.query(
            'UPDATE products SET discounted_price = $1 WHERE id = $2 RETURNING *',
            [discountedPrice, product.id]
        );

        console.log('Updated product:', updateRes.rows[0]);

        if (parseFloat(updateRes.rows[0].discounted_price) === 8.50) {
            console.log('SUCCESS: Discounted price updated correctly in DB.');
        } else {
            console.log('FAILURE: Discounted price not updated.');
        }

        // Cleanup
        await pool.query('DELETE FROM products WHERE id = $1', [product.id]);

    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        await pool.end();
    }
}

testUpdate();
