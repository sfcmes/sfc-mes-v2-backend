const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://13.251.248.92',
      'https://13.251.248.92',
      'http://www.sfcpcsystem.com',
      'https://www.sfcpcsystem.com',
      'http://sfcpcsystem.com',
      'https://sfcpcsystem.com',
      'http://localhost:5173'
    ];

const log = (message, origin) => {
  console.log(`[${new Date().toISOString()}] CORS - ${message}`, origin ? `Origin: ${origin}` : '');
};

const isAllowedOrigin = (origin) => {
  return allowedOrigins.includes(origin);
};

log('Allowed origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    log('Received request from origin:', origin);
    if (!origin) {
      log('No origin specified (e.g., same-origin request)');
      callback(null, true);
    } else if (isAllowedOrigin(origin)) {
      log('Origin is allowed');
      callback(null, true);
    } else {
      log('Origin is not allowed');
      callback(new Error(`CORS error: Origin ${origin} is not allowed. Allowed origins are: ${allowedOrigins.join(', ')}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization',
    'Cache-Control',
    'If-None-Match',
    'If-Match',
    'ETag',
    'Pragma',
    'Expires'
  ],
  exposedHeaders: ['ETag'],
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 3600 // 1 hour, adjust as needed
};

// Helper function to add cache control headers to responses
const addCacheHeaders = (req, res, next) => {
  if (req.method === 'GET') {
    res.set({
      'Cache-Control': 'private, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  }
  next();
};

module.exports = {
  corsOptions,
  addCacheHeaders,
  getCorsOptions: (env) => corsOptions
};