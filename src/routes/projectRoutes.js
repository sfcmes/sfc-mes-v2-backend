const express = require('express');
const { 
  addProject, 
  getProjects, 
  getProject, 
  updateProject, 
  uploadProjectImage, 
  getProjectImagesController, 
  deleteProject,
  deleteProjectImageController // Add this import
} = require('../controllers/projectController');
const auth = require('../middleware/auth');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
// Public routes - make sure these are BEFORE any auth middleware
router.get('/public/projects', getProjects);
router.get('/projects', getProjects);  // Keep this for backward compatibility
router.get('/', getProjects);  // This is what's actually being called
router.get('/:id', getProject);
router.get('/:id/images', getProjectImagesController);

// Protected routes
router.use(auth); // Everything after this will require authentication
router.post('/', addProject);
router.put('/:id', updateProject);
router.post('/:id/images', upload.single('file'), uploadProjectImage);
router.delete('/:id', deleteProject);
router.delete('/:projectId/images/:imageId', deleteProjectImageController);

module.exports = router;