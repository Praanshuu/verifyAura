// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import compression from 'compression';
import { clerkMiddleware } from '@clerk/express';
import path from 'path';

// Import routes
import certificateRoutes from './routes/certificates';
import adminRoutes from './routes/admin';
import participantRoutes from './routes/participants';
import logsRoutes from './routes/logs';
import { statsRouter } from './routes/stats';

// Import middleware
import { errorHandler, notFoundHandler, rateLimitErrorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Clerk middleware (must come before routes)
app.use(clerkMiddleware());

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://*.clerk.com",
        "https://*.clerk.services",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net",
        "https://classic-fawn-35.clerk.accounts.dev"
      ],
      scriptSrcElem: [
        "'self'",
        "https://*.clerk.com",
        "https://*.clerk.services",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net",
        "https://classic-fawn-35.clerk.accounts.dev"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com"
      ],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));



// Compression middleware
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:8080',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://verify-aura-frontend.vercel.app/'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Clerk-Auth-Token']
};
app.use(cors(corsOptions));

// Rate limiting with different rules for different endpoints
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    status: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

const certificateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    error: 'Too many certificate verification requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    status: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/certificates/verify', certificateLimiter);
app.use(generalLimiter);

// Body parsing middleware with size limits
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      (res as any).status(400).json({
        success: false,
        message: 'Invalid JSON payload',
        code: 'INVALID_JSON'
      });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  parameterLimit: 1000
}));

// Request logging middleware with performance tracking
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  res.setHeader('X-Request-ID', requestId);

  console.log(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path} - ${req.ip}`);

  if (NODE_ENV === 'development' && req.method !== 'GET' && req.body) {
    console.log(`[${requestId}] Request Body:`, JSON.stringify(req.body, null, 2));
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    const resetColor = '\x1b[0m';

    console.log(
      `${statusColor}[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms${resetColor}`
    );

    if (duration > 1000) {
      console.warn(`[${requestId}] SLOW REQUEST: ${req.method} ${req.path} took ${duration}ms`);
    }
  });

  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();

    const { error: dbError } = await require('./services/supabase').supabase
      .from('events')
      .select('id')
      .limit(1);

    const dbHealthy = !dbError;
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    const healthStatus = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      environment: NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        memory: memoryUsage.heapUsed < 100 * 1024 * 1024 ? 'healthy' : 'warning'
      },
      performance: {
        responseTime: Date.now() - startTime,
        memoryUsage: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
          external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB'
        }
      }
    };

    res.status(dbHealthy ? 200 : 503).json(healthStatus);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API routes
app.use('/api/certificates', certificateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/participants', participantRoutes);
app.use('/api/admin/logs', logsRoutes);
app.use('/api/admin/stats', statsRouter);

// 🔽 Static frontend serving (after API routes, before error handlers)
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api') || req.originalUrl === '/health') {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


// Error handlers
app.use(rateLimitErrorHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Certificate verification: http://localhost:${PORT}/api/certificates/verify`);
  console.log(`👨‍💼 Admin API: http://localhost:${PORT}/api/admin`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🔧 Rate limiting: ${process.env.RATE_LIMIT_MAX_REQUESTS || '100'} requests per 15 minutes`);
  console.log(`📝 Logging: ${NODE_ENV === 'development' ? 'Detailed' : 'Production'}`);
});

server.timeout = 30000;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

export default app;
