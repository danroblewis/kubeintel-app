import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

import { kubernetesRouter } from './routes/kubernetes';
import { credentialsRouter } from './routes/credentials';
import { configRouter } from './routes/config';
import { errorHandler } from './middleware/errorHandler';
import { setupWebSocket } from './websocket';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.anthropic.com", "https://api.openai.com", "https://generativelanguage.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || false
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// API routes
app.use('/api/kubernetes', kubernetesRouter);
app.use('/api/credentials', credentialsRouter);
app.use('/api/config', configRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Setup WebSocket for real-time features (logs, shell, etc.)
const wss = new WebSocketServer({ server });
setupWebSocket(wss);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app };