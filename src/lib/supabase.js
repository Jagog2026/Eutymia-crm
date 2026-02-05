import { createClient } from '@supabase/supabase-js';

// ✅ NUEVA BASE DE DATOS EUTYMIA CRM
// Proyecto: kpsoolwetgrdyglyxmhc
const SUPABASE_URL = 'https://kpsoolwetgrdyglyxmhc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwc29vbHdldGdyZHlnbHl4bWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODQ1MzksImV4cCI6MjA4MzM2MDUzOX0.ia8Dnw6r3lZ7-ProijkkzJUrTyEjSGgNJtUOWpUpalM';

console.log('[SUPABASE] Inicializando cliente Supabase');
console.log('[SUPABASE] URL correcta:', SUPABASE_URL);
console.log('[SUPABASE] Key presente:', !!SUPABASE_ANON_KEY);

// Verificar que la URL sea la correcta (API, no dashboard)
if (SUPABASE_URL.includes('/dashboard/')) {
  console.error('[SUPABASE] ERROR: URL incorrecta - usando URL del dashboard en lugar de API');
  throw new Error('URL de Supabase incorrecta');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
