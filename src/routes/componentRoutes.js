const express = require("express");
const {
  addComponent,
  getComponents,
  getComponentsByProjectId,
  uploadFileMiddleware,
  getComponentById,
  addComponentHistory,
  updateComponent,
  getComponentFiles,
  updateFileInRevision,
  deleteFileRevision,
  updateComponentWithFile,
  uploadComponentFile,
  addPrecastComponent,
  addComponentsBatch,
  updateComponentStatus,
  updateComponentStatusAuth,
  deleteComponent,
} = require("../controllers/componentController");
const {
  getProjectDetailsByComponentId,
} = require("../controllers/projectController");
const auth = require("../middleware/auth");
const upload = require("../middleware/uploadMiddleware");
const router = express.Router();

// Public routes (no authentication required)
router.get("/project/:projectId", getComponentsByProjectId);
router.get("/:id", getComponentById);
router.get("/:componentId/files", getComponentFiles);
router.get("/qr/:id", getComponentById);
router.get("/:id/project-details", getProjectDetailsByComponentId);
router.put("/:id", updateComponent);
router.put("/:id/status", updateComponentStatus);

router.put("/:id/status-auth", auth, updateComponentStatusAuth);

// Protected routes (authentication required)
router.use(auth);
router.post("/", uploadFileMiddleware, addComponent);
router.post("/componentHistory", addComponentHistory);
router.put(
  "/:componentId/files/:revision",
  upload.single("file"),
  updateFileInRevision
);
router.delete("/:componentId/files/:revision", deleteFileRevision);
router.delete("/:id", deleteComponent);
router.post(
  "/:componentId/upload-file",
  upload.single("file"),
  uploadComponentFile
);
router.post("/precast", uploadFileMiddleware, addPrecastComponent);
router.post("/batch", addComponentsBatch);

module.exports = router;
