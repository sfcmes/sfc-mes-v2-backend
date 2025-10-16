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

// Public routes
router.get('/public/projects', getProjects); // Add new public endpoint
router.get('/', getProjects);
router.get('/:id', getProject);
router.get('/:id/images', getProjectImagesController);

// Protected routes
router.use(auth);
router.post('/', addProject);
router.put('/:id', updateProject);
router.post('/:id/images', upload.single('file'), uploadProjectImage);
router.delete('/:id', deleteProject);

// Add this new route for deleting project images
router.delete('/:projectId/images/:imageId', deleteProjectImageController);

module.exports = router;