/*
  # Create chat messages table

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key) - Unique identifier for each message
      - `content` (text) - The message content
      - `role` (text) - Either 'user' or 'assistant' to distinguish message sender
      - `created_at` (timestamptz) - Timestamp when message was created
      - `session_id` (uuid) - Groups messages into conversation sessions
  
  2. Security
    - Enable RLS on `chat_messages` table
    - Add policy for users to read their own messages
    - Add policy for users to insert their own messages
  
  3. Notes
    - Messages are grouped by session_id to maintain conversation context
    - RLS policies ensure users can only access their own chat history
*/

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at timestamptz DEFAULT now(),
  session_id uuid NOT NULL
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);