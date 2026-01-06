-- ============================================================================
-- EUTYMIA CRM - SETUP COMPLETO DE BASE DE DATOS
-- ============================================================================
-- Versión: 2024-12-24
-- Descripción: Script unificado para configurar completamente el sistema
-- 
-- Este archivo incluye:
--   1. Creación de todas las tablas
--   2. Migración de campos adicionales
--   3. Índices y optimizaciones
--   4. Funciones y triggers
--   5. Datos iniciales (usuarios y terapeutas)
--   6. Sistema de autenticación simplificado
-- ============================================================================

-- ============================================================================
-- EXTENSIONES NECESARIAS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PARTE 1: CREACIÓN DE TABLAS
-- ============================================================================

-- Tabla: Terapeutas
CREATE TABLE IF NOT EXISTS public.therapists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    specialty TEXT,
    photo_url TEXT,
    color TEXT DEFAULT '#10b981',
    role TEXT DEFAULT 'therapist',
    schedule JSONB DEFAULT '{}'::jsonb,
    services TEXT[] DEFAULT ARRAY[]::TEXT[],
    commissions JSONB DEFAULT '{}'::jsonb,
    commission_percentage NUMERIC(5,2) DEFAULT 0.00,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: Usuarios (Sistema de autenticación simplificado)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    therapist_id UUID REFERENCES public.therapists(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: Leads (Prospectos/Clientes)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    secondary_phone TEXT,
    dni TEXT,
    client_number TEXT,
    address TEXT,
    comuna TEXT,
    city TEXT,
    age INTEGER,
    gender TEXT,
    birth_date DATE,
    source TEXT,
    service TEXT,
    service_interest TEXT,
    status TEXT DEFAULT 'new',
    assigned_therapist_id UUID REFERENCES public.therapists(id) ON DELETE SET NULL,
    value NUMERIC(10,2) DEFAULT 0.00,
    notes TEXT,
    whatsapp_line TEXT,
    facebook_account TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: Tareas de Leads
CREATE TABLE IF NOT EXISTS public.lead_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: Citas
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    time TIME NOT NULL,
    end_time TIME,
    patient_name TEXT NOT NULL,
    patient_phone TEXT,
    patient_email TEXT,
    service TEXT NOT NULL,
    therapist_id UUID NOT NULL REFERENCES public.therapists(id) ON DELETE RESTRICT,
    branch TEXT,
    status TEXT DEFAULT 'pendiente',
    price NUMERIC(10,2) DEFAULT 0.00,
    payment_status TEXT DEFAULT 'pending',
    payment_date TIMESTAMPTZ,
    payment_proof_url TEXT,
    payment_method TEXT,
    estimated_value NUMERIC(10,2) DEFAULT 0.00,
    notes TEXT,
    block_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: Talleres
CREATE TABLE IF NOT EXISTS public.workshops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    therapist_id UUID REFERENCES public.therapists(id) ON DELETE SET NULL,
    type TEXT DEFAULT 'workshop',
    modality TEXT DEFAULT 'presencial',
    max_attendees INTEGER DEFAULT 20,
    current_attendees INTEGER DEFAULT 0,
    attendees INTEGER DEFAULT 0,
    price NUMERIC(10,2) DEFAULT 0.00,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: Inscripciones a Talleres
CREATE TABLE IF NOT EXISTS public.workshop_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'registered',
    payment_status TEXT DEFAULT 'pending',
    payment_amount NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workshop_id, lead_id)
);

-- Tabla: Gastos
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    category TEXT,
    type TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DESACTIVAR RLS (Row Level Security) EN TODAS LAS TABLAS
-- ============================================================================
-- IMPORTANTE: Esto permite acceso completo desde la aplicación
-- Solo para desarrollo/aplicaciones internas

-- Eliminar todas las políticas existentes (si existen)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Enable read access for all users" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Enable update for users based on email" ON public.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Desactivar RLS en todas las tablas del sistema
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 2: MIGRACIONES Y AJUSTES (Para bases de datos existentes)
-- ============================================================================

