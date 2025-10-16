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
} = require("../controllers/componentController");
const {
  getProjectDetailsByComponentId,
} = require("../controllers/projectController");
const auth = require("../middleware/auth");
const upload = require("../middleware/uploadMiddleware");
const router = express.Router();

router.post("/", auth, uploadFileMiddleware, addComponent);
router.get("/", getComponents);
router.get("/project/:projectId", getComponentsByProjectId);
router.get("/:id", getComponentById);
router.post("/componentHistory", auth, addComponentHistory);
router.put("/:id", updateComponent);
router.get("/:componentId/files", getComponentFiles);
router.put(
  "/:componentId/files/:revision",
  auth,
  upload.single("file"),
  updateFileInRevision
);
router.delete("/:componentId/files/:revision", auth, deleteFileRevision);

router.post(
  "/:componentId/upload-file",
  auth,
  upload.single("file"),
  uploadComponentFile
);
router.delete(
  "/components/:componentId/files/:revision",
  auth,
  deleteFileRevision
);

// Route for adding a Precast component
router.post("/precast", auth, uploadFileMiddleware, addPrecastComponent);

// New route for batch upload
router.post("/batch", auth, addComponentsBatch);

router.get("/public/:id", getComponentById);
router.get("/qr/:id", getComponentById);
router.get("/:id", getComponentById);
// New route for fetching project details by component ID
router.get('/components/:id/project-details', getProjectDetailsByComponentId);

module.exports = router;
