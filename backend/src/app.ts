import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { env } from './config/env.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import psyRouter from './routes/psy.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'WebKitsunova API'
  });
});

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/psy', psyRouter);

// Serve frontend static files in production (built by Vite)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(process.cwd(), 'public')));

  // SPA fallback: serve index.html for all non-API routes
  app.use((req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'public', 'index.html'));
  });
}

app.use(errorHandler);

export default app;

