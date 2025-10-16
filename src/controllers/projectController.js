const { getAllProjects, getProjectById, createProject, updateProjectById, addProjectImage, getProjectImages, deleteProjectById, deleteProjectImage  } = require('../queries/projectQueries');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const getProjects = async (req, res) => {
  try {
    const projects = await getAllProjects();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Error retrieving projects' });
  }
};

const getProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Error retrieving project' });
  }
};

const addProject = async (req, res) => {
  try {
    const projectData = req.body;
    const newProject = await createProject(projectData);
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Error creating project' });
  }
};

const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const projectData = req.body;
    const updatedProject = await updateProjectById(projectId, projectData);
    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Error updating project' });
  }
};

const uploadProjectImage = async (req, res) => {
  const projectId = req.params.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const fileName = `${uuidv4()}-${file.originalname}`;
    
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `projects/${projectId}/${fileName}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);

    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/projects/${projectId}/${fileName}`;

    const projectImage = await addProjectImage(projectId, imageUrl);

    res.status(201).json(projectImage);
  } catch (error) {
    console.error('Error uploading project image:', error);
    res.status(500).json({ error: 'Error uploading project image' });
  }
};

const deleteProjectImageController = async (req, res) => {
  const projectId = req.params.projectId;
  const imageId = req.params.imageId;

  console.log(`Attempting to delete image record ${imageId} from project ${projectId}`);

  try {
    // Delete the image record from the database
    const deletedImage = await deleteProjectImage(projectId, imageId);

    if (!deletedImage) {
      console.log(`Image record ${imageId} not found for project ${projectId}`);
      return res.status(404).json({ error: 'Image record not found' });
    }

    console.log(`Deleted image record: ${JSON.stringify(deletedImage)}`);

    res.status(200).json({ message: 'Image record deleted successfully', deletedImage });
  } catch (error) {
    console.error('Error deleting project image record:', error);
    res.status(500).json({ 
      error: 'Error deleting project image record', 
      details: error.message
    });
  }
};

const getProjectImagesController = async (req, res) => {
  const projectId = req.params.id;

  try {
    const images = await getProjectImages(projectId);
    res.json(images);
  } catch (error) {
    console.error('Error fetching project images:', error);
    res.status(500).json({ error: 'Error fetching project images' });
  }
};

const deleteProject = async (req, res) => {
  try {
    await deleteProjectById(req.params.id);
    res.status(200).json({ message: 'Project and all associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ 
      error: 'Failed to delete project and its associated data', 
      details: error.message 
    });
  }
};

const getProjectDetailsByComponentId = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT p.name as project_name, p.project_code
      FROM components c
      JOIN sections s ON c.section_id = s.id
      JOIN projects p ON s.project_id = p.id
      WHERE c.id = $1;
    `;
    const { rows } = await db.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project details not found for this component' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = {
  getProjects,
  getProject,
  addProject,
  updateProject,
  uploadProjectImage,
  deleteProjectImageController,
  getProjectImagesController,
  deleteProject,
  getProjectDetailsByComponentId 
};
