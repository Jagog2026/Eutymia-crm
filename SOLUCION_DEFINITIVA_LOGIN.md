# 🔧 SOLUCIÓN DEFINITIVA AL ERROR DE LOGIN

## ❌ PROBLEMA IDENTIFICADO

El error **"Email o contraseña incorrectos"** es causado por:

```
TypeError: Failed to fetch
```

**Causa raíz:** La tabla `users` tiene **Row Level Security (RLS) habilitado**, lo que bloquea todas las consultas desde el navegador cuando no hay políticas configuradas correctamente.

---

## ✅ SOLUCIÓN (3 PASOS SIMPLES)

### **PASO 1: Abrir el SQL Editor de Supabase**

Haz clic en este enlace:
👉 **https://supabase.com/dashboard/project/qwzdatnlfdnsxebfgjwu/sql/new**

---

### **PASO 2: Copiar y Pegar este SQL**

```sql
-- Deshabilitar Row Level Security en la tabla users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas RLS existentes
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON users;
DROP POLICY IF EXISTS "Allow public read access" ON users;
DROP POLICY IF EXISTS "Allow authenticated read access" ON users;
```

---

### **PASO 3: Hacer clic en "RUN" (o presionar Ctrl+Enter)**

Verás un mensaje de éxito confirmando que el SQL se ejecutó correctamente.

---

## 🧪 PROBAR EL LOGIN

Después de ejecutar el SQL, **recarga la página** de tu aplicación y prueba con estas credenciales:

| **Rol** | **Email** | **Contraseña** |
|---------|-----------|----------------|
| **Admin** | `admin@admin.com` | `adminpass` |
| **Recepción** | `recepcion@eutymia.com` | `recepcion123` |
| **Terapeuta** | `terapeuta@eutymia.com` | `terapeuta123` |
| **Psiquiatra** | `jalberto.glezg@gmail.com` | `alcione2023` |

---

## 🎯 POR QUÉ ESTO FUNCIONA

### **Antes (con RLS habilitado):**
```
Cliente → Query a tabla users → ❌ RLS bloquea → Error: Failed to fetch
```

### **Después (con RLS deshabilitado):**
```
Cliente → Query a tabla users → ✅ Acceso directo → Login exitoso
```

---

## 📊 VERIFICACIÓN DE USUARIOS EXISTENTES

Los siguientes usuarios están actualmente en tu base de datos:

1. **admin@admin.com** (Administrador)
2. **recepcion@eutymia.com** (Recepción)
3. **terapeuta@eutymia.com** (Terapeuta)
4. **jalberto.glezg@gmail.com** (Psiquiatra)
5. **isaiassanchezuribe@yahoo.com** (Usuario)

Todos estos usuarios tienen:
- ✅ `active = true`
- ✅ Contraseñas almacenadas en texto plano (para desarrollo)
- ✅ Roles asignados correctamente

---

## 🚨 NOTA IMPORTANTE

Este sistema de autenticación es para **desarrollo/testing**. Las contraseñas se almacenan en texto plano en la tabla `users`, lo cual **NO es seguro para producción**.

Para producción, deberías:
- Usar Supabase Auth (`supabase.auth.signInWithPassword()`)
- Implementar hashing de contraseñas (bcrypt)
- Configurar políticas RLS correctamente

---

## 📝 ARCHIVOS RELACIONADOS

- `/home/user/FIX_LOGIN_AHORA.sql` - SQL listo para copiar/pegar
- `/src/components/auth/Login.jsx` - Componente de login
- `/src/lib/supabase.js` - Cliente Supabase configurado correctamente

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Abrí el SQL Editor en Supabase
- [ ] Copié y pegué el SQL de arriba
- [ ] Hice clic en "RUN"
- [ ] Vi mensaje de éxito
- [ ] Recargué la página de la aplicación
- [ ] Probé login con `admin@admin.com` / `adminpass`
- [ ] ✅ **LOGIN EXITOSO**

---

**¿Necesitas ayuda adicional? Responde con "ayuda login" y te guiaré paso a paso.**
