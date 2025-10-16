--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3 (Debian 16.3-1.pgdg120+1)
-- Dumped by pg_dump version 16.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: component_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.component_status AS ENUM (
    'Manufactured',
    'In Transit',
    'Transported',
    'Accepted',
    'Installed',
    'Rejected'
);


ALTER TYPE public.component_status OWNER TO admin;

--
-- Name: component_status_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.component_status_enum AS ENUM (
    'Manufactured',
    'In Transit',
    'Transported',
    'Accepted',
    'Installed',
    'Rejected'
);


ALTER TYPE public.component_status_enum OWNER TO admin;

--
-- Name: enum_Projects_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."enum_Projects_status" AS ENUM (
    'planned',
    'in_progress',
    'completed'
);


ALTER TYPE public."enum_Projects_status" OWNER TO admin;

--
-- Name: enum_Sections_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."enum_Sections_status" AS ENUM (
    'planned',
    'in_progress',
    'completed'
);


ALTER TYPE public."enum_Sections_status" OWNER TO admin;

--
-- Name: enum_component_status_history_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.enum_component_status_history_status AS ENUM (
    'Manufactured',
    'In Transit',
    'Transported',
    'Accepted',
    'Installed',
    'Rejected',
    'Planning'
);


ALTER TYPE public.enum_component_status_history_status OWNER TO admin;

--
-- Name: enum_users_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.enum_users_status AS ENUM (
    'Active',
    'Inactive'
);


ALTER TYPE public.enum_users_status OWNER TO admin;

--
-- Name: project_section_status_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.project_section_status_enum AS ENUM (
    'Planning',
    'In Progress',
    'Completed',
    'On Hold'
);


ALTER TYPE public.project_section_status_enum OWNER TO admin;

--
-- Name: section_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.section_status AS ENUM (
    'Planning',
    'In Progress',
    'Completed',
    'On Hold'
);


ALTER TYPE public.section_status OWNER TO admin;

--
-- Name: user_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.user_status AS ENUM (
    'Active',
    'Inactive'
);


ALTER TYPE public.user_status OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO admin;

--
-- Name: component_activities; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.component_activities (
    id uuid NOT NULL,
    component_id uuid,
    activity_type character varying(255) NOT NULL,
    activity_description text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone NOT NULL,
    user_id uuid
);


ALTER TABLE public.component_activities OWNER TO admin;

--
-- Name: component_status_history; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.component_status_history (
    id uuid NOT NULL,
    component_id uuid,
    status public.enum_component_status_history_status NOT NULL,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "createdAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.component_status_history OWNER TO admin;

--
-- Name: componentactivities; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.componentactivities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    component_id uuid,
    activity_type character varying(50) NOT NULL,
    activity_description text,
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.componentactivities OWNER TO admin;

--
-- Name: componentfiles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.componentfiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    component_id uuid,
    s3_url character varying(255) NOT NULL,
    revision integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.componentfiles OWNER TO admin;

--
-- Name: components; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.components (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    section_id uuid,
    name character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    width integer NOT NULL,
    height integer NOT NULL,
    thickness integer NOT NULL,
    extension double precision NOT NULL,
    reduction double precision NOT NULL,
    area double precision NOT NULL,
    volume double precision NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    weight double precision DEFAULT 0.0,
    status character varying(255) DEFAULT 'pending'::character varying
);


ALTER TABLE public.components OWNER TO admin;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    action character varying(50) NOT NULL,
    subject character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.permissions OWNER TO admin;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.projects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    project_code text,
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50)
);


ALTER TABLE public.projects OWNER TO admin;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.role_permissions (
    role_id uuid,
    permission_id uuid
);


ALTER TABLE public.role_permissions OWNER TO admin;

--
-- Name: rolepermissions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.rolepermissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.rolepermissions OWNER TO admin;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles OWNER TO admin;

--
-- Name: sections; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.sections (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid,
    name character varying(255) NOT NULL,
    status character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sections_status_check CHECK (((status)::text = ANY ((ARRAY['Planning'::character varying, 'In Progress'::character varying, 'Completed'::character varying, 'On Hold'::character varying])::text[])))
);


ALTER TABLE public.sections OWNER TO admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    role_id uuid NOT NULL,
    status character varying(10) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO admin;

--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: component_activities component_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.component_activities
    ADD CONSTRAINT component_activities_pkey PRIMARY KEY (id);


--
-- Name: component_status_history component_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.component_status_history
    ADD CONSTRAINT component_status_history_pkey PRIMARY KEY (id);


--
-- Name: componentactivities componentactivities_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.componentactivities
    ADD CONSTRAINT componentactivities_pkey PRIMARY KEY (id);


--
-- Name: componentfiles componentfiles_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.componentfiles
    ADD CONSTRAINT componentfiles_pkey PRIMARY KEY (id);


--
-- Name: components components_name_section_unique; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.components
    ADD CONSTRAINT components_name_section_unique UNIQUE (name, section_id);


--
-- Name: components components_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.components
    ADD CONSTRAINT components_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: projects projects_name_unique; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_name_unique UNIQUE (name);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);


--
-- Name: rolepermissions rolepermissions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.rolepermissions
    ADD CONSTRAINT rolepermissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sections sections_name_project_unique; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_name_project_unique UNIQUE (name, project_id);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: idx_component_activities_component_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_component_activities_component_id ON public.componentactivities USING btree (component_id);


--
-- Name: idx_component_files_component_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_component_files_component_id ON public.componentfiles USING btree (component_id);


--
-- Name: idx_components_section_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_components_section_id ON public.components USING btree (section_id);


--
-- Name: idx_sections_project_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_sections_project_id ON public.sections USING btree (project_id);


--
-- Name: idx_users_role_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_users_role_id ON public.users USING btree (role_id);


--
-- Name: componentactivities componentactivities_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.componentactivities
    ADD CONSTRAINT componentactivities_component_id_fkey FOREIGN KEY (component_id) REFERENCES public.components(id);


--
-- Name: componentactivities componentactivities_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.componentactivities
    ADD CONSTRAINT componentactivities_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: componentfiles componentfiles_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.componentfiles
    ADD CONSTRAINT componentfiles_component_id_fkey FOREIGN KEY (component_id) REFERENCES public.components(id);


--
-- Name: components components_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.components
    ADD CONSTRAINT components_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id);


--
-- Name: projects projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: rolepermissions rolepermissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.rolepermissions
    ADD CONSTRAINT rolepermissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- Name: rolepermissions rolepermissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.rolepermissions
    ADD CONSTRAINT rolepermissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: sections sections_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO admin;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA public GRANT SELECT ON TABLES TO admin;


--
-- PostgreSQL database dump complete
--

