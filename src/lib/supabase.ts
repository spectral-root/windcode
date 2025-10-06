import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ChatMessage = {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'tool';
  created_at: string;
  session_id: string;
  tool_calls?: string;
  tool_call_id?: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  workspace_path: string;
  created_at: string;
  updated_at: string;
};

export type ProjectFile = {
  id: string;
  project_id: string;
  file_path: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type CommandExecution = {
  id: string;
  project_id: string;
  session_id: string;
  command: string;
  stdout: string;
  stderr: string;
  exit_code: number | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
};
