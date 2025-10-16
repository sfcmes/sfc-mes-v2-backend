const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

const getAllProjects = async () => {
  const query = `
    SELECT 
        p.id, 
        p.name, 
        p.project_code AS project_code, 
        p.created_by, 
        p.created_at, 
        p.updated_at,
        COALESCE(AVG(section_progress.progress), 0) AS progress,
        COUNT(DISTINCT s.id) AS sections,
        COUNT(c.id) AS components,
        CASE 
            WHEN COUNT(DISTINCT s.id) = 0 THEN 'planning'
            WHEN SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) = COUNT(DISTINCT s.id) AND COUNT(DISTINCT s.id) > 0 THEN 'completed'
            ELSE 'in_progress'
        END as status
    FROM projects p
    LEFT JOIN sections s ON p.id = s.project_id
    LEFT JOIN (
        SELECT 
            c.section_id, 
            COUNT(c.id) AS total_components, 
            SUM(CASE WHEN csh.status = 'Installed' THEN 1 ELSE 0 END) * 100.0 / COUNT(c.id) AS progress
        FROM components c
        LEFT JOIN (
            SELECT 
                csh.component_id, 
                MAX(csh.updated_at) AS latest_update
            FROM component_status_history csh
            WHERE csh.status = 'Installed'
            GROUP BY csh.component_id
        ) latest_status ON c.id = latest_status.component_id
        LEFT JOIN component_status_history csh ON c.id = csh.component_id AND csh.updated_at = latest_status.latest_update
        GROUP BY c.section_id
    ) section_progress ON s.id = section_progress.section_id
    LEFT JOIN components c ON s.id = c.section_id
    GROUP BY p.id
  `;
  try {
    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error("Error executing getAllProjects query:", error);
    throw error;
  }
};

const getAllProjectsWithoutOther = async () => {
  const query = `
    SELECT 
        p.id, 
        p.name, 
        p.project_code AS project_code, 
        p.created_by, 
        p.created_at, 
        p.updated_at,
        COALESCE(AVG(section_progress.progress), 0) AS progress,
        COUNT(DISTINCT s.id) AS sections,
        COUNT(c.id) AS components,
        CASE 
            WHEN COUNT(DISTINCT s.id) = 0 THEN 'planning'
            WHEN SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) = COUNT(DISTINCT s.id) AND COUNT(DISTINCT s.id) > 0 THEN 'completed'
            ELSE 'in_progress'
        END as status
    FROM projects p
    LEFT JOIN sections s ON p.id = s.project_id
    LEFT JOIN (
        SELECT 
            c.section_id, 
            COUNT(c.id) AS total_components, 
            SUM(CASE WHEN csh.status = 'Installed' THEN 1 ELSE 0 END) * 100.0 / COUNT(c.id) AS progress
        FROM components c
        LEFT JOIN (
            SELECT 
                csh.component_id, 
                MAX(csh.updated_at) AS latest_update
            FROM component_status_history csh
            WHERE csh.status = 'Installed'
            GROUP BY csh.component_id
        ) latest_status ON c.id = latest_status.component_id
        LEFT JOIN component_status_history csh ON c.id = csh.component_id AND csh.updated_at = latest_status.latest_update
        GROUP BY c.section_id
    ) section_progress ON s.id = section_progress.section_id
    LEFT JOIN components c ON s.id = c.section_id
    GROUP BY p.id
  `;
  try {
    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error("Error executing getAllProjects query:", error);
    throw error;
  }
};

const getProjectById = async (id) => {
  const query = `
    SELECT 
      p.id, p.name, p.project_code,
      s.id AS section_id, s.name AS section_name, s.status AS section_status,
      c.id AS component_id, c.name AS component_name, c.type AS component_type,
      c.width, c.height, c.thickness, c.extension, c.reduction, c.area, c.volume,
      csh.status AS component_status
    FROM projects p
    LEFT JOIN sections s ON p.id = s.project_id
    LEFT JOIN components c ON s.id = c.section_id
    LEFT JOIN (
      SELECT DISTINCT ON (component_id) 
        component_id, status
      FROM component_status_history
      ORDER BY component_id, updated_at DESC
    ) csh ON c.id = csh.component_id
    WHERE p.id = $1
    ORDER BY s.name, c.name
  `;

  try {
    const { rows } = await db.query(query, [id]);
    if (rows.length === 0) return null;

    const project = {
      id: rows[0].id,
      name: rows[0].name,
      project_code: rows[0].project_code,
      sections: [],
    };

    rows.forEach((row) => {
      let section = project.sections.find((s) => s.id === row.section_id);
      if (!section) {
        section = {
          id: row.section_id,
          name: row.section_name,
          status: row.section_status,
          components: [],
        };
        project.sections.push(section);
      }

      if (row.component_id) {
        section.components.push({
          id: row.component_id,
          name: row.component_name,
          type: row.component_type,
          width: row.width,
          height: row.height,
          thickness: row.thickness,
          extension: row.extension,
          reduction: row.reduction,
          area: row.area,
          volume: row.volume,
          status: row.component_status,
        });
      }
    });

    return project;
  } catch (error) {
    console.error("Error executing getProjectById query:", error);
    throw error;
  }
};

