const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async create(username, password, email, roleId, status = 'Active') {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO Users (username, password_hash, email, role_id, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, role_id, status
    `;
    const values = [username, hashedPassword, email, roleId, status];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM Users WHERE username = $1';
    const result = await db.query(query, [username]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM Users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User;
