const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

const createComponentInDb = async (componentData) => {
  const query = `
      INSERT INTO components 
      (id, section_id, name, type, width, height, thickness, extension, reduction, area, volume, weight, status)
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
  `;
  const values = [
    componentData.id,
    componentData.section_id,
    componentData.name,
    componentData.type || null,
    componentData.width || null,
    componentData.height || null,
    componentData.thickness || null,
    componentData.extension || null,
    componentData.reduction || null,
    componentData.area || null,
    componentData.volume || null,
    componentData.weight || null,
    componentData.status || "planning",
  ];

  try {
    const { rows } = await db.query(query, values);
    return rows[0];
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
};

const getComponentsBySectionId = async (sectionId) => {
  const query = "SELECT * FROM components WHERE section_id = $1";
  const { rows } = await db.query(query, [sectionId]);
  return rows;
};

const addComponentHistory = async ({ component_id, status, updated_by }) => {
  if (!status) {
    console.warn("Attempted to add component history without status");
    return;
  }

  const query = `
    INSERT INTO component_status_history 
    (id, component_id, status, updated_by, updated_at, created_at)
    VALUES ($1, $2, $3, $4, $5, $6);
  `;

  const id = uuidv4();
  const now = new Date();
  const values = [id, component_id, status, updated_by, now, now];

  try {
    await db.query(query, values);
  } catch (error) {
    console.error("Error executing history query:", error);
    throw error;
  }
};

const addComponentFile = async (componentId, fileUrl) => {
  const query = `
    INSERT INTO component_files (id, component_id, s3_url, revision)
    VALUES ($1, $2, $3, (SELECT COALESCE(MAX(revision), 0) + 1 FROM component_files WHERE component_id = $2))
    RETURNING *;
  `;
  const values = [uuidv4(), componentId, fileUrl];

  try {
    const { rows } = await db.query(query, values);
    return rows[0];
  } catch (error) {
    console.error("Error adding component file:", error);
    throw error;
  }
};

const checkComponentExists = async (name, sectionId) => {
  const query = `
        SELECT 1
        FROM Components
        WHERE name = $1 AND section_id = $2;
    `;
  const values = [name, sectionId];
  try {
    const { rows } = await db.query(query, values);
    return rows.length > 0;
  } catch (error) {
    console.error("Error checking component existence:", error);
    throw error;
  }
};

// const updateComponentFilePath = async (componentId, filePath) => {
//     const query = `
//         UPDATE components
//         SET file_path = $1
//         WHERE id = $2
//         RETURNING *;
//     `;
//     const values = [filePath, componentId];

//     try {
//         const { rows } = await db.query(query, values);
//         return rows[0];
//     } catch (error) {
//         console.error('Error updating component file path:', error);
//         throw error;
//     }
// };

const updateComponentInDb = async (id, updateData) => {
  const fields = [
    "name",
    "type",
    "width",
    "height",
    "thickness",
    "extension",
    "reduction",
    "area",
    "volume",
    "weight",
    "status",
  ];
  const updates = [];
  const values = [];
  let paramCount = 1;

  fields.forEach((field) => {
    if (updateData[field] !== undefined) {
      updates.push(`${field} = $${paramCount}`);
      values.push(updateData[field]);
      paramCount++;
    }
  });

  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE components
    SET ${updates.join(", ")}
    WHERE id = $${paramCount}
    RETURNING *;
  `;
  values.push(id);

  try {
    const { rows } = await db.query(query, values);
    return rows[0];
  } catch (error) {
    console.error("Error updating component in database:", error);
    throw error;
  }
};

const getComponentsByProjectId = async (projectId) => {
  const query = `
    SELECT c.*, s.name AS section_name
    FROM components c
    JOIN sections s ON c.section_id = s.id
    WHERE s.project_id = $1
    ORDER BY s.name, c.name;
  `;
  try {
    const { rows } = await db.query(query, [projectId]);
    return rows;
  } catch (error) {
    console.error("Error fetching components:", error);
    throw error;
  }
};
const getComponentFiles = async (componentId) => {
  if (!componentId) {
    throw new Error("Component ID is required");
  }
  const query = `SELECT * FROM component_files WHERE component_id = $1 ORDER BY revision DESC;`;
  try {
    const { rows } = await db.query(query, [componentId]);
    return rows;
  } catch (error) {
    console.error("Error fetching component files:", error);
    throw error;
  }
};

const updateComponentFilePath = async (componentId, fileUrl) => {
  const query = `
    UPDATE component_files 
    SET s3_url = $1 
    WHERE component_id = $2 AND revision = (
      SELECT MAX(revision) 
      FROM component_files 
      WHERE component_id = $2
    )
    RETURNING *;
  `;
  const values = [fileUrl, componentId];

  try {
    const { rows } = await db.query(query, values);
    return rows[0];
  } catch (error) {
    console.error("Error updating component file path:", error);
    throw error;
  }
};
const deleteComponentFileRevision = async (componentId, revision) => {
  const query = `DELETE FROM component_files WHERE component_id = $1 AND revision = $2 RETURNING *;`;
  try {
    const { rows } = await db.query(query, [componentId, revision]);
    return rows[0];
  } catch (error) {
    console.error("Error deleting component file revision:", error);
    throw error;
  }
};

const getLatestRevision = async (componentId) => {
  const query = `
    SELECT MAX(revision) as max_revision
    FROM component_files
    WHERE component_id = $1;
  `;
  const { rows } = await db.query(query, [componentId]);
  return rows[0].max_revision || 0;
};

const insertComponentFile = async ({
  id,
  component_id,
  s3_url,
  revision,
  file_name,
}) => {
  const query = `
    INSERT INTO component_files (id, component_id, s3_url, revision, file_name)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [id, component_id, s3_url, revision, file_name];

  try {
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error inserting component file:", error);
    throw error;
  }
};

const getComponentNameById = async (componentId) => {
  const query = "SELECT name FROM components WHERE id = $1";
  const { rows } = await db.query(query, [componentId]);
  return rows[0]?.name;
};

const getSectionByName = async (sectionName, projectId, client) => {
  const query = 'SELECT * FROM sections WHERE name = $1 AND project_id = $2';
  try {
    const { rows } = await client.query(query, [sectionName, projectId]);
    console.log('getSectionByName result:', rows);
    return rows[0];
  } catch (error) {
    console.error('Error in getSectionByName:', error);
    throw error;
  }
};
const createSection = async (sectionData, client) => {
  const query = `
    INSERT INTO sections (id, project_id, name, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [uuidv4(), sectionData.project_id, sectionData.name, 'planning'];
  try {
    const { rows } = await client.query(query, values);
    console.log('createSection result:', rows[0]);
    return rows[0];
  } catch (error) {
    console.error('Error in createSection:', error);
    throw error;
  }
};

const getUserIdByUsername = async (username, client) => {
  const query = 'SELECT id FROM users WHERE username = $1';
  const { rows } = await client.query(query, [username]);
  if (rows.length === 0) {
    throw new Error(`User not found with username: ${username}`);
  }
  return rows[0].id;
};

// const updateComponentStatusInDb = async (id, status, username) => {
//   const client = await db.getClient();

//   try {
//     await client.query('BEGIN');

//     // Update the component status
//     const updateQuery = `
//       UPDATE components
//       SET status = $1, updated_at = CURRENT_TIMESTAMP
//       WHERE id = $2
//       RETURNING *;
//     `;
//     const { rows } = await client.query(updateQuery, [status, id]);

//     if (rows.length === 0) {
//       await client.query('ROLLBACK');
//       return null;
//     }

//     // Get the user's ID
//     const userId = await getUserIdByUsername(username, client);

//     // Add a new entry to the component status history
//     const historyQuery = `
//       INSERT INTO component_status_history (id, component_id, status, updated_by, updated_at, created_at)
//       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
//     `;
//     await client.query(historyQuery, [uuidv4(), id, status, userId]);

//     await client.query('COMMIT');
//     return rows[0];
//   } catch (error) {
//     await client.query('ROLLBACK');
//     console.error("Error updating component status in database:", error);
//     throw error;
//   } finally {
//     client.release();
//   }
// };
const updateComponentStatusInDb = async (id, status, userIdentifier) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Update the component status
    const updateQuery = `
      UPDATE components
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;
    const { rows } = await client.query(updateQuery, [status, id]);

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    let userId;
    if (typeof userIdentifier === 'string' && userIdentifier.length < 36) {
      // It's a username, get the user ID
      userId = await getUserIdByUsername(userIdentifier, client);
    } else {
      // It's already a user ID
      userId = userIdentifier;
    }

    // Add a new entry to the component status history
    const historyQuery = `
      INSERT INTO component_status_history (id, component_id, status, updated_by, updated_at, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    `;
    await client.query(historyQuery, [uuidv4(), id, status, userId]);

    await client.query('COMMIT');
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error updating component status in database:", error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createComponentInDb,
  getComponentsBySectionId,
  addComponentHistory,
  checkComponentExists,
  insertComponentFile,
  updateComponentFilePath,
  updateComponentInDb,
  getComponentsByProjectId,
  getComponentFiles,
  deleteComponentFileRevision,
  getLatestRevision,
  getComponentNameById,
  addComponentFile,
  getSectionByName,
  createSection,
  updateComponentStatusInDb,
};
