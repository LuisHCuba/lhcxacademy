/*
  # Create users table and policies

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `full_name` (text)
      - `avatar_url` (text, nullable)
      - `department_id` (integer, nullable)
      - `role` (enum: 'admin', 'instructor', 'collaborator')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on users table
    - Add policies for:
      - Users can read their own data
      - Users can update their own data
      - New users can be created during signup
*/

-- Create role enum type
CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'collaborator');

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  department_id integer,
  role user_role NOT NULL DEFAULT 'collaborator',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for authentication"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);