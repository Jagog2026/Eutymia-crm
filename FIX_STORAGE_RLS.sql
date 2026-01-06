-- ============================================
-- FIX: Deshabilitar RLS en Storage Bucket
-- ============================================
-- Este SQL corrige el error: "new row violates row-level security policy"
-- que ocurre al intentar subir comprobantes de pago.

-- 1. Eliminar todas las políticas existentes en el bucket
DROP POLICY IF EXISTS "Allow public upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "Allow public download" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated download" ON storage.objects;
DROP POLICY IF EXISTS "Enable upload for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON storage.objects;

-- 2. Crear política permisiva para el bucket 'payment-proofs'
-- Esto permite que cualquier usuario suba archivos sin restricciones de autenticación
CREATE POLICY "Allow all operations on payment-proofs"
ON storage.objects
FOR ALL
USING (bucket_id = 'payment-proofs')
WITH CHECK (bucket_id = 'payment-proofs');

-- 3. Asegurar que el bucket sea público (para poder ver las URLs públicas)
UPDATE storage.buckets
SET public = true
WHERE id = 'payment-proofs';

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Para verificar que se aplicó correctamente:
-- SELECT * FROM storage.buckets WHERE id = 'payment-proofs';
-- Debería mostrar: public = true

-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
-- Debería mostrar la política "Allow all operations on payment-proofs"
