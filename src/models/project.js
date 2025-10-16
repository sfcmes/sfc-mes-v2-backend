// src/models/project.js
const db = require('../config/database');

class Project {
  static async create(name, description, createdBy) {
    const query = `
      INSERT INTO Projects (name, description, created_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [name, description, createdBy];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM Projects WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, name, description) {
    const query = `
      UPDATE Projects
      SET name = $2, description = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const values = [id, name, description];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM Projects WHERE id = $1';
    await db.query(query, [id]);
  }

  static async findAll() {
    const query = 'SELECT * FROM Projects';
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = Project;