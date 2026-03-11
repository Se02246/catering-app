import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

// Update allowed origins for Coolify deployment
app.use(cors({
  origin: true, // In Coolify, usually we allow all during setup or handle via reverse proxy
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Test route
app.get('/api/health', async (req, res) => {
  try {
    // Esegue una query minima per svegliare il database se è in pausa
    await pool.query('SELECT 1');
    res.json({ status: 'ok', message: 'Catering App Backend and Database are running' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

app.get('/api/debug', (req, res) => {
  res.json({
    url: req.url,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    headers: req.headers
  });
});

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cateringRoutes from './routes/caterings.js';
import settingsRoutes from './routes/settings.js';
import quoteRoutes from './routes/quotes.js';

app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/products', '/products'], productRoutes);
app.use(['/api/caterings', '/caterings'], cateringRoutes);
app.use(['/api/settings', '/settings'], settingsRoutes);
app.use(['/api/quotes', '/quotes'], quoteRoutes);


// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Always listen on PORT for non-serverless environments (like Coolify)
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

