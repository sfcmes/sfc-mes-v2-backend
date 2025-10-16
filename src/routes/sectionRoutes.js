const express = require('express');
const { addSection, getSections, getSectionsByProject, getSectionById, updateSectionById, deleteSectionById } = require('../controllers/sectionController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', addSection); // Create a new section
router.get('/', getSections); // Get all sections
router.get('/projects/:projectId/sections', getSectionsByProject); // Get sections by project ID
router.get('/:sectionId', getSectionById); // Get a single section by ID
router.put('/:sectionId', updateSectionById); // Update a section by ID
router.delete('/:sectionId', deleteSectionById); // Delete a section by ID

module.exports = router;
