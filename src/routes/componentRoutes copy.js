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
  uploadComponentFile,
  addOtherComponent,
  getOtherComponentsByProjectId,
  updateOtherComponent,
  deleteOtherComponent,
  addPrecastComponent,
} = require("../controllers/componentController");
const auth = require("../middleware/auth");
const upload = require("../middleware/uploadMiddleware");
const router = express.Router();

router.post("/", auth, uploadFileMiddleware, addComponent);
router.get("/", getComponents);
router.get("/project/:projectId", getComponentsByProjectId);
router.get("/:id", getComponentById);
router.post("/componentHistory", auth, addComponentHistory);
router.put("/:id", auth, updateComponent);
router.get("/:componentId/files", auth, getComponentFiles);
router.put(
  "/:componentId/files/:revision",
  auth,
  upload.single("file"),
  updateFileInRevision
);
router.delete("/:componentId/files/:revision", auth, deleteFileRevision);

// Update this route to include the componentId parameter

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

// router.post("/other", auth, addOtherComponent);
// router.get("/other/project/:projectId", auth, getOtherComponentsByProjectId);
// router.put("/other/:id", auth, updateOtherComponent);
// router.delete("/other/:id", auth, deleteOtherComponent);

module.exports = router;
