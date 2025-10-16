const db = require('./database');  // Adjust this path to where your database connection is configured

const createTablesIfNotExist = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS components (
        id UUID PRIMARY KEY,
        section_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        width INT NOT NULL,
        height INT NOT NULL,
        thickness INT NOT NULL,
        extension FLOAT NOT NULL,
        reduction FLOAT NOT NULL,
        area FLOAT NOT NULL,
        volume FLOAT NOT NULL,
        weight FLOAT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS component_files (
        id UUID PRIMARY KEY,
        component_id UUID REFERENCES components(id),
        s3_url VARCHAR(255) NOT NULL,
        revision INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS component_status_history (
        id UUID PRIMARY KEY,
        component_id UUID REFERENCES components(id),
        status VARCHAR(50) NOT NULL,
        updated_by UUID NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL
      );

      -- Add any other tables your application needs
    `);

    console.log('All necessary tables have been created or already exist.');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

module.exports = { createTablesIfNotExist };