const db = require("../config/database");

const createSection = async (sectionData) => {
    const { id, name, project_id, status, created_at, updated_at } = sectionData;
    const query = `
        INSERT INTO Sections (id, name, project_id, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const values = [id, name, project_id, status, created_at, updated_at];
    const result = await db.query(query, values);
    return result.rows[0];
};

const getSectionsByProjectId = async (projectId) => {
    const query = `
        SELECT 
            s.*
        FROM 
            sections s
        WHERE 
            s.project_id = $1
        ORDER BY 
            s.name;
    `;
    const result = await db.query(query, [projectId]);
    return result.rows;
};

const getAllSections = async () => {
    const query = `
        SELECT s.*, p.name as project_name, COUNT(c.id) as components
        FROM Sections s
        JOIN Projects p ON s.project_id = p.id
        LEFT JOIN Components c ON s.id = c.section_id
        GROUP BY s.id, p.name;
    `;
    const result = await db.query(query);
    return result.rows;
};

const getSectionByIdFromDb = async (sectionId) => {
    const query = 'SELECT * FROM Sections WHERE id = $1';
    const { rows } = await db.query(query, [sectionId]);
    return rows[0];
};

const updateSection = async (sectionId, updatedData) => {
    const { name, project_id, status, updated_at } = updatedData;
    const query = `
      UPDATE Sections
      SET name = $2, project_id = $3, status = $4, updated_at = $5
      WHERE id = $1
      RETURNING *;
    `;
    const values = [sectionId, name, project_id, status, updated_at];
    const result = await db.query(query, values);
    return result.rows[0];
};

const deleteSection = async (sectionId) => {
    const query = 'DELETE FROM Sections WHERE id = $1 RETURNING *;';
    const result = await db.query(query, [sectionId]);
    return result.rows[0];
};

const getSectionByNameAndProjectId = async (name, projectId) => {
    const query = 'SELECT * FROM Sections WHERE name = $1 AND project_id = $2';
    const result = await db.query(query, [name, projectId]);
    return result.rows[0];
};



module.exports = {
    createSection,
    getSectionsByProjectId,
    getAllSections,
    getSectionByIdFromDb,
    updateSection,
    deleteSection,
    getSectionByNameAndProjectId,
};
