const db = require('../config/database');

const getAllRoles = async () => {
    const query = 'SELECT * FROM roles';
    const { rows } = await db.query(query);
    return rows;
};

const getRoleById = async (id) => {
    const query = 'SELECT * FROM roles WHERE id = $1';
    const { rows } = await db.query(query, [id]);
    return rows[0];
};

const createRole = async (roleData) => {
    const { name, description } = roleData;
    const query = 'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *';
    const values = [name, description];
    const { rows } = await db.query(query, values);
    return rows[0];
};

const updateRoleById = async (id, roleData) => {
    const { name, description } = roleData;
    const query = 'UPDATE roles SET name = $1, description = $2 WHERE id = $3 RETURNING *';
    const values = [name, description, id];
    const { rows } = await db.query(query, values);
    return rows[0];
};

const deleteRoleById = async (id) => {
    const query = 'DELETE FROM roles WHERE id = $1 RETURNING *';
    const { rows } = await db.query(query, [id]);
    return rows[0];
};

module.exports = {
    getAllRoles,
    getRoleById,
    createRole,
    updateRoleById,
    deleteRoleById,
};
