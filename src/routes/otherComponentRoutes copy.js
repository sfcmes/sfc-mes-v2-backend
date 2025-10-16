const express = require('express');
const { 
    getProjectsWithOtherComponents,
    updateOtherComponentStatus,
    createOtherComponent,
  } = require('../controllers/otherComponentController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/projects-with-other-components', auth, getProjectsWithOtherComponents);
router.put('/:componentId/status', auth, updateOtherComponentStatus);
router.post('/', auth, createOtherComponent);

module.exports = router;