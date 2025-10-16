const express = require('express');
const router = express.Router();
const { getRoles, getRoleById, createRole, updateRole, deleteRole } = require('../controllers/roleController');

// GET all roles
router.get('/', getRoles);

// GET role by ID
router.get('/:id', getRoleById);

// POST create a new role
router.post('/', createRole);

// PUT update an existing role
router.put('/:id', updateRole);

// DELETE a role
router.delete('/:id', deleteRole);

module.exports = router;
