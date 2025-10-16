const db = require("../config/database");

const getAllUsers = async () => {
  const query = "SELECT * FROM users";
  console.log("Executing query:", query);
  const { rows } = await db.query(query);
  return rows;
};

const getUserById = async (id) => {
  const query = `
    SELECT users.*, roles.name as role_name 
    FROM users 
    JOIN roles ON users.role_id = roles.id 
    WHERE users.id = $1
  `;
  const values = [id];

  try {
    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      throw new Error("User not found");
    }
    return result.rows[0];
  } catch (error) {
    console.error("Error retrieving user by ID:", error);
    throw error;
  }
};

const findUserByEmail = async (email) => {
  const query = "SELECT * FROM users WHERE email = $1";
  console.log(
    `Executing query: SELECT * FROM users WHERE email = $1 with email: ${email}`
  );
  const { rows } = await db.query(query, [email]);
  return rows[0];
};

const findUserByUsername = async (username) => {
  const query = "SELECT * FROM users WHERE username = $1";
  console.log("Executing query:", query, "with username:", username);
  const { rows } = await db.query(query, [username]);
  return rows[0];
};

const createUser = async (userData) => {
    const { id, username, password_hash, email, role_id, status } = userData;
    const query = 'INSERT INTO users (id, username, password_hash, email, role_id, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *';
    const values = [id, username, password_hash, email, role_id, status];
    const { rows } = await db.query(query, values);
    return rows[0];
  };

const updateUserById = async (id, userData) => {
  const { username, email, roleId, status } = userData;
  const query =
    "UPDATE users SET username = $1, email = $2, role_id = $3, status = $4 WHERE id = $5 RETURNING *";
  const values = [username, email, roleId, status, id];
  console.log("Executing query:", query, "with values:", values);
  const { rows } = await db.query(query, values);
  return rows[0];
};

const deleteUserById = async (id) => {
  const query = "DELETE FROM users WHERE id = $1 RETURNING *";
  console.log("Executing query:", query, "with id:", id);
  const { rows } = await db.query(query, [id]);
  return rows[0];
};

const getRoles = async () => {
  const query = "SELECT id, name FROM roles";
  const { rows } = await db.query(query);
  return rows;
};

const queryGetUserByUsername = async (username) => {
  const query = "SELECT * FROM users WHERE username = $1";
  console.log("Executing query:", query, "with username:", username);
  const { rows } = await db.query(query, [username]);
  return rows[0];
};


module.exports = {
  getAllUsers,
  getUserById,
  findUserByEmail,
  findUserByUsername,
  createUser,
  updateUserById,
  deleteUserById,
  getRoles,
  queryGetUserByUsername,
};
