const express = require('express');
const { 
    getProjectsWithOtherComponents,
    updateOtherComponentStatus,
    createOtherComponent,
    // เพิ่มฟังก์ชันใหม่
    updateOtherComponentDetails,
    deleteOtherComponentById,
    getOtherComponentsByProjectId
} = require('../controllers/otherComponentController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/projects-with-other-components', getProjectsWithOtherComponents);
router.put('/:componentId/status', auth, updateOtherComponentStatus);
router.post('/', auth, createOtherComponent);
// เพิ่ม route ใหม่
router.get('/project/:projectId', auth, getOtherComponentsByProjectId);
router.put('/:componentId/details', auth, updateOtherComponentDetails);
router.delete('/:componentId', auth, deleteOtherComponentById);

module.exports = router;