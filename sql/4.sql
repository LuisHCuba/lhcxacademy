-- SQL para corrigir o relacionamento entre departments e users
-- Adicionando a chave estrangeira que está faltando

-- Verifica se já existe a chave estrangeira
DO $$
BEGIN
    -- Verifica se a FK já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'users_department_id_fkey'
        AND table_name = 'users'
    ) THEN
        -- Adiciona a chave estrangeira
        ALTER TABLE public.users 
        ADD CONSTRAINT users_department_id_fkey 
        FOREIGN KEY (department_id) 
        REFERENCES public.departments(id);
        
        RAISE NOTICE 'Chave estrangeira adicionada com sucesso.';
    ELSE
        RAISE NOTICE 'A chave estrangeira já existe.';
    END IF;
END
$$;

-- Corrige os índices para melhorar o desempenho das consultas
DO $$
BEGIN
    -- Cria índice no campo department_id da tabela users se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_users_department_id'
    ) THEN
        CREATE INDEX idx_users_department_id ON public.users(department_id);
        RAISE NOTICE 'Índice criado na coluna department_id da tabela users.';
    ELSE
        RAISE NOTICE 'O índice na coluna department_id já existe.';
    END IF;
END
$$; 