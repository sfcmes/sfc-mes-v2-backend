-- Set the time zone for the current session
SET TIME ZONE 'Asia/Bangkok';

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE section_status AS ENUM ('planning', 'in progress', 'completed', 'on hold');
CREATE TYPE component_status AS ENUM ('manufactured', 'in transit', 'transported', 'accepted', 'installed', 'rejected');

-- Create tables
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role_id UUID NOT NULL REFERENCES roles(id),
  status user_status NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(50) NOT NULL,
  subject VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  name VARCHAR(255) NOT NULL,
  status section_status NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES sections(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  thickness INT NOT NULL,
  extension FLOAT NOT NULL,
  reduction FLOAT NOT NULL,
  area FLOAT NOT NULL,
  volume FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE component_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  component_id UUID REFERENCES components(id),
  s3_url VARCHAR(255) NOT NULL,
  revision INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE component_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  component_id UUID REFERENCES components(id),
  activity_type VARCHAR(50) NOT NULL,
  activity_description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE component_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  component_id UUID REFERENCES components(id),
  status component_status NOT NULL,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Insert mockup roles
INSERT INTO roles (id, name, description)
VALUES 
  (uuid_generate_v4(), 'Admin', 'Administrator with full access'),
  (uuid_generate_v4(), 'Manager', 'Manager with limited access'),
  (uuid_generate_v4(), 'Site User', 'User with site access only');

-- Insert mockup users
INSERT INTO users (id, username, password_hash, email, role_id, status)
VALUES 
  (uuid_generate_v4(), 'admin_user', 'hashed_password_1', 'admin@example.com', (SELECT id FROM roles WHERE name = 'Admin'), 'active'),
  (uuid_generate_v4(), 'manager_user', 'hashed_password_2', 'manager@example.com', (SELECT id FROM roles WHERE name = 'Manager'), 'active'),
  (uuid_generate_v4(), 'site_user', 'hashed_password_3', 'siteuser@example.com', (SELECT id FROM roles WHERE name = 'Site User'), 'active');

-- Insert mockup permissions
INSERT INTO permissions (id, action, subject)
VALUES 
  (uuid_generate_v4(), 'view', 'dashboard'),
  (uuid_generate_v4(), 'edit', 'project'),
  (uuid_generate_v4(), 'create', 'section');

-- Insert mockup role_permissions
INSERT INTO role_permissions (role_id, permission_id)
VALUES 
  ((SELECT id FROM roles WHERE name = 'Admin'), (SELECT id FROM permissions WHERE action = 'view' AND subject = 'dashboard')),
  ((SELECT id FROM roles WHERE name = 'Admin'), (SELECT id FROM permissions WHERE action = 'edit' AND subject = 'project')),
  ((SELECT id FROM roles WHERE name = 'Manager'), (SELECT id FROM permissions WHERE action = 'view' AND subject = 'dashboard')),
  ((SELECT id FROM roles WHERE name = 'Site User'), (SELECT id FROM permissions WHERE action = 'create' AND subject = 'section'));

-- Insert mockup projects
INSERT INTO projects (id, name, description, created_by)
VALUES 
  (uuid_generate_v4(), 'Project Alpha', 'First project description', (SELECT id FROM users WHERE username = 'admin_user')),
  (uuid_generate_v4(), 'Project Beta', 'Second project description', (SELECT id FROM users WHERE username = 'manager_user'));

-- Insert mockup sections
INSERT INTO sections (id, project_id, name, status)
VALUES 
  (uuid_generate_v4(), (SELECT id FROM projects WHERE name = 'Project Alpha'), 'Section 1', 'planning'),
  (uuid_generate_v4(), (SELECT id FROM projects WHERE name = 'Project Alpha'), 'Section 2', 'in progress'),
  (uuid_generate_v4(), (SELECT id FROM projects WHERE name = 'Project Beta'), 'Section A', 'completed');

-- Insert mockup components
INSERT INTO components (id, section_id, name, type, width, height, thickness, extension, reduction, area, volume)
VALUES 
  (uuid_generate_v4(), (SELECT id FROM sections WHERE name = 'Section 1'), 'Component 1', 'Type A', 100, 200, 10, 1.5, 0.5, 20, 2),
  (uuid_generate_v4(), (SELECT id FROM sections WHERE name = 'Section 2'), 'Component 2', 'Type B', 150, 250, 15, 2.0, 0.7, 30, 3),
  (uuid_generate_v4(), (SELECT id FROM sections WHERE name = 'Section A'), 'Component 3', 'Type C', 200, 300, 20, 2.5, 1.0, 40, 4);

-- Insert mockup component files
INSERT INTO component_files (id, component_id, s3_url, revision)
VALUES 
  (uuid_generate_v4(), (SELECT id FROM components WHERE name = 'Component 1'), 'https://s3.example.com/component1_rev1', 1),
  (uuid_generate_v4(), (SELECT id FROM components WHERE name = 'Component 2'), 'https://s3.example.com/component2_rev1', 1),
  (uuid_generate_v4(), (SELECT id FROM components WHERE name = 'Component 3'), 'https://s3.example.com/component3_rev1', 1);

-- Insert mockup component activities
INSERT INTO component_activities (id, component_id, activity_type, activity_description, created_by)
VALUES 
  (uuid_generate_v4(), (SELECT id FROM components WHERE name = 'Component 1'), 'Welding', 'Welding of component 1', (SELECT id FROM users WHERE username = 'site_user')),
  (uuid_generate_v4(), (SELECT id FROM components WHERE name = 'Component 2'), 'Painting', 'Painting of component 2', (SELECT id FROM users WHERE username = 'site_user')),
  (uuid_generate_v4(), (SELECT id FROM components WHERE name = 'Component 3'), 'Inspection', 'Inspection of component 3', (SELECT id FROM users WHERE username = 'manager_user'));

-- Insert mockup component status history
INSERT INTO component_status_history (id, component_id, status, updated_by)
VALUES 
  (uuid_generate_v4(), (SELECT id FROM components WHERE name = 'Component 1'), 'manufactured', (SELECT id FROM users WHERE username = 'admin_user')),
  (uuid_generate_v4(), (SELECT id FROM components WHERE name = 'Component 2'), 'in transit', (SELECT id FROM users WHERE username = 'manager_user')),
  (uuid_generate_v4(), (SELECT id FROM components WHERE name = 'Component 3'), 'installed', (SELECT id FROM users WHERE username = 'site_user'));
