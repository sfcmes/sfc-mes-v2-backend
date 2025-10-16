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

const queryAssignProjectsToUser = async (userId, projectIds) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM user_projects WHERE user_id = $1', [userId]);

    if (projectIds && projectIds.length > 0) {
      const values = projectIds.map((_, idx) => `($1, $${idx + 2})`).join(',');
      const query = `
        INSERT INTO user_projects (user_id, project_id)
        VALUES ${values}
        ON CONFLICT (user_id, project_id) DO NOTHING
      `;
      await client.query(query, [userId, ...projectIds]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in queryAssignProjectsToUser:', error);
    throw error;
  } finally {
    client.release();
  }
};

const queryGetUserByUsernameWithRole = async (username) => {
  const query = `
    SELECT users.*, roles.name as role_name 
    FROM users 
    JOIN roles ON users.role_id = roles.id 
    WHERE users.username = $1
  `;
  const values = [username];
  console.log("Executing query:", query, "with username:", username);
  const { rows } = await db.query(query, values);
  return rows[0];
};

// userQueries.js
const getUserProjects = async (userId) => {
  const query = `
    SELECT DISTINCT 
      p.id as project_id,
      p.name,
      p.project_code
    FROM projects p
    INNER JOIN user_projects up ON p.id = up.project_id
    WHERE up.user_id = $1
  `;
  
  try {
    const { rows } = await db.query(query, [userId]);
    return {
      success: true,
      data: rows,
      count: rows.length
    };
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

// const assignProjectsToUser = async (req, res) => {
//   const { userId } = req.params;
//   const { projectIds } = req.body;
  
//   if (!Array.isArray(projectIds)) {
//     return res.status(400).json({ error: 'projectIds must be an array' });
//   }

//   try {
//     await queryAssignProjectsToUser(userId, projectIds);
    
//     // เปลี่ยนจาก queryGetUserProjects เป็น getUserProjects
//     const updatedProjects = await getUserProjects(userId);
    
//     res.json({
//       message: 'Projects assigned successfully',
//       projects: updatedProjects
//     });
//   } catch (error) {
//     console.error('Error assigning projects to user:', error);
//     res.status(500).json({ error: 'Failed to assign projects to user' });
//   }
// };

// const getUserProjects = async (userId) => {
//   const query = `
//     SELECT 
//       p.id, 
//       p.name,
//       p.project_code,
//       p.status
//     FROM projects p
//     INNER JOIN user_projects up ON p.id = up.project_id
//     WHERE up.user_id = $1
//   `;
//   try {
//     const { rows } = await db.query(query, [userId]);
//     return rows;
//   } catch (error) {
//     console.error('Error executing query', { 
//       text: query, 
//       userId, 
//       error: error.message 
//     });
//     throw new Error(`Failed to fetch user projects: ${error.message}`);
//   }
// };


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
  queryAssignProjectsToUser,
  queryGetUserByUsernameWithRole,
  getUserProjects,
};
