import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
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

app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/products', '/products'], productRoutes);
app.use(['/api/caterings', '/caterings'], cateringRoutes);
app.use(['/api/settings', '/settings'], settingsRoutes);


// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;