-- Hacer que 'name' sea opcional en leads (legacy)
ALTER TABLE public.leads 
ALTER COLUMN name DROP NOT NULL;

-- Migrar datos: asegurar que full_name tenga valores
UPDATE public.leads 
SET full_name = COALESCE(full_name, name, 'Sin nombre')
WHERE full_name IS NULL OR full_name = '';

-- Hacer que 'full_name' sea obligatorio
ALTER TABLE public.leads 
ALTER COLUMN full_name SET NOT NULL;

-- Agregar columnas adicionales si no existen (para importación Excel)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS dni TEXT,
ADD COLUMN IF NOT EXISTS client_number TEXT,
ADD COLUMN IF NOT EXISTS secondary_phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS comuna TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS whatsapp_line TEXT,
ADD COLUMN IF NOT EXISTS facebook_account TEXT;

-- Agregar columna password a users si no existe
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Actualizar usuarios existentes con contraseña temporal
UPDATE public.users 
SET password = 'temporal123' 
WHERE password IS NULL;

-- Hacer password obligatorio
ALTER TABLE public.users 
ALTER COLUMN password SET NOT NULL;

-- ============================================================================
-- PARTE 3: ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índices de usuarios
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(active);

-- Índices de terapeutas
CREATE INDEX IF NOT EXISTS idx_therapists_email ON public.therapists(email);
CREATE INDEX IF NOT EXISTS idx_therapists_active ON public.therapists(active);

-- Índices de leads
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_therapist ON public.leads(assigned_therapist_id);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_dni ON public.leads(dni);
CREATE INDEX IF NOT EXISTS idx_leads_client_number ON public.leads(client_number);
CREATE INDEX IF NOT EXISTS idx_leads_city ON public.leads(city);

-- Índices de tareas
CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead_id ON public.lead_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_completed ON public.lead_tasks(completed);

-- Índices de citas
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_therapist ON public.appointments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON public.appointments(payment_status);

-- Índices de talleres
CREATE INDEX IF NOT EXISTS idx_workshops_date ON public.workshops(date);
CREATE INDEX IF NOT EXISTS idx_workshops_therapist ON public.workshops(therapist_id);

-- Índices de gastos
CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON public.expenses(due_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);

-- ============================================================================
-- PARTE 4: FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at en todas las tablas
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_therapists_updated_at ON public.therapists;
CREATE TRIGGER update_therapists_updated_at BEFORE UPDATE ON public.therapists
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_tasks_updated_at ON public.lead_tasks;
CREATE TRIGGER update_lead_tasks_updated_at BEFORE UPDATE ON public.lead_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_workshops_updated_at ON public.workshops;
CREATE TRIGGER update_workshops_updated_at BEFORE UPDATE ON public.workshops
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_workshop_registrations_updated_at ON public.workshop_registrations;
CREATE TRIGGER update_workshop_registrations_updated_at BEFORE UPDATE ON public.workshop_registrations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Función para actualizar contador de asistentes a talleres
CREATE OR REPLACE FUNCTION public.update_workshop_attendees()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.workshops
        SET current_attendees = current_attendees + 1,
            attendees = attendees + 1
        WHERE id = NEW.workshop_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.workshops
        SET current_attendees = GREATEST(0, current_attendees - 1),
            attendees = GREATEST(0, attendees - 1)
        WHERE id = OLD.workshop_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_workshop_attendees_trigger ON public.workshop_registrations;
CREATE TRIGGER update_workshop_attendees_trigger
    AFTER INSERT OR DELETE ON public.workshop_registrations
    FOR EACH ROW EXECUTE FUNCTION public.update_workshop_attendees();

-- Función para marcar tareas como completadas automáticamente
CREATE OR REPLACE FUNCTION public.mark_task_completed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
        NEW.completed_at = NOW();
    ELSIF NEW.completed = false AND OLD.completed = true THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mark_task_completed_trigger ON public.lead_tasks;
