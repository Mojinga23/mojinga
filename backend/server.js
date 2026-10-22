require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const adminRoutes = require('./routes/admin');
const integrationRoutes = require('./routes/integrations');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB (with graceful fallback)
connectDB();

// Enable CORS — allow requests from threeapp.site, twoapp.site, connected apps, and localhost
const defaultAllowedOrigins = [
  'https://threeapp.site',
  'https://www.threeapp.site',
  'https://api.threeapp.site',
  'https://twoapp.site',
  'https://www.twoapp.site',
  'https://palpesa.site',
  'https://www.palpesa.site',
  'https://palpesabet.site',
  'https://www.palpesabet.site',
  'https://vexbet.site',
  'https://www.vexbet.site',
  'https://patatrader.site',
  'https://www.patatrader.site',
  'https://betzion.site',
  'https://www.betzion.site',
  'http://localhost:4200',
  'http://localhost:4201',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://192.168.100.40:4200'
];

const envOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.threeapp.site') ||
      origin.endsWith('.twoapp.site') ||
      origin.endsWith('.netlify.app') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1/integrations', integrationRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend build if exists
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist', 'frontend', 'browser');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 M-PESA Backend server running on http://localhost:${PORT} and http://192.168.100.40:${PORT}`);
  });
}

// Only run local self-signed HTTPS server when running locally (not on Render/cloud/Vercel)
if (!process.env.RENDER && !process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  try {
    const https = require('https');
    const selfsigned = require('selfsigned');
    const pems = selfsigned.generate(
      [
        { name: 'commonName', value: '192.168.100.40' },
        { name: 'organizationName', value: 'Safaricom M-PESA' }
      ],
      { days: 365, keySize: 2048 }
    );
    const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
    const httpsServer = https.createServer({ key: pems.private, cert: pems.cert }, app);
    httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
      console.log(`🔒 Local HTTPS server running on https://localhost:${HTTPS_PORT} and https://192.168.100.40:${HTTPS_PORT}`);
    });
  } catch (e) {
    console.warn('HTTPS server initialization skipped:', e.message);
  }
}

module.exports = app;

