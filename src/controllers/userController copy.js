const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const {
  getAllUsers,
  createUser: queryCreateUser,
  updateUserById,
  deleteUserById,
  getUserById: queryGetUserById,
  getUserByEmail: queryGetUserByEmail,
  getRoles: queryGetRoles, // Ensure this import is correct
  queryGetUserByUsername,
  queryAssignProjectsToUser,
  queryGetUserByUsernameWithRole,
  getUserProjects: queryGetUserProjects,
} = require("../queries/userQueries");
const jwt = require("jsonwebtoken");

const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ error: "Error retrieving users" });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await queryGetUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({ error: "Error retrieving user" });
  }
};

const checkUsername = async (req, res) => {
  const { username } = req.body;
  try {
    const user = await queryGetUserByUsername(username);
    if (user) {
      res.json({ isValid: true });
    } else {
      res.json({ isValid: false });
    }
  } catch (error) {
    console.error("Error checking username:", error);
    res.status(500).json({ error: "Error checking username" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await queryGetUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role_name,
      status: user.status
    });
  } catch (error) {
    console.error("Error retrieving user profile:", error);
    res.status(500).json({ error: "Error retrieving user profile" });
  }
};


const getUserProfileById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await queryGetUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({ error: "Error retrieving user" });
  }
};

const createUser = async (req, res) => {
  const { username, password, email, roleId, projects } = req.body;
  const status = "Active";
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      id: uuidv4(),
      username,
      password_hash: hashedPassword,
      email,
      role_id: roleId,
      status,
    };
    const newUser = await queryCreateUser(userData);
    
    // Assign projects to the user
    if (projects && projects.length > 0) {
      await queryAssignProjectsToUser(newUser.id, projects);
    }
    
    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Error creating user" });
  }
};

// ส่วนที่ 1: ฟังก์ชันสำหรับดึงข้อมูลโดยตรง
const fetchUserProjectsData = async (userId) => {
  try {
    const projects = await queryGetUserProjects(userId);
    return projects;
  } catch (error) {
    console.error('Error fetching user projects:', error);
    throw error;
  }
};

// In userController.js

const getUserProjects = async (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({ 
      error: 'User ID is required',
      details: 'The userId parameter is missing from the request URL'
    });
  }

  try {
    // Use queryGetUserById instead of getUserById
    const userExists = await queryGetUserById(userId);
    if (!userExists) {
      return res.status(404).json({ 
        error: 'User not found',
        details: 'No user exists with the provided userId'
      });
    }

    const projects = await queryGetUserProjects(userId);
    
    res.json({
      success: true,
      data: projects || [],
      count: projects ? projects.length : 0
    });

  } catch (error) {
    console.error('Error fetching user projects:', {
      userId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Failed to fetch user projects',
      details: error.message
    });
  }
};

const assignProjectsToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { projectIds } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!Array.isArray(projectIds)) {
      return res.status(400).json({ error: 'projectIds must be an array' });
    }

    // First assign the projects
    await queryAssignProjectsToUser(userId, projectIds);
    
    // Then fetch the updated projects list
    const updatedProjects = await queryGetUserProjects(userId);
    
    res.json({
      message: 'Projects assigned successfully',
      projects: updatedProjects
    });
  } catch (error) {
    console.error('Error assigning projects to user:', error);
    res.status(500).json({ 
      error: 'Failed to assign projects to user',
      details: error.message 
    });
  }
};


const getUserProjectsHandler = async (req, res) => {
  const { userId } = req.params;
  try {
    const projects = await getUserProjects(userId);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ error: 'Failed to fetch user projects' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, roleId, status } = req.body;
  const updatedUserData = {
    username,
    email,
    roleId,
    status,
  };
  try {
    const updatedUser = await updateUserById(id, updatedUserData);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Error updating user" });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedUser = await deleteUserById(id);
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully", user: deletedUser });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Error deleting user" });
  }
};
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await db.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    res.json({ token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await queryGetRoles();
    res.json(roles);
  } catch (error) {
    console.error("Error retrieving roles:", error);
    res.status(500).json({ error: "Error retrieving roles" });
  }
};

const getUserByUsername = async (username) => {
  const query = 'SELECT * FROM users WHERE username = $1';
  const values = [username];
  const result = await db.query(query, values);
  return result.rows[0];
};

const checkUsernameAndRole = async (req, res) => {
  const { username } = req.body;
  try {
    const user = await queryGetUserByUsernameWithRole(username);
    if (user) {
      res.json({ 
        isValid: true, 
        role: user.role_name 
      });
    } else {
      res.json({ 
        isValid: false, 
        role: null 
      });
    }
  } catch (error) {
    console.error("Error checking username and role:", error);
    res.status(500).json({ error: "Error checking username and role" });
  }
};

module.exports = {
  loginUser,
  getUserProfile,
  getUserProfileById,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getRoles, // Export the new function
  checkUsername, // Export the new function
  getUserByUsername,
  assignProjectsToUser,
  checkUsernameAndRole,
  getUserProjects,
  // getUserProjects: getUserProjectsHandler,
};