const createProject = async (projectData) => {
  const { name, project_code, created_by } = projectData;
  const id = projectData.id || uuidv4();
  const query =
    "INSERT INTO Projects (id, name, project_code, created_by) VALUES ($1, $2, $3, $4) RETURNING *";
  const values = [id, name, project_code, created_by];
  const { rows } = await db.query(query, values);
  return rows[0];
};

const updateProjectById = async (id, projectData) => {
  const { name, project_code } = projectData;
  const query =
    "UPDATE Projects SET name = $2, project_code = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *";
  const values = [id, name, project_code];
  const { rows } = await db.query(query, values);
  return rows[0];
};

const checkProjectExists = async (projectId) => {
  const query = "SELECT EXISTS(SELECT 1 FROM Projects WHERE id = $1)";
  const result = await db.query(query, [projectId]);
  return result.rows[0].exists;
};

const addProjectImage = async (projectId, imageUrl) => {
  const query = `
    INSERT INTO project_images (project_id, image_url)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const values = [projectId, imageUrl];
  try {
    const { rows } = await db.query(query, values);
    return rows[0];
  } catch (error) {
    console.error("Error inserting project image:", error);
    throw error;
  }
};

const getProjectImages = async (projectId) => {
  const query = `
    SELECT * FROM project_images
    WHERE project_id = $1;
  `;
  try {
    const { rows } = await db.query(query, [projectId]);
    return rows;
  } catch (error) {
    console.error("Error fetching project images:", error);
    throw error;
  }
};

const deleteProjectImage = async (projectId, imageId) => {
  const query =
    "DELETE FROM project_images WHERE project_id = $1 AND id = $2 RETURNING *";
  const values = [projectId, imageId];
  try {
    const { rows } = await db.query(query, values);
    return rows[0]; // This will return the deleted record, or undefined if no record was found
  } catch (error) {
    console.error("Error deleting project image from database:", error);
    throw error;
  }
};

const deleteProjectById = async (projectId) => {
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    console.log(`Starting deletion process for project ${projectId}`);

    // Delete from component_files
    await client.query(
      `
      DELETE FROM component_files
      WHERE component_id IN (
        SELECT c.id
        FROM components c
        JOIN sections s ON c.section_id = s.id
        WHERE s.project_id = $1
      )
    `,
      [projectId]
    );
    console.log("Deleted related component_files");

    // Delete from componentfiles
    await client.query(
      `
      DELETE FROM componentfiles
      WHERE component_id IN (
        SELECT c.id
        FROM components c
        JOIN sections s ON c.section_id = s.id
        WHERE s.project_id = $1
      )
    `,
      [projectId]
    );
    console.log("Deleted related componentfiles");

    // Delete componentactivities (if this table exists in your schema)
    await client.query(
      `
      DELETE FROM componentactivities
      WHERE component_id IN (
        SELECT c.id
        FROM components c
        JOIN sections s ON c.section_id = s.id
        WHERE s.project_id = $1
      )
    `,
      [projectId]
    );
    console.log("Deleted related componentactivities");

    // Delete component_status_history entries
    await client.query(
      `
      DELETE FROM component_status_history
      WHERE component_id IN (
        SELECT c.id
        FROM components c
        JOIN sections s ON c.section_id = s.id
        WHERE s.project_id = $1
      )
    `,
      [projectId]
    );
    console.log("Deleted component status history");

    // Delete components
    await client.query(
      `
      DELETE FROM components
      WHERE section_id IN (
        SELECT id FROM sections WHERE project_id = $1
      )
    `,
      [projectId]
    );
    console.log("Deleted components");

    // Delete sections
    await client.query("DELETE FROM sections WHERE project_id = $1", [
      projectId,
    ]);
    console.log("Deleted sections");

    // Delete project images
    await client.query("DELETE FROM project_images WHERE project_id = $1", [
      projectId,
    ]);
    console.log("Deleted project images");

    // Finally, delete the project itself
    const result = await client.query(
      "DELETE FROM projects WHERE id = $1 RETURNING *",
      [projectId]
    );
    console.log("Deleted project");

    await client.query("COMMIT");
    console.log(`Successfully deleted project ${projectId}`);

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting project:", error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProjectById,
  checkProjectExists,
  addProjectImage,
  getProjectImages,
  deleteProjectById,
  deleteProjectImage,
  getAllProjectsWithoutOther,
};
