const express = require('express');
const { addComponent, getComponents, getComponentsByProjectId, uploadFileMiddleware } = require('../controllers/componentController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, uploadFileMiddleware, addComponent); // Use the middleware for file upload
router.get('/', auth, getComponents);
router.get('/project/:projectId', getComponentsByProjectId);

module.exports = router;
