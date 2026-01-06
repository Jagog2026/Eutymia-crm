-- EJECUTA ESTO EN EL SQL EDITOR DE SUPABASE DASHBOARD
-- https://supabase.com/dashboard/project/qwzdatnlfdnsxebfgjwu/sql

-- Deshabilitar Row Level Security en la tabla users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON users;

-- Verificar que RLS esté deshabilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';
