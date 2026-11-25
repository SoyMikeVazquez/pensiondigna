-- ==============================================================================
-- SCHEMA SUPABASE: PORTAL DE RECEPCIÓN DE DOCUMENTOS DE PENSIÓN (IMSS / ISSSTE)
-- ==============================================================================
-- Ejecuta este script en el Editor SQL de tu proyecto en Supabase (SQL Editor > New query).

-- 1. Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crear tabla de solicitudes
CREATE TABLE IF NOT EXISTS public.solicitudes_pension (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Datos del Solicitante
    nombre_completo TEXT NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    nss VARCHAR(15),
    
    -- Información Institucional
    institucion VARCHAR(10) NOT NULL CHECK (institucion IN ('IMSS', 'ISSSTE')),
    regimen_ley TEXT NOT NULL, -- 'Ley 73', 'Ley 97', 'Décimo Transitorio', 'Cuentas Individuales'
    modalidad TEXT,
    
    -- Documentos (URLs en el bucket general de Supabase Storage)
    ine_frente_url TEXT,
    ine_reverso_url TEXT,
    comprobante_bancario_url TEXT,
    
    -- Estado y notas
    notas TEXT,
    estado VARCHAR(30) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'contactado', 'aprobado', 'rechazado', 'completado'))
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_solicitudes_institucion ON public.solicitudes_pension (institucion);
CREATE INDEX IF NOT EXISTS idx_solicitudes_created_at ON public.solicitudes_pension (created_at DESC);

-- ¡IMPORTANTE! Otorgar permisos a los roles de Supabase (anon y authenticated)
GRANT ALL ON TABLE public.solicitudes_pension TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.solicitudes_pension ENABLE ROW LEVEL SECURITY;

-- Políticas de la tabla solicitudes_pension
DROP POLICY IF EXISTS "Permitir inserción pública de solicitudes" ON public.solicitudes_pension;
CREATE POLICY "Permitir inserción pública de solicitudes"
ON public.solicitudes_pension
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de solicitudes" ON public.solicitudes_pension;
CREATE POLICY "Permitir lectura de solicitudes"
ON public.solicitudes_pension
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir actualización a usuarios autenticados" ON public.solicitudes_pension;
CREATE POLICY "Permitir actualización a usuarios autenticados"
ON public.solicitudes_pension
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir eliminación a usuarios autenticados" ON public.solicitudes_pension;
CREATE POLICY "Permitir eliminación a usuarios autenticados"
ON public.solicitudes_pension
FOR DELETE
TO authenticated
USING (true);

-- ==============================================================================
-- 3. Configuración del Bucket 'general' en Supabase Storage
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('general', 'general', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Permitir subida a bucket general" ON storage.objects;
CREATE POLICY "Permitir subida a bucket general"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'general');

DROP POLICY IF EXISTS "Permitir lectura en bucket general" ON storage.objects;
CREATE POLICY "Permitir lectura en bucket general"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'general');

DROP POLICY IF EXISTS "Permitir eliminación en bucket general" ON storage.objects;
CREATE POLICY "Permitir eliminación en bucket general"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'general');
