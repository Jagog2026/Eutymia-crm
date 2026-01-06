-- ============================================================================
-- FIX: PERMISOS DE SUPABASE - Solución para error 42501
-- ============================================================================
-- Error: "permission denied for schema public"
-- Este script otorga todos los permisos necesarios para acceder a las tablas
-- ============================================================================

-- ============================================================================
-- PARTE 1: OTORGAR PERMISOS AL ROL ANON (Usuario no autenticado)
-- ============================================================================

-- Permitir uso del esquema public
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Otorgar todos los permisos en todas las tablas existentes
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- Otorgar permisos en secuencias (para IDs autoincrementales)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Otorgar permisos en funciones
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- PARTE 2: OTORGAR PERMISOS EN TABLAS ESPECÍFICAS
-- ============================================================================

-- Usuarios
GRANT ALL ON public.users TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Terapeutas
GRANT ALL ON public.therapists TO anon, authenticated;

-- Leads
GRANT ALL ON public.leads TO anon, authenticated;

-- Tareas de Leads
GRANT ALL ON public.lead_tasks TO anon, authenticated;

-- Citas
GRANT ALL ON public.appointments TO anon, authenticated;

-- Talleres
GRANT ALL ON public.workshops TO anon, authenticated;

-- Inscripciones a Talleres
GRANT ALL ON public.workshop_registrations TO anon, authenticated;

-- Gastos
GRANT ALL ON public.expenses TO anon, authenticated;

-- ============================================================================
-- PARTE 3: CONFIGURAR PERMISOS POR DEFECTO PARA TABLAS FUTURAS
-- ============================================================================

-- Esto asegura que cualquier tabla nueva también tenga permisos
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON SEQUENCES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON FUNCTIONS TO anon, authenticated;

-- ============================================================================
-- PARTE 4: DESACTIVAR RLS EN TODAS LAS TABLAS (por si acaso)
-- ============================================================================

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 5: ELIMINAR TODAS LAS POLÍTICAS RLS
-- ============================================================================

-- Eliminar políticas en users
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.users;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

-- Eliminar políticas en therapists
DROP POLICY IF EXISTS "Enable read access for all users" ON public.therapists;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.therapists;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.therapists;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.therapists;
DROP POLICY IF EXISTS "Therapists are viewable by everyone" ON public.therapists;

-- Eliminar políticas en leads
DROP POLICY IF EXISTS "Enable read access for all users" ON public.leads;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.leads;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.leads;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.leads;
DROP POLICY IF EXISTS "Leads are viewable by everyone" ON public.leads;

-- Eliminar políticas en lead_tasks
DROP POLICY IF EXISTS "Enable read access for all users" ON public.lead_tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.lead_tasks;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.lead_tasks;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.lead_tasks;

-- Eliminar políticas en appointments
DROP POLICY IF EXISTS "Enable read access for all users" ON public.appointments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.appointments;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.appointments;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.appointments;
DROP POLICY IF EXISTS "Appointments are viewable by everyone" ON public.appointments;

-- Eliminar políticas en workshops
DROP POLICY IF EXISTS "Enable read access for all users" ON public.workshops;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.workshops;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.workshops;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.workshops;

-- Eliminar políticas en workshop_registrations
DROP POLICY IF EXISTS "Enable read access for all users" ON public.workshop_registrations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.workshop_registrations;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.workshop_registrations;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.workshop_registrations;

-- Eliminar políticas en expenses
DROP POLICY IF EXISTS "Enable read access for all users" ON public.expenses;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.expenses;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.expenses;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.expenses;

-- ============================================================================
-- PARTE 6: VERIFICACIÓN DE PERMISOS
-- ============================================================================

-- Ver permisos actuales en las tablas
SELECT 
    schemaname,
    tablename,
    tableowner,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Ver políticas RLS activas (debería estar vacío)
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public';

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================

/*
✅ Todos los permisos otorgados a 'anon' y 'authenticated'
✅ RLS desactivado en todas las tablas
✅ Todas las políticas eliminadas
✅ Permisos por defecto configurados para tablas futuras

Ahora tu aplicación debería funcionar sin errores de permisos.
*/

SELECT '✅ Permisos de Supabase configurados correctamente' as status,
       '🔓 Acceso completo habilitado para anon y authenticated' as detalle;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

/*
⚠️ ADVERTENCIA DE SEGURIDAD:

Este script otorga acceso COMPLETO a todos los usuarios (anon y authenticated).
Esto significa que:

1. ❌ Cualquier persona puede leer todos los datos
2. ❌ Cualquier persona puede insertar datos
3. ❌ Cualquier persona puede actualizar datos
4. ❌ Cualquier persona puede eliminar datos

SOLO usar esto para:
- ✓ Desarrollo local
- ✓ Prototipos
- ✓ Aplicaciones internas en redes privadas
- ✓ Demos

Para producción:
1. Implementar autenticación adecuada
2. Activar RLS
3. Crear políticas específicas por rol
4. Limitar permisos según necesidad
5. Usar HTTPS y tokens seguros
*/

