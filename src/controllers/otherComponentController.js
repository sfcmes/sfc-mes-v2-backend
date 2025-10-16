const otherComponentQueries = require("../queries/otherComponentQueries");

const getProjectsWithOtherComponents = async (req, res) => {
  try {
    const projectsWithComponents = await otherComponentQueries.getProjectsWithOtherComponents();

    const processedData = projectsWithComponents.reduce((acc, row) => {
      if (!acc[row.project_id]) {
        acc[row.project_id] = {
          id: row.project_id,
          project_code: row.project_code,
          name: row.project_name,
          components: [],
        };
      }

      let component = acc[row.project_id].components.find(c => c.id === row.component_id);
      if (!component) {
        component = {
          id: row.component_id,
          name: row.component_name,
          total: row.total_quantity,
          statuses: {},
        };
        acc[row.project_id].components.push(component);
      }

      component.statuses[row.status_name.toLowerCase()] = row.quantity;

      return acc;
    }, {});

    res.json(Object.values(processedData));
  } catch (error) {
    console.error("Error fetching projects with other components:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateOtherComponentStatus = async (req, res) => {
  const { componentId } = req.params;
  const { fromStatus, toStatus, quantity } = req.body;
  const userId = req.user.id; // Get user ID from the authenticated request

  if (!componentId || !fromStatus || !toStatus || quantity === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const updatedComponent = await otherComponentQueries.updateOtherComponentStatus(
      componentId,
      fromStatus,
      toStatus,
      quantity,
      userId
    );
    res.json(updatedComponent);
  } catch (error) {
    console.error("Error updating other component status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createOtherComponent = async (req, res) => {
  const { project_id, name, width, height, thickness, total_quantity } = req.body;

  if (!project_id || !name || !total_quantity) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const newComponent = await otherComponentQueries.createOtherComponent({
      ...req.body,
      created_by: req.user.id,
    });
    res.status(201).json(newComponent);
  } catch (error) {
    console.error("Error creating other component:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateOtherComponentDetails = async (req, res) => {
  const { componentId } = req.params;
  const updateData = req.body;

  if (!componentId || !updateData) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const updatedComponent = await otherComponentQueries.updateOtherComponentDetails(componentId, updateData);
    res.json(updatedComponent);
  } catch (error) {
    console.error("Error updating other component details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteOtherComponentById = async (req, res) => {
  const { componentId } = req.params;

  if (!componentId) {
    return res.status(400).json({ error: "Missing component ID" });
  }

  try {
    await otherComponentQueries.deleteOtherComponentById(componentId);
    res.json({ message: "Component deleted successfully" });
  } catch (error) {
    console.error("Error deleting other component:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getOtherComponentsByProjectId = async (req, res) => {
  const { projectId } = req.params;

  if (!projectId) {
    return res.status(400).json({ error: "Missing project ID" });
  }

  try {
    const components = await otherComponentQueries.getOtherComponentsByProjectId(projectId);
    res.json(components);
  } catch (error) {
    console.error("Error fetching other components by project ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getProjectsWithOtherComponents,
  updateOtherComponentStatus,
  createOtherComponent,
  updateOtherComponentDetails,
  deleteOtherComponentById,
  getOtherComponentsByProjectId,
};