CREATE TRIGGER mark_task_completed_trigger
    BEFORE UPDATE ON public.lead_tasks
    FOR EACH ROW EXECUTE FUNCTION public.mark_task_completed();

-- ============================================================================
-- PARTE 5: DATOS INICIALES
-- ============================================================================

-- Crear usuario administrador por defecto
INSERT INTO public.users (email, password, full_name, role, active)
VALUES (
    'admin@admin.com',
    'adminpass',
    'Administrador',
    'admin',
    true
)
ON CONFLICT (email) DO UPDATE
SET password = 'adminpass', role = 'admin', active = true;

-- Crear usuarios de ejemplo (opcional)
INSERT INTO public.users (email, password, full_name, role, active)
VALUES 
    ('recepcion@eutymia.com', 'recepcion123', 'Recepcionista', 'reception', true),
    ('terapeuta@eutymia.com', 'terapeuta123', 'Terapeuta Ejemplo', 'therapist', true)
ON CONFLICT (email) DO NOTHING;

-- Crear terapeutas de ejemplo
INSERT INTO public.therapists (name, email, phone, specialty, color, active, role)
VALUES 
    ('Dr. Ana García', 'ana.garcia@eutymia.com', '5551234567', 'Psicología Clínica', '#10b981', true, 'therapist'),
    ('Dr. Carlos Ruiz', 'carlos.ruiz@eutymia.com', '5557654321', 'Terapia de Pareja', '#3b82f6', true, 'therapist'),
    ('Dra. María López', 'maria.lopez@eutymia.com', '5559876543', 'Terapia Familiar', '#8b5cf6', true, 'therapist'),
    ('Dr. Jorge Martínez', 'jorge.martinez@eutymia.com', '5552223344', 'Psicología Infantil', '#f59e0b', true, 'therapist')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- PARTE 6: COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE public.users IS 'Usuarios del sistema con autenticación simplificada';
COMMENT ON COLUMN public.users.password IS 'Contraseña en texto plano (solo para desarrollo/prototipo)';
COMMENT ON COLUMN public.users.role IS 'Roles: admin, reception, therapist, user';

COMMENT ON TABLE public.therapists IS 'Terapeutas del centro';
COMMENT ON COLUMN public.therapists.schedule IS 'Horario de trabajo en formato JSON';
COMMENT ON COLUMN public.therapists.commissions IS 'Configuración de comisiones por servicio';

COMMENT ON TABLE public.leads IS 'Leads/prospectos del CRM';
COMMENT ON COLUMN public.leads.name IS 'Nombre corto (opcional, legacy)';
COMMENT ON COLUMN public.leads.full_name IS 'Nombre completo del lead (obligatorio)';
COMMENT ON COLUMN public.leads.dni IS 'DNI o RFC del cliente';
COMMENT ON COLUMN public.leads.client_number IS 'Número de cliente único';
COMMENT ON COLUMN public.leads.secondary_phone IS 'Teléfono secundario del cliente';
COMMENT ON COLUMN public.leads.address IS 'Dirección completa del cliente';
COMMENT ON COLUMN public.leads.comuna IS 'Comuna o distrito';
COMMENT ON COLUMN public.leads.city IS 'Ciudad de residencia';
COMMENT ON COLUMN public.leads.age IS 'Edad del cliente';
COMMENT ON COLUMN public.leads.gender IS 'Género del cliente (Femenino/Masculino)';
COMMENT ON COLUMN public.leads.birth_date IS 'Fecha de nacimiento del cliente';
COMMENT ON COLUMN public.leads.whatsapp_line IS 'Línea de WhatsApp por la que llegó el lead';
COMMENT ON COLUMN public.leads.facebook_account IS 'Cuenta de Facebook/Instagram/TikTok de origen';
COMMENT ON COLUMN public.leads.source IS 'Origen del lead: Facebook, Instagram, TikTok, Google Ads, Referido, etc.';
COMMENT ON COLUMN public.leads.status IS 'Estado: new, scheduled, paid, lost, partners, px_agpro, general_base';

