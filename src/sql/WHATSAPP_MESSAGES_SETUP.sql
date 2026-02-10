-- ============================================================================
-- EUTYMIA CRM - WHATSAPP MESSAGES TABLE
-- ============================================================================
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- Tabla: Mensajes de WhatsApp
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    whatsapp_id TEXT,                    -- ID del mensaje en WhatsApp
    content TEXT,                        -- Texto del mensaje
    media_url TEXT,                      -- URL de imagen/audio/video si aplica
    media_type TEXT,                     -- 'image', 'audio', 'video', 'document'
    direction TEXT NOT NULL DEFAULT 'inbound',  -- 'inbound' | 'outbound'
    status TEXT DEFAULT 'received',      -- 'received', 'sent', 'delivered', 'read', 'failed'
    message_type TEXT DEFAULT 'text',    -- 'text', 'image', 'audio', 'video', 'document', 'template'
    metadata JSONB DEFAULT '{}'::jsonb,  -- Datos adicionales (template info, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON public.messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON public.messages(direction);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_id ON public.messages(whatsapp_id);

-- Agregar campo business_portfolio a leads si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'business_portfolio'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN business_portfolio TEXT DEFAULT 'general';
    END IF;
END $$;

-- Agregar campo last_message_at a leads para ordenar conversaciones
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'last_message_at'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN last_message_at TIMESTAMPTZ;
    END IF;
END $$;

-- Agregar campo unread_count a leads
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'unread_count'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN unread_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Trigger: Actualizar last_message_at del lead cuando llega un mensaje
CREATE OR REPLACE FUNCTION update_lead_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.leads
    SET 
        last_message_at = NEW.created_at,
        unread_count = CASE 
            WHEN NEW.direction = 'inbound' THEN COALESCE(unread_count, 0) + 1
            ELSE unread_count
        END,
        updated_at = NOW()
    WHERE id = NEW.lead_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lead_last_message ON public.messages;
CREATE TRIGGER trigger_update_lead_last_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_last_message();

-- Habilitar Realtime para mensajes
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- RLS (Row Level Security)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Eliminar policies anteriores si existen
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.messages;
DROP POLICY IF EXISTS "Allow all for anon" ON public.messages;
DROP POLICY IF EXISTS "Allow all access to messages" ON public.messages;

-- Política que permite acceso total (anon + authenticated)
CREATE POLICY "Allow all access to messages" ON public.messages
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
