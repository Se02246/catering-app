import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Catering App Backend is running' });
});

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cateringRoutes from './routes/caterings.js';

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/caterings', cateringRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
