import { createClient } from '@supabase/supabase-js';

// CRITICAL: Always use the correct Supabase API URL (not dashboard URL)
const SUPABASE_URL = 'https://qwzdatnlfdnsxebfgjwu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3emRhdG5sZmRuc3hlYmZnand1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1ODg5NTksImV4cCI6MjA4MjE2NDk1OX0.Sv80mva2PThxNhdaRAHLxMdNArl7pa3Ff1ew_R-FTd4';

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
