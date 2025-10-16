const { createSection, getSectionsByProjectId, getAllSections, getSectionByIdFromDb, updateSection, deleteSection, getSectionByNameAndProjectId } = require('../queries/sectionQueries');
const { checkProjectExists } = require('../queries/projectQueries');
const { v4: uuidv4 } = require('uuid');

const addSection = async (req, res) => {
    const { name, project_id, status } = req.body;
    try {
        if (!name || !project_id || !status) {
            return res.status(400).json({ error: 'Name, project_id, and status are required' });
        }

        const projectExists = await checkProjectExists(project_id);
        if (!projectExists) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if a section with the same name already exists for this project
        const existingSection = await getSectionByNameAndProjectId(name, project_id);
        if (existingSection) {
            return res.status(409).json({ error: 'A section with this name already exists in this project' });
        }

        const newSection = {
            id: uuidv4(),
            name,
            project_id,
            status,
            created_at: new Date(),
            updated_at: new Date(),
        };

        const section = await createSection(newSection);
        res.status(201).json({ message: 'Section created successfully', section });
    } catch (error) {
        console.error('Error creating section:', error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

const getSections = async (req, res) => {
    try {
        const sections = await getAllSections();
        res.json(sections);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving sections' });
    }
};

const getSectionsByProject = async (req, res) => {
    const { projectId } = req.params;
    try {
        const sections = await getSectionsByProjectId(projectId);
        res.json(sections);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving sections for project' });
    }
};

const getSectionById = async (req, res) => {
    const { sectionId } = req.params;
    try {
        const section = await getSectionByIdFromDb(sectionId);
        if (section) {
            res.json(section);
        } else {
            res.status(404).json({ error: 'Section not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving section' });
    }
};

const updateSectionById = async (req, res) => {
    const { sectionId } = req.params;
    const { name, project_id, status, components } = req.body;

    try {
        const updatedSection = await updateSection(sectionId, { name, project_id, status, components, updated_at: new Date() });
        if (updatedSection) {
            res.json({ message: 'Section updated successfully', updatedSection });
        } else {
            res.status(404).json({ error: 'Section not found' });
        }
    } catch (error) {
        console.error('Error updating section:', error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

const deleteSectionById = async (req, res) => {
    const { sectionId } = req.params;

    try {
        const deletedSection = await deleteSection(sectionId);
        if (deletedSection) {
            res.json({ message: 'Section deleted successfully', deletedSection });
        } else {
            res.status(404).json({ error: 'Section not found' });
        }
    } catch (error) {
        console.error('Error deleting section:', error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

module.exports = {
    addSection,
    getSections,
    getSectionsByProject,
    getSectionById,
    updateSectionById,
    deleteSectionById,
};
