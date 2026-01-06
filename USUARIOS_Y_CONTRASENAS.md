# 🔐 USUARIOS Y CONTRASEÑAS DEL SISTEMA

## ✅ Usuarios Disponibles (Verificados en Base de Datos)

### 👑 ADMINISTRADORES

1. **Email:** jalberto.glezg@gmail.com
   **Contraseña:** alcione2023
   **Rol:** Admin
   **Estado:** Activo ✅

2. **Email:** admin@admin.com
   **Contraseña:** adminpass
   **Rol:** Admin
   **Estado:** Activo ✅

---

### 👨‍⚕️ TERAPEUTAS

3. **Email:** leticiacr.tanatologa@gmail.com
   **Contraseña:** leticruz01
   **Rol:** Terapeuta
   **Estado:** Activo ✅

4. **Email:** alejandra.rdzloredo@gmail.com
   **Contraseña:** alejandrardz
   **Rol:** Terapeuta
   **Estado:** Activo ✅

5. **Email:** romero.rg85@gmail.com
   **Contraseña:** rocioromero
   **Rol:** Terapeuta
   **Estado:** Activo ✅

6. **Email:** isaiassanchezuribe@yahoo.com
   **Contraseña:** isaiassanchez
   **Rol:** Terapeuta
   **Estado:** Activo ✅

---

## 🔍 PROBLEMA DETECTADO Y SOLUCIONADO

### Causa del Error
El error "Failed to fetch" ocurría porque las variables de entorno no se estaban cargando correctamente en el navegador, causando que la aplicación intentara conectarse a una URL incorrecta de Supabase.

### Solución Aplicada
Se agregaron valores de respaldo (fallback) directamente en el archivo `/src/lib/supabase.js` para asegurar que la aplicación siempre use la URL correcta:

- **URL correcta:** https://qwzdatnlfdnsxebfgjwu.supabase.co
- **Anon Key:** Configurada como fallback

---

## 🎯 CÓMO INICIAR SESIÓN

1. **Recarga la página** del navegador para que se carguen los cambios
2. Usa cualquiera de las credenciales listadas arriba
3. Ejemplo con admin:
   - Email: `admin@admin.com`
   - Contraseña: `adminpass`

---

## 📋 ACCESO AL PANEL DE ADMINISTRACIÓN

Una vez que inicies sesión con una cuenta de **administrador**, puedes acceder al panel de administración en:

**Ruta:** `/admin`

Desde ahí podrás:
- Ver todos los usuarios
- Crear nuevos usuarios
- Cambiar contraseñas
- Activar/Suspender usuarios
- Eliminar usuarios
