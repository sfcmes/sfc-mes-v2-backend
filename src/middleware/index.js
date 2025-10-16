const express = require('express');
const bodyParser = require('body-parser');
const authMiddleware = require('./auth'); // Assuming auth.js is in the same directory
require('dotenv').config();

const router = express.Router();

// Middleware to parse JSON bodies
router.use(bodyParser.json());

// Mount authentication middleware
router.use(authMiddleware);

module.exports = router; // Export the configured router
