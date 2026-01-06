# 🚨 INSTRUCCIONES URGENTES - Solución del Error de Login

## ⚠️ Problema Detectado
El error `"Failed to fetch"` ocurre porque la tabla `users` tiene **Row Level Security (RLS)** habilitado, lo que bloquea todas las consultas desde el navegador.

## ✅ Solución (2 pasos simples)

### PASO 1: Ejecutar SQL en Supabase Dashboard

1. **Abre este enlace en tu navegador:**
   https://supabase.com/dashboard/project/qwzdatnlfdnsxebfgjwu/sql

2. **Copia y pega este código SQL en el editor:**

```sql
-- Deshabilitar Row Level Security en la tabla users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON users;
```

3. **Haz clic en el botón "Run" (Ejecutar)**

4. **Deberías ver el mensaje:** `Success. No rows returned`

---

### PASO 2: Probar el Login

1. **Recarga la página de tu aplicación** (F5 o Ctrl+R)

2. **Intenta iniciar sesión con estas credenciales:**

   **Opción 1 - Admin:**
   - Email: `admin@admin.com`
   - Contraseña: `adminpass`

   **Opción 2 - Administrador principal:**
   - Email: `jalberto.glezg@gmail.com`
   - Contraseña: `alcione2023`

---

## 📋 ¿Por qué ocurrió esto?

- **Row Level Security (RLS)** es una capa de seguridad de PostgreSQL/Supabase
- Cuando RLS está **habilitado**, requiere políticas específicas para permitir acceso a los datos
- Como no hay políticas configuradas, **todas las consultas son bloqueadas**
- Al **deshabilitar RLS**, las consultas funcionan normalmente

---

## 🎯 ¿Qué hace el código SQL?

1. `ALTER TABLE users DISABLE ROW LEVEL SECURITY;`
   - Desactiva la seguridad a nivel de fila en la tabla users

2. `DROP POLICY IF EXISTS ...`
   - Elimina cualquier política de seguridad que pueda existir

---

## ✅ Verificación

Después de ejecutar el SQL, los logs deberían mostrar:
```
[LOGIN] Usuario autenticado exitosamente: admin@admin.com
[LOGIN] Sesión guardada en localStorage
```

En lugar de:
```
[LOGIN] Error de autenticación: TypeError: Failed to fetch
```

---

## 📞 Si el problema persiste

1. Verifica que el SQL se haya ejecutado correctamente
2. Asegúrate de recargar la página después de ejecutar el SQL
3. Abre la consola del navegador (F12) y verifica los logs
4. Los logs deberían mostrar:
   ```
   [SUPABASE] URL correcta: https://qwzdatnlfdnsxebfgjwu.supabase.co
   ```

---

**Archivo SQL disponible en:** `/home/user/fix_rls.sql`
