const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  checkUsername,
  assignProjectsToUser,
  checkUsernameAndRole,
  getUserProjects,
} = require("../controllers/userController");
const auth = require("../middleware/auth");

// Public routes
router.post("/check-username", checkUsername);
router.post("/check-username-and-role", checkUsernameAndRole);

// Protected routes
router.get("/roles", getRoles);
router.get("/me", auth, getUserProfile);
router.get("/", getUsers);

// User CRUD and project management routes
router.post("/", createUser);
router.get("/:userId/projects", auth, getUserProjects); // Move before generic :id route
router.post("/:userId/projects", auth, assignProjectsToUser); // Move before generic :id route
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;