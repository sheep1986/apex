const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Vercel
app.set('trust proxy', true);

// CORS configuration
const allowedOrigins = [
  'https://cheery-hamster-593ff7.netlify.app',
  'https://tourmaline-hummingbird-cdcef0.netlify.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:5180',
  'http://localhost:5522',
  'http://localhost:3000',
  'http://localhost:8080'
];

if (process.env.CORS_ORIGIN) allowedOrigins.push(process.env.CORS_ORIGIN);
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  console.log(`🔍 CORS: ${req.method} ${req.path} from origin: ${origin || 'no-origin'}`);
  
  if (origin) {
    if (allowedOrigins.includes(origin) || origin.endsWith('.netlify.app')) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      console.log('✅ CORS allowed for:', origin);
    } else {
      console.log('❌ CORS blocked for:', origin);
    }
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
  res.header('Access-Control-Allow-Headers', 'Authorization,Content-Type,X-Requested-With,Accept,Origin,Access-Control-Request-Method,Access-Control-Request-Headers,X-Org-Id,X-User-Id,X-Request-Id');
  res.header('Access-Control-Expose-Headers', 'Content-Length,Content-Range,X-Content-Range');
  res.header('Access-Control-Max-Age', '86400');
  res.header('Vary', 'Origin');
  
  if (req.method === 'OPTIONS') {
    console.log('✅ Preflight OPTIONS request handled');
    return res.status(204).end();
  }
  
  next();
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.3.0-simple',
    cors: {
      configured: true,
      cors_origin: process.env.CORS_ORIGIN || 'not set',
      frontend_url: process.env.FRONTEND_URL || 'not set',
      netlify_allowed: true,
      bulletproof: true
    }
  });
});

// Diagnostic endpoint for deployment verification
app.get('/__meta', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const distApi = path.join(__dirname, 'api');
  let files = [];
  try { 
    files = fs.readdirSync(distApi); 
  } catch {}
  
  res.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    node: process.version,
    distApiFiles: files,
    now: new Date().toISOString(),
    buildInfo: {
      vercelBuild: !!process.env.VERCEL,
      distExists: fs.existsSync(__dirname),
      apiDirExists: fs.existsSync(distApi)
    }
  });
});

// Basic VAPI data endpoint (simplified)
app.get('/api/vapi-data', (req, res) => {
  res.json({
    message: 'VAPI data endpoint is working',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(err.status || 500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Campaign executor endpoint for manual triggering or Vercel cron
app.get('/api/trigger-campaign-executor', async (req, res) => {
  console.log('🎯 Campaign executor endpoint called (simple mode)');

  // In simple mode, the campaign executor TypeScript service is not available
  // This endpoint is a placeholder - the full campaign executor requires the compiled TypeScript backend
  res.json({
    success: true,
    message: 'Campaign executor endpoint reached - simple mode active',
    note: 'Full campaign execution requires compiled TypeScript backend',
    timestamp: new Date().toISOString()
  });
});

// Export for Vercel
module.exports = app;

// Start server if not in Vercel
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Apex AI Calling Platform API Server (Simple) running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔍 Meta endpoint: http://localhost:${PORT}/__meta`);
    console.log(`⚠️  Note: Campaign executor is NOT running automatically on Vercel`);
    console.log(`    Use /api/trigger-campaign-executor or set up Vercel Cron`);
  });
}