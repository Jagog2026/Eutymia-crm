/**
 * Script de verificación de conexión a Supabase
 * Ejecutar con: node test_supabase_connection.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qwzdatnlfdnsxebfgjwu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3emRhdG5sZmRuc3hlYmZnand1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1ODg5NTksImV4cCI6MjA4MjE2NDk1OX0.Sv80mva2PThxNhdaRAHLxMdNArl7pa3Ff1ew_R-FTd4';

console.log('🔍 Verificando conexión a Supabase...\n');
console.log('URL:', SUPABASE_URL);
console.log('Key presente:', !!SUPABASE_ANON_KEY, '\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test 1: Verificar tabla users
console.log('📊 Test 1: Consultando tabla users...');
const { data: users, error: usersError } = await supabase
  .from('users')
  .select('email, role, active')
  .limit(3);

if (usersError) {
  console.error('❌ ERROR en tabla users:', usersError.message);
  console.error('   Código:', usersError.code);
  console.error('   Detalles:', usersError.details);

  if (usersError.message.includes('Failed to fetch') || usersError.code === 'PGRST301') {
    console.error('\n⚠️  DIAGNÓSTICO: Row Level Security (RLS) está bloqueando el acceso');
    console.error('   Solución: Ejecutar el SQL en /home/user/FIX_LOGIN_AHORA.sql');
  }
} else {
  console.log('✅ Tabla users accesible');
  console.log('   Usuarios encontrados:', users?.length || 0);
  if (users && users.length > 0) {
    console.log('   Primeros usuarios:');
    users.forEach(u => console.log(`   - ${u.email} (${u.role}) ${u.active ? '✓' : '✗'}`));
  }
}

// Test 2: Verificar usuario admin específico
console.log('\n📊 Test 2: Buscando usuario admin@admin.com...');
const { data: adminUser, error: adminError } = await supabase
  .from('users')
  .select('*')
  .eq('email', 'admin@admin.com')
  .eq('active', true)
  .single();

if (adminError) {
  console.error('❌ ERROR buscando admin:', adminError.message);
} else if (adminUser) {
  console.log('✅ Usuario admin encontrado');
  console.log('   Email:', adminUser.email);
  console.log('   Rol:', adminUser.role);
  console.log('   Activo:', adminUser.active);
  console.log('   Contraseña almacenada:', adminUser.password ? '✓ (texto plano)' : '✗');
} else {
  console.log('⚠️  Usuario admin no encontrado');
}

console.log('\n✅ Verificación completada');