COMMENT ON TABLE public.appointments IS 'Citas agendadas con pacientes';
COMMENT ON COLUMN public.appointments.payment_status IS 'Estado de pago: pending, paid, partial';
COMMENT ON COLUMN public.appointments.status IS 'Estado: pendiente, confirmada, completada, cancelada';

COMMENT ON TABLE public.expenses IS 'Gastos del negocio';
COMMENT ON COLUMN public.expenses.type IS 'Tipo de gasto: fixed (fijo) o variable';

-- ============================================================================
-- PARTE 7: VERIFICACIÓN Y RESUMEN
-- ============================================================================

-- Verificar usuarios creados
SELECT 
    '👤 USUARIOS' as seccion,
    COUNT(*) as total,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN active = true THEN 1 END) as activos
FROM public.users;

-- Verificar terapeutas creados
SELECT 
    '👨‍⚕️ TERAPEUTAS' as seccion,
    COUNT(*) as total,
    COUNT(CASE WHEN active = true THEN 1 END) as activos
FROM public.therapists;

-- Verificar estructura de la tabla leads
SELECT 
    '📋 ESTRUCTURA LEADS' as seccion,
    COUNT(*) as total_columnas
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'leads';

-- ============================================================================
-- CREDENCIALES DE ACCESO
-- ============================================================================

/*
╔══════════════════════════════════════════════════════════════════════════╗
║                    CREDENCIALES DE ACCESO AL SISTEMA                     ║
╚══════════════════════════════════════════════════════════════════════════╝

USUARIO ADMINISTRADOR:
  📧 Email: admin@admin.com
  🔑 Password: adminpass
  👑 Rol: admin
  ✅ Acceso completo al sistema

USUARIO RECEPCIÓN:
  📧 Email: recepcion@eutymia.com
  🔑 Password: recepcion123
  📋 Rol: reception

USUARIO TERAPEUTA:
  📧 Email: terapeuta@eutymia.com
  🔑 Password: terapeuta123
  👨‍⚕️ Rol: therapist

⚠️ IMPORTANTE: Cambia estas contraseñas después del primer login
*/

-- ============================================================================
-- NOTAS DE SEGURIDAD
-- ============================================================================

/*
⚠️ ADVERTENCIA DE SEGURIDAD:

Este sistema guarda contraseñas en TEXTO PLANO en la base de datos.
Esto es SOLO para desarrollo/prototipo.

Para producción, debes:
1. ✅ Usar bcrypt o similar para hashear contraseñas
2. ✅ Implementar tokens JWT para sesiones
3. ✅ Agregar rate limiting para prevenir ataques de fuerza bruta
4. ✅ Implementar 2FA para usuarios admin
5. ✅ Usar HTTPS en todas las conexiones

Este sistema simplificado es ideal para:
- ✓ Desarrollo local
- ✓ Prototipos
- ✓ Demos
- ✓ Aplicaciones internas pequeñas

NO usar en producción sin mejorar la seguridad.
*/

-- ============================================================================
-- FUNCIONALIDADES INCLUIDAS
-- ============================================================================

/*
✅ Sistema de autenticación simplificado
✅ Gestión de usuarios y roles
✅ Gestión de terapeutas
✅ CRM de leads/prospectos
✅ Sistema de tareas para leads
✅ Agenda de citas
✅ Gestión de talleres
✅ Control de gastos
✅ Importación/Exportación de leads en Excel
✅ Campos adicionales para datos demográficos
✅ Índices optimizados para consultas rápidas
✅ Triggers automáticos para actualización de timestamps
*/

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

SELECT '✅ ¡Base de datos Eutymia CRM configurada exitosamente!' as status,
       '🚀 Ya puedes iniciar sesión con admin@admin.com / adminpass' as siguiente_paso;

