/*
  # Create Learning Platform Schema

  1. New Tables
    - departments
    - tracks
    - videos
    - assignments
    - progress
    - quiz_questions
    - quiz_answers
    - quiz_attempts
    - certificates

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id serial PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create tracks table
CREATE TABLE IF NOT EXISTS public.tracks (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('track', 'pill', 'grid')),
  thumbnail_url text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.users(id)
);

-- Create videos table
CREATE TABLE IF NOT EXISTS public.videos (
  id serial PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  youtube_id text NOT NULL,
  estimated_duration integer NOT NULL,
  order_index integer NOT NULL,
  track_id integer REFERENCES public.tracks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.users(id)
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id serial PRIMARY KEY,
  track_id integer REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  department_id integer REFERENCES public.departments(id),
  start_date timestamptz NOT NULL,
  due_date timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'expired')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.users(id)
);

-- Create progress table
CREATE TABLE IF NOT EXISTS public.progress (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES public.users(id),
  video_id integer REFERENCES public.videos(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
  watch_time integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id serial PRIMARY KEY,
  track_id integer REFERENCES public.tracks(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  time_limit integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.users(id)
);

-- Create quiz_answers table
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id serial PRIMARY KEY,
  question_id integer REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  answer_text text NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES public.users(id),
  question_id integer REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  answer_id integer REFERENCES public.quiz_answers(id),
  response_time integer NOT NULL,
  is_correct boolean NOT NULL,
  score integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
  id serial PRIMARY KEY,
  user_id uuid REFERENCES public.users(id),
  track_id integer REFERENCES public.tracks(id) ON DELETE CASCADE,
  issue_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Departments policies
CREATE POLICY "Anyone can read departments"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

-- Tracks policies
CREATE POLICY "Anyone can read tracks"
  ON public.tracks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Instructors and admins can manage tracks"
  ON public.tracks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'instructor')
    )
  );

-- Videos policies
CREATE POLICY "Anyone can read videos"
  ON public.videos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Instructors and admins can manage videos"
  ON public.videos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'instructor')
    )
  );

-- Assignments policies
CREATE POLICY "Users can read own assignments"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    department_id IN (
      SELECT department_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Instructors and admins can manage assignments"
  ON public.assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'instructor')
    )
  );

-- Progress policies
CREATE POLICY "Users can read own progress"
  ON public.progress FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own progress"
  ON public.progress
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Quiz policies
CREATE POLICY "Anyone can read quiz questions"
  ON public.quiz_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read quiz answers"
  ON public.quiz_answers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own quiz attempts"
  ON public.quiz_attempts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Certificates policies
CREATE POLICY "Users can read own certificates"
  ON public.certificates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Instructors and admins can manage certificates"
  ON public.certificates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'instructor')
    )
  );