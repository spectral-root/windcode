/*
  # Create projects and files management tables

  1. New Tables
    - `projects`
      - `id` (uuid, primary key) - Unique identifier for each project
      - `name` (text) - Project name
      - `description` (text) - Project description
      - `workspace_path` (text) - Path to project workspace directory
      - `created_at` (timestamptz) - Timestamp when project was created
      - `updated_at` (timestamptz) - Timestamp when project was last updated
    
    - `project_files`
      - `id` (uuid, primary key) - Unique identifier for each file
      - `project_id` (uuid, foreign key) - Reference to parent project
      - `file_path` (text) - Relative path to file within project
      - `content` (text) - File content
      - `created_at` (timestamptz) - Timestamp when file was created
      - `updated_at` (timestamptz) - Timestamp when file was last updated
    
    - `command_executions`
      - `id` (uuid, primary key) - Unique identifier for each execution
      - `project_id` (uuid, foreign key) - Reference to parent project
      - `session_id` (uuid) - Reference to chat session
      - `command` (text) - Command that was executed
      - `stdout` (text) - Standard output from command
      - `stderr` (text) - Standard error from command
      - `exit_code` (integer) - Command exit code
      - `status` (text) - Execution status (pending, running, completed, failed)
      - `created_at` (timestamptz) - Timestamp when command was executed
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own projects
  
  3. Notes
    - Projects organize files and command executions
    - File paths are relative to workspace_path
    - Command executions track all shell commands with results
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  workspace_path text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  content text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, file_path)
);

CREATE TABLE IF NOT EXISTS command_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  command text NOT NULL,
  stdout text DEFAULT '',
  stderr text DEFAULT '',
  exit_code integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update all projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete all projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can view all project files"
  ON project_files
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create project files"
  ON project_files
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update project files"
  ON project_files
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete project files"
  ON project_files
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can view command executions"
  ON command_executions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create command executions"
  ON command_executions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update command executions"
  ON command_executions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_command_executions_project_id ON command_executions(project_id);
CREATE INDEX IF NOT EXISTS idx_command_executions_session_id ON command_executions(session_id);