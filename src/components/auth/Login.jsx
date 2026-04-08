import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, Loader, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isForgotPassword) {
        // Enviar email de recuperación de contraseña
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (resetError) {
          setMessage('Contacta al administrador para restablecer tu contraseña.');
        } else {
          setMessage('Se ha enviado un enlace de recuperación a tu correo electrónico.');
        }
      } else {
        console.log('[LOGIN] Intentando iniciar sesión con email:', email);

        // MÉTODO HÍBRIDO: Intentar primero con Supabase Auth, luego con tabla users
        let authSuccess = false;
        let userData = null;

        // Intento 1: Supabase Auth (usuarios nuevos con auth.users)
        try {
          console.log('[LOGIN] Intento 1: Autenticación con Supabase Auth...');
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
          });

          if (!authError && authData?.user) {
            console.log('[LOGIN] ✅ Autenticado con Supabase Auth:', authData.user.email);
            
            // Obtener información adicional del usuario desde la tabla users
            const { data: userDataFromTable, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('email', authData.user.email)
              .eq('active', true)
              .single();

            if (!userError && userDataFromTable) {
              userData = userDataFromTable;
              authSuccess = true;
              console.log('[LOGIN] ✅ Usuario válido y activo');
            } else {
              // Usuario autenticado pero no está en tabla users o no está activo
              await supabase.auth.signOut();
              console.warn('[LOGIN] Usuario autenticado pero no encontrado en tabla users o inactivo');
            }
          } else {
            console.log('[LOGIN] ⚠️ Supabase Auth falló, intentando método legacy...');
          }
        } catch (authErr) {
          console.log('[LOGIN] ⚠️ Error en Supabase Auth:', authErr.message);
        }

        // Intento 2: Método Legacy (tabla users directamente)
        if (!authSuccess) {
          console.log('[LOGIN] Intento 2: Autenticación legacy (tabla users)...');
          const { data: legacyUserData, error: legacyError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .eq('active', true)
            .single();

          if (!legacyError && legacyUserData) {
            console.log('[LOGIN] ✅ Autenticado con método legacy:', legacyUserData.email);
            userData = legacyUserData;
            authSuccess = true;

            // Guardar sesión manual en localStorage para método legacy
            localStorage.setItem('user_session', JSON.stringify({
              id: legacyUserData.id,
              email: legacyUserData.email,
              full_name: legacyUserData.full_name,
              role: legacyUserData.role,
              therapist_id: legacyUserData.therapist_id,
              timestamp: Date.now(),
              legacy_auth: true
            }));
          } else {
            console.error('[LOGIN] ❌ Método legacy falló también');
          }
        }

        // Verificar resultado final
        if (!authSuccess || !userData) {
          throw new Error('Email o contraseña incorrectos');
        }

        console.log('[LOGIN] ✅ Login exitoso, redirigiendo...');
        
        // Recargar la página para que App.jsx detecte la sesión
        window.location.href = '/';
      }
    } catch (error) {
      console.error('[LOGIN] Error completo:', error);
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-800/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative max-w-md w-full space-y-8 rounded-xl bg-white dark:bg-slate-900 p-8 shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-slate-50">
            {isForgotPassword ? 'Recuperar contraseña' : 'Iniciar sesión'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-slate-400">
            {isForgotPassword
              ? 'Ingresa tu correo para recibir un enlace de recuperación'
              : 'Ingresa tus credenciales para acceder al sistema'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 placeholder-gray-500 text-gray-900 dark:text-slate-50 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {!isForgotPassword && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="appearance-none rounded-lg relative block w-full pl-10 pr-10 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 placeholder-gray-500 text-gray-900 dark:text-slate-50 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-slate-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-slate-400" />
                  )}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              <AlertCircle className="h-5 w-5" />
              <span>{message}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                isForgotPassword 
                  ? 'Enviar enlace de recuperación' 
                  : 'Entrar'
              )}
            </button>
          </div>

          <div className="flex flex-col gap-2 text-center">
            {isForgotPassword ? (
              <button
                type="button"
                className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:text-slate-50"
                onClick={() => {
                  setIsForgotPassword(false);
                  setMessage(null);
                  setError(null);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setMessage(null);
                    setError(null);
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </>
            )}
            <p className="mt-2 text-xs text-gray-500 dark:text-slate-500">
              Los usuarios son creados por el administrador.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}