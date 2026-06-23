import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { supabaseAdmin } from './lib/supabase.js';

import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';
import transactionRoutes from './routes/transactions.js';
import adminRoutes from './routes/admin.js';
import chatRoutes from './routes/chat.js';
import notificationRoutes from './routes/notifications.js';
import uploadRoutes from './routes/upload.js';
import verificationRoutes from './routes/verification.js';

const app = express();

// CORS middleware
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

// JSON body parser with 10mb limit
app.use(express.json({ limit: '10mb' }));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/verification', verificationRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`FritzStore server running on port ${PORT}`);
  const { error } = await supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true });
  if (error) {
    console.error('WARNING: Supabase connection test FAILED:', error.message);
  } else {
    console.log('Supabase connection OK');
  }
});

export default app;
