# 🔧 DIAGNÓSTICO COMPLETO DEL ERROR DE LOGIN

## 📊 ANÁLISIS DE LOGS

### Errores Identificados en Console Logs:

```javascript
[LOGIN] Respuesta de Supabase: {
  "userData": null,
  "userError": {
    "code": "",
    "message": "TypeError: Failed to fetch"
  }
}

[LOGIN] Error de autenticación: TypeError: Failed to fetch
[LOGIN] Error completo: Email o contraseña incorrectos
```

### 🎯 Causa Raíz Confirmada

**Row Level Security (RLS)** está habilitado en la tabla `users`, bloqueando todas las consultas desde el navegador.

**Evidencia:**
- El último log exitoso (2026-01-05T17:43:52) muestra que cuando RLS fue deshabilitado temporalmente, el login funcionó perfectamente
- El usuario `admin@admin.com` se autenticó exitosamente cuando RLS estaba deshabilitado
- Todos los intentos previos con RLS habilitado fallaron con "Failed to fetch"

---

## ✅ SOLUCIÓN DEFINITIVA (PASO A PASO)

### 🚀 OPCIÓN 1: Ejecutar SQL Directamente (RECOMENDADO)

#### Paso 1: Abrir SQL Editor
Abre este enlace en tu navegador:
```
https://supabase.com/dashboard/project/qwzdatnlfdnsxebfgjwu/sql/new
```

#### Paso 2: Copiar y Pegar este SQL

```sql
-- =============================================
-- DESHABILITAR RLS EN TABLA USERS
-- =============================================

-- Deshabilitar Row Level Security
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas RLS existentes
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON users;
DROP POLICY IF EXISTS "Allow public read access" ON users;
DROP POLICY IF EXISTS "Allow authenticated read access" ON users;

-- Confirmar
SELECT 'RLS deshabilitado en tabla users - Login debería funcionar ahora' AS status;
```

#### Paso 3: Hacer clic en "RUN"

Verás un mensaje confirmando que el SQL se ejecutó correctamente.

#### Paso 4: Recargar la Aplicación

Presiona `Ctrl+Shift+R` (o `Cmd+Shift+R` en Mac) para hacer un hard refresh de la página.

#### Paso 5: Probar Login

Usa estas credenciales de prueba:

| Email | Contraseña |
|-------|------------|
| `admin@admin.com` | `adminpass` |
| `jalberto.glezg@gmail.com` | `alcione2023` |

---

### 🔧 OPCIÓN 2: Verificar Estado de RLS (Opcional)

Si quieres confirmar el estado actual de RLS antes de hacer cambios:

```sql
-- Verificar estado de RLS en tabla users
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'users';

-- Ver políticas RLS activas
SELECT
  schemaname,
  tablename,
  policyname,
  cmd AS operation
FROM pg_policies
WHERE tablename = 'users';
```

---

## 📝 DETALLES TÉCNICOS

### Flujo de Autenticación Actual

El sistema usa **autenticación personalizada** con la tabla `users`:

```javascript
// Login.jsx - Líneas 27-33
const { data: userData, error: userError } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .eq('password', password)  // ⚠️ Texto plano (solo para desarrollo)
  .eq('active', true)
  .single();
```

### Por Qué Falla con RLS Habilitado

1. **RLS habilitado sin políticas** → Bloquea TODAS las consultas
2. Cliente intenta hacer `SELECT` en tabla `users` → **Rechazado**
3. Supabase retorna error `Failed to fetch` → Login falla

### Por Qué Funciona con RLS Deshabilitado

1. **RLS deshabilitado** → Todas las consultas permitidas
2. Cliente hace `SELECT` en tabla `users` → **Aceptado**
3. Encuentra usuario con email/password → Login exitoso

---

## 🔍 USUARIOS EXISTENTES EN LA BASE DE DATOS

### Administradores
- ✅ **admin@admin.com** / adminpass
- ✅ **jalberto.glezg@gmail.com** / alcione2023

### Terapeutas
- ✅ **leticiacr.tanatologa@gmail.com** / leticruz01
- ✅ **alejandra.rdzloredo@gmail.com** / alejandrardz
- ✅ **romero.rg85@gmail.com** / rocioromero
- ✅ **isaiassanchezuribe@yahoo.com** / isaiassanchez

Todos los usuarios tienen:
- `active = true` (activos)
- `password` en texto plano (para desarrollo)
- `role` asignado correctamente

---

## 🎯 VERIFICACIÓN POST-SOLUCIÓN

Después de ejecutar el SQL, verifica que todo funcione:

### 1. Verificar RLS Deshabilitado
```sql
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'users';
-- Resultado esperado: rls_enabled = false
```

### 2. Probar Query Directa
```sql
SELECT email, role, active
FROM users
WHERE email = 'admin@admin.com'
  AND password = 'adminpass';
-- Resultado esperado: 1 fila con datos del admin
```

### 3. Probar Login en la Aplicación
- Abrir `/login`
- Ingresar: `admin@admin.com` / `adminpass`
- Resultado esperado: Redirección a dashboard

---

## 🚨 NOTAS DE SEGURIDAD

### ⚠️ SISTEMA ACTUAL (Desarrollo)
- Contraseñas en **texto plano** en la base de datos
- RLS **deshabilitado** (sin restricciones de acceso)
- **NO apto para producción**

### ✅ RECOMENDACIONES PARA PRODUCCIÓN

1. **Usar Supabase Auth oficial:**
   ```javascript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: email,
     password: password
   });
   ```

2. **Implementar hashing de contraseñas:**
   - Usar bcrypt o similar
   - Nunca almacenar contraseñas en texto plano

3. **Configurar RLS correctamente:**
   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can view own data"
   ON users FOR SELECT
   USING (auth.uid() = id);
   ```

---

## 📂 ARCHIVOS DE REFERENCIA

- `/home/user/FIX_LOGIN_AHORA.sql` - SQL listo para ejecutar
- `/home/user/USUARIOS_Y_CONTRASENAS.md` - Lista de credenciales
- `/src/components/auth/Login.jsx` - Componente de login
- `/src/lib/supabase.js` - Configuración de Supabase

---

## ✅ CHECKLIST FINAL

- [ ] Abrí el SQL Editor de Supabase
- [ ] Copié el SQL de arriba
- [ ] Ejecuté el SQL (botón RUN)
- [ ] Vi mensaje de confirmación
- [ ] Recargué la aplicación (Ctrl+Shift+R)
- [ ] Probé login con admin@admin.com
- [ ] **✅ LOGIN FUNCIONANDO**

---

## 🆘 SOLUCIÓN RÁPIDA SI PERSISTE EL ERROR

Si después de ejecutar el SQL el error persiste:

1. **Verificar que el SQL se ejecutó:**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename = 'users';
   ```

2. **Limpiar caché del navegador:**
   - Chrome/Edge: `Ctrl+Shift+Delete` → Borrar todo
   - Firefox: `Ctrl+Shift+Delete` → Limpiar ahora

3. **Verificar variables de entorno:**
   - Abrir DevTools (F12)
   - Console → Buscar logs de `[SUPABASE]`
   - Confirmar URL: `https://qwzdatnlfdnsxebfgjwu.supabase.co`

4. **Contactar para más ayuda:**
   - Proporciona el resultado de la query de verificación de RLS
   - Incluye los logs de la consola del navegador

---

**Última actualización:** 2026-01-05 17:47 UTC
