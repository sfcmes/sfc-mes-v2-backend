const {
  createComponentInDb,
  addComponentHistory,
  checkComponentExists,
  insertComponentFile,
  updateComponentFilePath,
  updateComponentInDb,
  getLatestRevision,
  getComponentNameById,
  deleteComponentFileRevision,
  addComponentFile,
  getSectionByName,
  createSection,
  updateComponentStatusInDb,
} = require("../queries/componentQueries");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/database");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const multer = require("multer");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer();

const addComponent = async (req, res) => {
  // console.log("Received component data:", JSON.stringify(req.body, null, 2));

  const {
    section_id,
    name,
    type,
    width,
    height,
    thickness,
    extension,
    reduction,
    area,
    volume,
    weight,
    status,
  } = req.body;

  if (!section_id || !name) {
    return res
      .status(400)
      .json({ error: "Missing required fields: section_id and name" });
  }

  try {
    const componentExists = await checkComponentExists(name, section_id);
    if (componentExists) {
      return res.status(400).json({
        error: "A component with this name already exists in this section",
      });
    }

    const file = req.file;
    const fileName = file ? `${uuidv4()}.pdf` : null;
    let component, fileUrl, componentFile, updatedComponent;

    component = await createComponentInDb({
      id: uuidv4(),
      section_id,
      name,
      type,
      width: parseInt(width),
      height: parseInt(height),
      thickness: parseInt(thickness),
      extension: parseFloat(extension),
      reduction: parseFloat(reduction),
      area: parseFloat(area),
      volume: parseFloat(volume),
      weight: parseFloat(weight),
      status: status || "Planning",
    });

    if (file) {
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      const command = new PutObjectCommand(params);
      await s3.send(command);
      fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

      componentFile = await insertComponentFile({
        id: uuidv4(),
        component_id: component.id,
        s3_url: fileUrl,
        revision: 1,
      });

      updatedComponent = await updateComponentFilePath(component.id, fileUrl);
    } else {
      updatedComponent = component;
    }

    if (req.user) {
      await addComponentHistory({
        component_id: component.id,
        status: component.status,
        updated_by: req.user.id,
      });
    }

    res.status(201).json(updatedComponent);
  } catch (error) {
    console.error("Error in addComponent:", error);
    let errorMessage = "Internal Server Error";
    let statusCode = 500;

    if (error.code === "23505") {
      errorMessage = "A component with this name already exists";
      statusCode = 400;
    } else if (error.code === "23503") {
      errorMessage = "Invalid section ID";
      statusCode = 400;
    }

    if (component && !componentFile) {
      console.error(
        "Component created but file insertion failed. Manual cleanup may be required."
      );
    }

    res
      .status(statusCode)
      .json({ error: errorMessage, details: error.message });
  }
};

const uploadFileMiddleware = upload.single("file");

const getComponents = async (req, res) => {
  const { sectionId } = req.params;
  try {
    const components = await getComponentsBySectionId(sectionId);
    res.json(components);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving components" });
  }
};

const getComponentsByProjectId = async (req, res) => {
  const { projectId } = req.params;
  console.log(`Fetching components for project: ${projectId}`);
  try {
    const { rows } = await db.query(
      `
      SELECT c.*, s.name AS section_name
      FROM components c
      JOIN sections s ON c.section_id = s.id
      WHERE s.project_id = $1
      ORDER BY c.name;
    `,
      [projectId]
    );

    // Return empty array instead of 404
    res.json(rows); // Always return the rows array, even if empty

  } catch (error) {
    console.error("Error fetching components:", error);
    res.json([]); // Return empty array on error instead of error response
  }
};

