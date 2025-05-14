-- SQL para configurar políticas de Row Level Security (RLS) para o projeto Go Academy
-- Este arquivo configura permissões para todas as tabelas principais do sistema

-- Habilitar RLS em todas as tabelas (ignora se já estiver habilitado)
DO $$ 
BEGIN
    -- Habilitar RLS para cada tabela se ainda não estiver habilitado
    ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.departments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.tracks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.videos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.assignments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.progress ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.quiz_questions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.quiz_answers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.quiz_attempts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.certificates ENABLE ROW LEVEL SECURITY;
END $$;

-- Remover todas as políticas existentes para limpar
DROP POLICY IF EXISTS "Allow full access for admins" ON public.users;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow users to read/edit their own data" ON public.users;

DROP POLICY IF EXISTS "Allow full access for admins" ON public.departments;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.departments;

DROP POLICY IF EXISTS "Allow full access for admins" ON public.tracks;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.tracks;
DROP POLICY IF EXISTS "Allow instructors to manage their tracks" ON public.tracks;

DROP POLICY IF EXISTS "Allow full access for admins" ON public.videos;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.videos;
DROP POLICY IF EXISTS "Allow instructors to manage their videos" ON public.videos;

DROP POLICY IF EXISTS "Allow full access for admins" ON public.assignments;
DROP POLICY IF EXISTS "Allow instructors to manage assignments" ON public.assignments;
DROP POLICY IF EXISTS "Allow users to view their assignments" ON public.assignments;

DROP POLICY IF EXISTS "Allow full access for admins" ON public.progress;
DROP POLICY IF EXISTS "Allow users to manage their own progress" ON public.progress;
DROP POLICY IF EXISTS "Allow instructors to view progress" ON public.progress;

DROP POLICY IF EXISTS "Allow full access for admins" ON public.quiz_questions;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.quiz_questions;
DROP POLICY IF EXISTS "Allow instructors to manage their quiz questions" ON public.quiz_questions;

DROP POLICY IF EXISTS "Allow full access for admins" ON public.quiz_answers;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.quiz_answers;

DROP POLICY IF EXISTS "Allow full access for admins" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Allow users to manage their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Allow instructors to view attempts" ON public.quiz_attempts;

DROP POLICY IF EXISTS "Allow full access for admins" ON public.certificates;
DROP POLICY IF EXISTS "Allow users to view their own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Allow instructors to view certificates" ON public.certificates;

-- =============================================
-- POLÍTICAS PARA TABELA USERS
-- =============================================

-- Administradores têm acesso total a todos os usuários
CREATE POLICY "Allow full access for admins"
ON public.users
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Todos os usuários autenticados podem ver informações básicas de outros usuários
CREATE POLICY "Allow read access for authenticated users"
ON public.users
FOR SELECT
USING (auth.role() = 'authenticated');

-- Usuários podem ver e editar seus próprios dados
CREATE POLICY "Allow users to read/edit their own data"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- =============================================
-- POLÍTICAS PARA TABELA DEPARTMENTS
-- =============================================

-- Administradores têm acesso total
CREATE POLICY "Allow full access for admins"
ON public.departments
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Todos os usuários autenticados podem ver departamentos
CREATE POLICY "Allow read access for authenticated users"
ON public.departments
FOR SELECT
USING (auth.role() = 'authenticated');

-- =============================================
-- POLÍTICAS PARA TABELA TRACKS
-- =============================================

-- Administradores têm acesso total
CREATE POLICY "Allow full access for admins"
ON public.tracks
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Todos os usuários autenticados podem ver trilhas
CREATE POLICY "Allow read access for authenticated users"
ON public.tracks
FOR SELECT
USING (auth.role() = 'authenticated');

-- Instrutores podem gerenciar trilhas que eles criaram
CREATE POLICY "Allow instructors to manage their tracks"
ON public.tracks
USING (
  auth.jwt() ->> 'role' = 'instructor' AND 
  created_by = auth.uid()
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'instructor' AND 
  created_by = auth.uid()
);

-- =============================================
-- POLÍTICAS PARA TABELA VIDEOS
-- =============================================

-- Administradores têm acesso total
CREATE POLICY "Allow full access for admins"
ON public.videos
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Todos os usuários autenticados podem ver vídeos
CREATE POLICY "Allow read access for authenticated users"
ON public.videos
FOR SELECT
USING (auth.role() = 'authenticated');

-- Instrutores podem gerenciar vídeos que eles criaram
CREATE POLICY "Allow instructors to manage their videos"
ON public.videos
USING (
  auth.jwt() ->> 'role' = 'instructor' AND 
  created_by = auth.uid()
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'instructor' AND 
  created_by = auth.uid()
);

-- =============================================
-- POLÍTICAS PARA TABELA ASSIGNMENTS
-- =============================================

-- Administradores têm acesso total
CREATE POLICY "Allow full access for admins"
ON public.assignments
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Instrutores podem gerenciar atribuições
CREATE POLICY "Allow instructors to manage assignments"
ON public.assignments
USING (
  auth.jwt() ->> 'role' = 'instructor'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'instructor'
);

-- Usuários podem ver atribuições destinadas a eles ou ao seu departamento
CREATE POLICY "Allow users to view their assignments"
ON public.assignments
FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    user_id = auth.uid() OR
    department_id IN (
      SELECT department_id FROM public.users 
      WHERE id = auth.uid()
    )
  )
);

-- =============================================
-- POLÍTICAS PARA TABELA PROGRESS
-- =============================================

