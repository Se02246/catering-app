import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Login Endpoint
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Simple check against database
        // In a real app, use bcrypt to compare hashes!
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            // VERY INSECURE: Plain text comparison for demo purposes as requested
            // If you want to use hashes, use bcrypt.compare(password, user.password_hash)
            if (password === user.password_hash) {
                res.json({ success: true, token: 'mock-jwt-token-123', user: { username: user.username } });
            } else {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
