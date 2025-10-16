const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const {
  createUser,
  findUserByEmail,
  findUserByUsername,
} = require("../queries/userQueries");

const getEndOfDayBangkok = () => {
  const now = new Date();
  const bangkokTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );
  return new Date(
    bangkokTime.getFullYear(),
    bangkokTime.getMonth(),
    bangkokTime.getDate() + 1
  );
};

const register = async (req, res) => {
  const { email, username, password, role_id } = req.body;

  try {
    const existingUserByEmail = await findUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const existingUserByUsername = await findUserByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      id: uuidv4(),
      username,
      password_hash: hashedPassword,
      email,
      role_id,
      status: "Active",
    };

    const user = await createUser(userData);
    res
      .status(201)
      .json({
        message: "User created successfully",
        user: { id: user.id, email: user.email, username: user.username },
      });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Error creating user" });
  }
};

const login = async (req, res) => {
  console.log("Login attempt:", { emailOrUsername: req.body.emailOrUsername });
  const { emailOrUsername, password } = req.body;

  try {
    let user;
    if (emailOrUsername.includes("@")) {
      user = await findUserByEmail(emailOrUsername);
      console.log("User found by email:", user ? "Yes" : "No");
    } else {
      user = await findUserByUsername(emailOrUsername);
      console.log("User found by username:", user ? "Yes" : "No");
    }

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      console.log("Invalid password attempt for user:", user.username);
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    console.log("Token generated:", token);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role_id: user.role_id,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Error logging in" });
  }
};

const refreshToken = async (req, res) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const endOfDay = getEndOfDayBangkok();
    const expiresIn = Math.floor((endOfDay - new Date()) / 1000); // in seconds

    const newToken = jwt.sign(
      { id: decoded.id, email: decoded.email, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: expiresIn }
    );

    console.log(
      `Token refreshed at ${new Date().toISOString()} (UTC), expires at ${endOfDay.toISOString()} (Bangkok time)`
    );

    res.json({ token: newToken, expiresAt: endOfDay.toISOString() });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token has expired, please log in again" });
    }
    res.status(401).json({ message: "Invalid token" });
  }
};

const checkToken = async (req, res) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ isValid: false, message: "No token provided" });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ isValid: true });
  } catch (err) {
    res.json({ isValid: false, message: "Invalid token" });
  }
};

module.exports = { register, login, refreshToken, checkToken };
