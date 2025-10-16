const { getAllRoles, getRoleById, createRole, updateRoleById, deleteRoleById } = require('../queries/roleQueries');

// GET all roles
const getRoles = async (req, res) => {
    try {
        const roles = await getAllRoles();
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving roles' });
    }
};

// GET role by ID
const getRoleById = async (req, res) => {
    const { id } = req.params;
    try {
        const role = await getRoleById(id);
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }
        res.json(role);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving role' });
    }
};

// POST create a new role
const createRole = async (req, res) => {
    const { name, description } = req.body;
    const roleData = {
        name,
        description
    };
    try {
        const newRole = await createRole(roleData);
        res.status(201).json({ message: 'Role created successfully', role: newRole });
    } catch (error) {
        res.status(500).json({ error: 'Error creating role' });
    }
};

// PUT update an existing role
const updateRole = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const updatedRoleData = {
        name,
        description
    };
    try {
        const updatedRole = await updateRoleById(id, updatedRoleData);
        if (!updatedRole) {
            return res.status(404).json({ error: 'Role not found' });
        }
        res.json({ message: 'Role updated successfully', role: updatedRole });
    } catch (error) {
        res.status(500).json({ error: 'Error updating role' });
    }
};

// DELETE a role
const deleteRole = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedRole = await deleteRoleById(id);
        if (!deletedRole) {
            return res.status(404).json({ error: 'Role not found' });
        }
        res.json({ message: 'Role deleted successfully', role: deletedRole });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting role' });
    }
};

module.exports = {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
};
