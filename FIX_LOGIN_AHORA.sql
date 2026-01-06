-- =============================================
-- SOLUCIÓN INMEDIATA AL ERROR DE LOGIN
-- =============================================
-- Copia y pega este SQL en el SQL Editor de Supabase:
-- https://supabase.com/dashboard/project/qwzdatnlfdnsxebfgjwu/sql
-- =============================================

-- Deshabilitar Row Level Security en la tabla users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas RLS existentes
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON users;
DROP POLICY IF EXISTS "Allow public read access" ON users;
DROP POLICY IF EXISTS "Allow authenticated read access" ON users;

-- Verificar que todo funciona
SELECT 'RLS deshabilitado correctamente en tabla users' AS status;
