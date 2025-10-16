const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { createTablesIfNotExist } = require("./config/databaseInit");
const { getCorsOptions } = require("./config/cors");
const logger = require("./utils/logger");
const { PORT, NODE_ENV } = require("./config/env");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const sectionRoutes = require("./routes/sectionRoutes");
const componentRoutes = require("./routes/componentRoutes");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const downloadRoutes = require("./routes/downloadRoutes");
const otherComponentRoutes = require("./routes/otherComponentRoutes");

const app = express();

// Apply security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Apply CORS middleware
app.use(cors(getCorsOptions(NODE_ENV)));
logger.info('CORS middleware applied');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

logger.info('Loaded environment variables:');
logger.info('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);
logger.info('NODE_ENV:', NODE_ENV);

// Enhanced Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logMessage = `
    =======================
    METHOD: ${req.method}
    URL: ${req.originalUrl}
    STATUS: ${res.statusCode}
    DURATION: ${duration}ms
    HEADERS: ${JSON.stringify(req.headers, null, 2)}
    BODY: ${JSON.stringify(req.body, null, 2)}
    =======================
    `;
    logger.info(logMessage);
  });
  next();
});

// Route handling
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/components", componentRoutes);
app.use("/api/download", downloadRoutes);
app.use("/api/other-components", otherComponentRoutes);

// CORS Test Route
app.get('/cors-test', (req, res) => {
  res.json({ message: 'CORS is working' });
});

// 404 Handling
app.use("*", (req, res) => {
  const logMessage = `
  =======================
  404 - Route not found
  METHOD: ${req.method}
  URL: ${req.originalUrl}
  HEADERS: ${JSON.stringify(req.headers, null, 2)}
  BODY: ${JSON.stringify(req.body, null, 2)}
  =======================
  `;
  logger.warn(logMessage);
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const logMessage = `
  =======================
  ERROR: ${err.message}
  STACK: ${err.stack}
  METHOD: ${req.method}
  URL: ${req.originalUrl}
  HEADERS: ${JSON.stringify(req.headers, null, 2)}
  BODY: ${JSON.stringify(req.body, null, 2)}
  =======================
  `;
  logger.error(logMessage);
  res.status(500).json({ error: "An unexpected error occurred", message: err.message });
});

async function startServer() {
  try {
    await createTablesIfNotExist();
    logger.info("Database tables verified/created successfully");

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${NODE_ENV}`);
      logger.info(`Database host: ${process.env.DB_HOST}`);

      // Log registered routes
      app._router.stack
        .filter((r) => r.route)
        .forEach((r) => {
          Object.keys(r.route.methods).forEach((method) => {
            logger.info(
              `Route registered: ${method.toUpperCase()} ${r.route.path}`
            );
          });
        });
    });
  } catch (error) {
    logger.error("Failed to start server", { error: error.message });
    process.exit(1);
  }
}

startServer();