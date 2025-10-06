import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ChatMessage = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  session_id: string;
};
