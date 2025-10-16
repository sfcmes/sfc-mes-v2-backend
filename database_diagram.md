Table Users {
  id UUID [pk, default: `uuid_generate_v4()`]
  username VARCHAR(255) [not null, unique]
  password_hash VARCHAR(255) [not null]
  email VARCHAR(255) [not null, unique]
  role_id UUID [not null, ref: > Roles.id]
  status ENUM("Active", "Inactive") [not null]
  created_at TIMESTAMP [default: `current_timestamp()`]
  updated_at TIMESTAMP [default: `current_timestamp()`]
}

Table Roles {
  id UUID [pk, default: `uuid_generate_v4()`]
  name VARCHAR(255) [not null, unique]
  description TEXT
  created_at TIMESTAMP [default: `current_timestamp()`]
  updated_at TIMESTAMP [default: `current_timestamp()`]
}

Table Permissions {
  id UUID [pk, default: `uuid_generate_v4()`]
  action VARCHAR(50) [not null]
  subject VARCHAR(50) [not null]
  created_at TIMESTAMP [default: `current_timestamp()`]
  updated_at TIMESTAMP [default: `current_timestamp()`]
}

Table RolePermissions {
  role_id UUID [ref: > Roles.id]
  permission_id UUID [ref: > Permissions.id]
  created_at TIMESTAMP [default: `current_timestamp()`]
  updated_at TIMESTAMP [default: `current_timestamp()`]
  indexes {
    (role_id, permission_id) [unique]
  }
}

Table Projects {
  id UUID [pk, default: `uuid_generate_v4()`]
  name VARCHAR(255) [not null]
  description TEXT
  created_by UUID [ref: > Users.id]
  created_at TIMESTAMP [default: `current_timestamp()`]
  updated_at TIMESTAMP [default: `current_timestamp()`]
}

Table Sections {
  id UUID [pk, default: `uuid_generate_v4()`]
  project_id UUID [ref: > Projects.id]
  name VARCHAR(255) [not null]
  status ENUM("Planning", "In Progress", "Completed", "On Hold") [not null]
  created_at TIMESTAMP [default: `current_timestamp()`]
  updated_at TIMESTAMP [default: `current_timestamp()`]
}

Table Components {
  id UUID [pk, default: `uuid_generate_v4()`]
  section_id UUID [ref: > Sections.id]
  name VARCHAR(255) [not null]
  type VARCHAR(50) [not null]
  width INT [not null]
  height INT [not null]
  thickness INT [not null]
  extension FLOAT [not null]
  reduction FLOAT [not null]
  area FLOAT [not null]
  volume FLOAT [not null]
  created_at TIMESTAMP [default: `current_timestamp()`]
  updated_at TIMESTAMP [default: `current_timestamp()`]
}

Table ComponentFiles {
  id UUID [pk, default: `uuid_generate_v4()`]
  component_id UUID [ref: > Components.id]
  s3_url VARCHAR(255) [not null]
  revision INT [not null]
  created_at TIMESTAMP [default: `current_timestamp()`]
  updated_at TIMESTAMP [default: `current_timestamp()`]
}

Table ComponentActivities {
  id UUID [pk, default: `uuid_generate_v4()`]
  component_id UUID [ref: > Components.id]
  activity_type VARCHAR(50) [not null]
  activity_description TEXT
  created_by UUID [ref: > Users.id]
  created_at TIMESTAMP [default: `current_timestamp()`]
}

Table ComponentStatusHistory {
  id UUID [pk, default: `uuid_generate_v4()`]
  component_id UUID [ref: > Components.id]
  status ENUM("Manufactured", "In Transit", "Transported", "Accepted", "Installed", "Rejected") [not null]
  updated_by UUID [ref: > Users.id]
  updated_at TIMESTAMP [default: `current_timestamp()`]
}