const getComponentById = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      `
      SELECT c.*, cf.s3_url, cf.revision
      FROM components c
      LEFT JOIN component_files cf ON c.id = cf.component_id
      WHERE c.id = $1;
    `,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Component not found" });
    }

    const historyResult = await db.query(
      `
      SELECT status, updated_at, updated_by
      FROM component_status_history
      WHERE component_id = $1
      ORDER BY updated_at DESC;
    `,
      [id]
    );

    const component = rows[0];
    component.history = historyResult.rows;

    res.json(component);
  } catch (error) {
    console.error("Error fetching component:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addComponentHistoryEndpoint = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ error: "Unauthorized: User information missing" });
  }

  const { componentId, status } = req.body;

  if (!componentId || !status) {
    return res
      .status(400)
      .json({ error: "Missing required fields: componentId or status" });
  }

  try {
    await addComponentHistory({
      component_id: componentId,
      status,
      updated_by: req.user.id,
    });
    res.status(201).json({ message: "Component history added successfully" });
  } catch (error) {
    console.error("Error adding component history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateComponent = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    console.log("Updating component with data:", updateData);

    // Perform the update in the database
    const updatedComponent = await updateComponentInDb(id, updateData);
    
    if (!updatedComponent) {
      return res.status(404).json({ error: "Component not found" });
    }

    // Only add history if status is provided
    if (updateData.status) {
      const userId = req.user && req.user.id ? req.user.id : '5adf4796-a4d9-4f8f-bd7f-8e5f2696fb4b';
      
      await addComponentHistory({
        component_id: id,
        status: updateData.status,
        updated_by: userId,
      });
    }

    console.log("Updated component:", updatedComponent);
    res.json(updatedComponent);
  } catch (error) {
    console.error("Error updating component:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};


// Get all file revisions for a component
const getComponentFiles = async (req, res) => {
  const componentId = req.params.componentId;
  console.log(`Fetching files for component: ${componentId}`);
  if (!componentId) {
    return res.status(400).json({ error: "Component ID is required" });
  }
  try {
    const query = `SELECT * FROM component_files WHERE component_id = $1 ORDER BY revision DESC;`;
    const { rows } = await db.query(query, [componentId]);
    console.log(`Found ${rows.length} files for component ${componentId}`);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching component files:", error);
    res.status(500).json({
      error: "Failed to fetch component files",
      details: error.message,
    });
  }
};

const updateFileInRevision = async (req, res) => {
  const { componentId, revision } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file provided" });
  }

  try {
    const existingFile = await db.query(
      `SELECT * FROM component_files WHERE component_id = $1 AND revision = $2`,
      [componentId, revision]
    );

    if (existingFile.rows.length === 0) {
      return res.status(404).json({ error: "Revision not found" });
    }

    const oldFileUrl = existingFile.rows[0].s3_url;
    const oldFileName = oldFileUrl.split("/").pop();
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: oldFileName,
      })
    );

    const newFileName = `${uuidv4()}.pdf`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: newFileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const newFileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${newFileName}`;
    await db.query(
      `UPDATE component_files SET s3_url = $1 WHERE component_id = $2 AND revision = $3`,
      [newFileUrl, componentId, revision]
    );

    res.json({ message: "File updated successfully" });
  } catch (error) {
    console.error("Error updating file in revision:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateComponentWithFile = async (req, res) => {
  const { id } = req.params;
  const {
    status,
    name,
    width,
    height,
    thickness,
    extension,
    reduction,
    area,
    volume,
    weight,
    type,
  } = req.body;
  const file = req.file;

  if (!status) {
    return res.status(400).json({ error: "Missing required field: status" });
  }

  try {
    // Update component details
    const updateData = {
      status,
      name,
      width,
      height,
      thickness,
      extension,
      reduction,
      area,
      volume,
      weight,
      type,
    };
    const updatedComponent = await updateComponentInDb(id, updateData);

    if (!updatedComponent) {
      return res.status(404).json({ error: "Component not found" });
    }

    // Handle file upload if provided
    if (file) {
      const newFileName = `${uuidv4()}.pdf`;
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: newFileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      const newFileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${newFileName}`;
      const maxRevisionResult = await db.query(
        `SELECT MAX(revision) as max_revision FROM component_files WHERE component_id = $1`,
        [id]
      );
      const newRevision = (maxRevisionResult.rows[0].max_revision || 0) + 1;
      await insertComponentFile({
        id: uuidv4(),
        component_id: id,
        s3_url: newFileUrl,
        revision: newRevision,
      });
    }

    // Add history entry
    await addComponentHistory({
      component_id: id,
      status: status,
      updated_by: req.user.id,
    });

    res.json(updatedComponent);
  } catch (error) {
    console.error("Error updating component:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const uploadComponentFile = async (req, res) => {
  const { componentId } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file provided" });
  }

  try {
    // Get the component name
    const componentName = await getComponentNameById(componentId);
    if (!componentName) {
      return res.status(404).json({ error: "Component not found" });
    }

    // Get the latest revision and increment it
    const latestRevision = await getLatestRevision(componentId);
    const newRevision = latestRevision + 1;

    // Create the new file name
    const fileExtension = file.originalname.split(".").pop();
    const newFileName = `${componentName}_rev${newRevision}.${fileExtension}`;

    // Upload to S3
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: newFileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    const command = new PutObjectCommand(params);
    await s3.send(command);

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${newFileName}`;

    // Insert the new file record
    const componentFile = await insertComponentFile({
      id: uuidv4(),
      component_id: componentId,
      s3_url: fileUrl,
      revision: newRevision,
      file_name: newFileName,
    });

    // Fetch the updated component
    const updatedComponent = await db.query(
      "SELECT * FROM components WHERE id = $1",
      [componentId]
    );

    res.status(200).json({
      message: "File uploaded successfully",
      file: componentFile,
      component: updatedComponent.rows[0],
    });
  } catch (error) {
    console.error("Error uploading component file:", error);
    res
      .status(500)
      .json({ error: "Failed to upload file", details: error.message });
  }
};

const deleteFileRevision = async (req, res) => {
  console.log("Delete file revision request params:", req.params);
  console.log("Delete file revision request query:", req.query);
  console.log("Delete file revision request body:", req.body);

  const { componentId, revision } = req.params;

  if (!componentId || !revision) {
    return res.status(400).json({
      error: "Missing componentId or revision in the request parameters",
    });
  }

  try {
    // Fetch the file directly from the database
    const query =
      "SELECT * FROM component_files WHERE component_id = $1 AND revision = $2";
    const { rows } = await db.query(query, [componentId, revision]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "File revision not found" });
    }

    // const fileToDelete = rows[0];

    // // Delete from S3
    // const fileName = fileToDelete.s3_url.split('/').pop();
    // const deleteCommand = new DeleteObjectCommand({
    //   Bucket: process.env.AWS_BUCKET_NAME,
    //   Key: fileName,
    // });

    // await s3.send(deleteCommand); // Use s3 instead of s3Client

    // Delete from database
    const deleteQuery =
      "DELETE FROM component_files WHERE component_id = $1 AND revision = $2";
    await db.query(deleteQuery, [componentId, revision]);

    res.json({ message: "File revision deleted successfully" });
  } catch (error) {
    console.error("Error deleting file revision:", error);
    res.status(500).json({
      error: "Failed to delete file revision",
      details: error.message,
    });
  }
};

const addPrecastComponent = async (req, res) => {
  const {
    section_id,
    name,
    width,
    height,
    thickness,
    extension,
    reduction,
    area,
    volume,
    weight,
    status,
  } = req.body;

  if (!section_id || !name) {
    return res
      .status(400)
      .json({ error: "Missing required fields: section_id and name" });
  }

  try {
    const componentExists = await checkComponentExists(name, section_id);
    if (componentExists) {
      return res.status(400).json({
        error: "A component with this name already exists in this section",
      });
    }

    const file = req.file;
    const fileName = file ? `${uuidv4()}.pdf` : null;
    let component, fileUrl;

    component = await createComponentInDb({
      id: uuidv4(),
      section_id,
      name,
      type: "precast",
      width: parseFloat(width),
      height: parseFloat(height),
      thickness: parseFloat(thickness),
      extension: parseFloat(extension),
      reduction: parseFloat(reduction),
      area: parseFloat(area),
      volume: parseFloat(volume),
      weight: parseFloat(weight),
      status: status || "Planning",
    });

    if (file) {
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      const command = new PutObjectCommand(params);
      await s3.send(command);
      fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

      try {
        await addComponentFile(component.id, fileUrl);
      } catch (fileError) {
        console.error("Error adding component file:", fileError);
        // If file addition fails, we should delete the component and throw an error
        await db.query("DELETE FROM components WHERE id = $1", [component.id]);
        throw new Error("Failed to add component file");
      }
    }

    if (req.user) {
      await addComponentHistory({
        component_id: component.id,
        status: component.status,
        updated_by: req.user.id,
      });
    }

    res.status(201).json(component);
  } catch (error) {
    console.error("Error in addPrecastComponent:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

// const addOtherComponent = async (req, res) => {
//   const { project_id, name, width, height, thickness, total_quantity } = req.body;

//   if (!project_id || !name || !total_quantity) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }

//   try {
//     const newComponent = await db.query(
//       `INSERT INTO other_components
//        (project_id, name, width, height, thickness, total_quantity, created_by)
//        VALUES ($1, $2, $3, $4, $5, $6, $7)
//        RETURNING *`,
//       [project_id, name, width, height, thickness, total_quantity, req.user.id]
//     );

//     res.status(201).json(newComponent.rows[0]);
//   } catch (error) {
//     console.error('Error creating other component:', error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// const getOtherComponentsByProjectId = async (req, res) => {
//   const { projectId } = req.params;

//   try {
//     const { rows } = await db.query(
//       `SELECT * FROM other_components WHERE project_id = $1`,
//       [projectId]
//     );

//     res.json(rows);
//   } catch (error) {
//     console.error("Error fetching other components:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// const updateOtherComponent = async (req, res) => {
//   const { id } = req.params;
//   const { name, width, thickness, height, total } = req.body;

//   try {
//     const { rows } = await db.query(
//       `UPDATE other_components
//        SET name = $1, width = $2, thickness = $3, height = $4, total = $5, updated_by = $6, updated_at = CURRENT_TIMESTAMP
//        WHERE id = $7
//        RETURNING *`,
//       [name, width, thickness, height, total, req.user.id, id]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({ error: "Other component not found" });
//     }

//     res.json(rows[0]);
//   } catch (error) {
//     console.error("Error updating other component:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// const deleteOtherComponent = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const { rowCount } = await db.query(
//       `DELETE FROM other_components WHERE id = $1`,
//       [id]
//     );

//     if (rowCount === 0) {
//       return res.status(404).json({ error: "Other component not found" });
//     }

//     res.status(204).send();
//   } catch (error) {
//     console.error("Error deleting other component:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

const addComponentsBatch = async (req, res) => {
  const { project_id, components } = req.body;

  if (!Array.isArray(components) || components.length === 0) {
    return res.status(400).json({ error: "Invalid input: expected an array of components" });
  }

  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    const createdComponents = [];
    for (const component of components) {
      if (!component.section_name || !component.name) {
        throw new Error("Missing required fields: section_name and name");
      }

      // Check if section exists
      let section = await getSectionByName(component.section_name, project_id, client);
      if (!section) {
        console.log(`Section not found, creating section: ${component.section_name}`);
        section = await createSection({
          project_id,
          name: component.section_name,
          status: 'planning',
        }, client);
      }

      // Ensure section exists and has an ID
      if (!section || !section.id) {
        throw new Error(`Section creation failed for section: ${component.section_name}`);
      }

      const componentExists = await checkComponentExists(component.name, section.id);
      if (componentExists) {
        throw new Error(`A component with name "${component.name}" already exists in section "${component.section_name}"`);
      }

      const createdComponent = await createComponentInDb({
        id: uuidv4(),
        section_id: section.id,
        name: component.name,
        type: component.type,
        width: parseFloat(component.width),
        height: parseFloat(component.height),
        thickness: parseFloat(component.thickness),
        extension: parseFloat(component.extension),
        reduction: parseFloat(component.reduction),
        area: parseFloat(component.area),
        volume: parseFloat(component.volume),
        weight: parseFloat(component.weight),
        status: component.status || "planning",
      }, client);

      createdComponents.push(createdComponent);
    }

    await client.query("COMMIT");
    res.status(201).json({
      message: `${createdComponents.length} components created successfully`,
      components: createdComponents,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during batch processing:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
      stack: error.stack,
    });
  } finally {
    client.release();
  }
};

const updateComponentStatus = async (req, res) => {
  const { id } = req.params;
  const { status, username } = req.body;

  if (!status || !username) {
    return res.status(400).json({ error: "Missing required fields: status and username" });
  }

  try {
    const updatedComponent = await updateComponentStatusInDb(id, status, username);
    
    if (!updatedComponent) {
      return res.status(404).json({ error: "Component not found" });
    }

    res.json({ message: "Component status updated successfully", component: updatedComponent });
  } catch (error) {
    console.error("Error updating component status:", error);
    if (error.message.includes("User not found")) {
      return res.status(404).json({ error: error.message });
    }
    if (error.constraint) {
      return res.status(400).json({ error: "Constraint violation", details: error.detail });
    }
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

const updateComponentStatusPublic = async (req, res) => {
  const { id } = req.params;
  const { status, username } = req.body;

  if (!status || !username) {
    return res.status(400).json({ error: "Missing required fields: status and username" });
  }

  try {
    const updatedComponent = await updateComponentStatusInDb(id, status, username);
    
    if (!updatedComponent) {
      return res.status(404).json({ error: "Component not found" });
    }

    res.json({ message: "Component status updated successfully", component: updatedComponent });
  } catch (error) {
    console.error("Error updating component status:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

const updateComponentStatusAuth = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  if (!status) {
    return res.status(400).json({ error: "Missing required field: status" });
  }

  try {
    const updatedComponent = await updateComponentStatusInDb(id, status, userId);
    
    if (!updatedComponent) {
      return res.status(404).json({ error: "Component not found" });
    }

    res.json({ message: "Component status updated successfully", component: updatedComponent });
  } catch (error) {
    console.error("Error updating component status:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

const deleteComponent = async (req, res) => {
  const { id } = req.params;
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Delete component files from S3
    const fileQuery = 'SELECT s3_url FROM component_files WHERE component_id = $1';
    const { rows: files } = await client.query(fileQuery, [id]);
    
    // Delete files from S3 in parallel
    const deletePromises = files.map(async (file) => {
      const fileName = file.s3_url.split('/').pop();
      try {
        await s3.send(new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileName
        }));
      } catch (error) {
        console.error(`Error deleting file from S3: ${fileName}`, error);
        // Continue with deletion even if S3 deletion fails
      }
    });
    await Promise.all(deletePromises);

    // Delete all related records in order
    await client.query('DELETE FROM component_files WHERE component_id = $1', [id]);
    await client.query('DELETE FROM component_status_history WHERE component_id = $1', [id]);
    await client.query('DELETE FROM components WHERE id = $1', [id]);

    await client.query('COMMIT');
    
    res.json({ message: 'Component deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting component:', error);
    res.status(500).json({ 
      error: 'Failed to delete component', 
      details: error.message 
    });
  } finally {
    client.release();
  }
};


module.exports = {
  addComponent,
  getComponents,
  getComponentsByProjectId,
  uploadFileMiddleware: upload.single("file"),
  getComponentById,
  addComponentHistory: addComponentHistoryEndpoint,
  updateComponent,
  getComponentFiles,
  updateFileInRevision,
  deleteFileRevision,
  updateComponentWithFile,
  uploadComponentFile,
  // addOtherComponent,
  addPrecastComponent,
  addComponentsBatch,
  updateComponentStatus,
  updateComponentStatusPublic,
  updateComponentStatusAuth,
  deleteComponent,
  // getOtherComponentsByProjectId,
  // updateOtherComponent,
  // deleteOtherComponent,
};