-- Administradores têm acesso total
CREATE POLICY "Allow full access for admins"
ON public.progress
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Usuários podem gerenciar seu próprio progresso
CREATE POLICY "Allow users to manage their own progress"
ON public.progress
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Instrutores podem ver o progresso de todos os usuários
CREATE POLICY "Allow instructors to view progress"
ON public.progress
FOR SELECT
USING (auth.jwt() ->> 'role' = 'instructor');

-- =============================================
-- POLÍTICAS PARA TABELA QUIZ_QUESTIONS
-- =============================================

-- Administradores têm acesso total
CREATE POLICY "Allow full access for admins"
ON public.quiz_questions
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Todos os usuários autenticados podem ver perguntas de quiz
CREATE POLICY "Allow read access for authenticated users"
ON public.quiz_questions
FOR SELECT
USING (auth.role() = 'authenticated');

-- Instrutores podem gerenciar perguntas de quiz que eles criaram
CREATE POLICY "Allow instructors to manage their quiz questions"
ON public.quiz_questions
USING (
  auth.jwt() ->> 'role' = 'instructor' AND 
  created_by = auth.uid()
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'instructor' AND 
  created_by = auth.uid()
);

-- =============================================
-- POLÍTICAS PARA TABELA QUIZ_ANSWERS
-- =============================================

-- Administradores têm acesso total
CREATE POLICY "Allow full access for admins"
ON public.quiz_answers
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Todos os usuários autenticados podem ver respostas de quiz
CREATE POLICY "Allow read access for authenticated users"
ON public.quiz_answers
FOR SELECT
USING (auth.role() = 'authenticated');

-- =============================================
-- POLÍTICAS PARA TABELA QUIZ_ATTEMPTS
-- =============================================

-- Administradores têm acesso total
CREATE POLICY "Allow full access for admins"
ON public.quiz_attempts
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Usuários podem gerenciar suas próprias tentativas de quiz
CREATE POLICY "Allow users to manage their own attempts"
ON public.quiz_attempts
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Instrutores podem ver as tentativas de quiz de todos os usuários
CREATE POLICY "Allow instructors to view attempts"
ON public.quiz_attempts
FOR SELECT
USING (auth.jwt() ->> 'role' = 'instructor');

-- =============================================
-- POLÍTICAS PARA TABELA CERTIFICATES
-- =============================================

-- Administradores têm acesso total
CREATE POLICY "Allow full access for admins"
ON public.certificates
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Usuários podem ver seus próprios certificados
CREATE POLICY "Allow users to view their own certificates"
ON public.certificates
FOR SELECT
USING (user_id = auth.uid());

-- Instrutores podem ver certificados de todos os usuários
CREATE POLICY "Allow instructors to view certificates"
ON public.certificates
FOR SELECT
USING (auth.jwt() ->> 'role' = 'instructor');

-- Bypass RLS para serviço do Supabase - facilita operações automatizadas
-- Verifica se a role service_role existe antes de criar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role;
    END IF;
END
$$;

-- Garantir que postgres e authenticated tenham a role de service_role
DO $$
BEGIN
    -- Concede a role service_role para postgres se não tiver
    IF NOT EXISTS (
        SELECT 1 FROM pg_auth_members m
        JOIN pg_roles r ON m.roleid = r.oid
        JOIN pg_roles u ON m.member = u.oid
        WHERE r.rolname = 'service_role' AND u.rolname = 'postgres'
    ) THEN
        GRANT service_role TO postgres;
    END IF;
    
    -- Concede a role service_role para authenticated se não tiver
    IF NOT EXISTS (
        SELECT 1 FROM pg_auth_members m
        JOIN pg_roles r ON m.roleid = r.oid
        JOIN pg_roles u ON m.member = u.oid
        WHERE r.rolname = 'service_role' AND u.rolname = 'authenticated'
    ) THEN
        GRANT service_role TO authenticated;
    END IF;
END
$$;

-- Permitir que a role service_role ignore RLS
DO $$ 
BEGIN
    -- Forçar RLS para cada tabela
    ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.departments FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.tracks FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.videos FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.assignments FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.progress FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.quiz_questions FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.quiz_answers FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.quiz_attempts FORCE ROW LEVEL SECURITY;
    ALTER TABLE public.certificates FORCE ROW LEVEL SECURITY;
END $$;

-- Criar política que permita acesso total a todas as tabelas para service_role
-- Removemos políticas existentes primeiro para evitar conflitos
DROP POLICY IF EXISTS "Allow service role bypass" ON public.users;
DROP POLICY IF EXISTS "Allow service role bypass" ON public.departments;
DROP POLICY IF EXISTS "Allow service role bypass" ON public.tracks;
DROP POLICY IF EXISTS "Allow service role bypass" ON public.videos;
DROP POLICY IF EXISTS "Allow service role bypass" ON public.assignments;
DROP POLICY IF EXISTS "Allow service role bypass" ON public.progress;
DROP POLICY IF EXISTS "Allow service role bypass" ON public.quiz_questions;
DROP POLICY IF EXISTS "Allow service role bypass" ON public.quiz_answers;
DROP POLICY IF EXISTS "Allow service role bypass" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Allow service role bypass" ON public.certificates;

-- Criar novas políticas de bypass
CREATE POLICY "Allow service role bypass" ON public.users FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role bypass" ON public.departments FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role bypass" ON public.tracks FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role bypass" ON public.videos FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role bypass" ON public.assignments FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role bypass" ON public.progress FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role bypass" ON public.quiz_questions FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role bypass" ON public.quiz_answers FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role bypass" ON public.quiz_attempts FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role bypass" ON public.certificates FOR ALL TO service_role USING (true); 