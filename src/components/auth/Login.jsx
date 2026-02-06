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
        setMessage('Contacta al administrador para restablecer tu contraseña.');
      } else {
        console.log('[LOGIN] Intentando iniciar sesión con email:', email);

        // Validar usuario contra la tabla users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .eq('active', true)
          .single();

        console.log('[LOGIN] Respuesta de Supabase:', { userData, userError });

        if (userError) {
          console.error('[LOGIN] Error de autenticación:', userError);

          // Detectar error de conexión
          if (userError.message.includes('Failed to fetch') || userError.message.includes('fetch')) {
            throw new Error('Error de conexión con la base de datos. Por favor, verifica que RLS esté deshabilitado en la tabla users.');
          }

          // Otros errores
          throw new Error('Email o contraseña incorrectos');
        }

        if (!userData) {
          console.error('[LOGIN] Usuario no encontrado o credenciales incorrectas');
          throw new Error('Email o contraseña incorrectos');
        }

        console.log('[LOGIN] Usuario autenticado exitosamente:', userData.email);

        // Guardar sesión en localStorage
        localStorage.setItem('user_session', JSON.stringify({
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          therapist_id: userData.therapist_id,
          timestamp: Date.now()
        }));

        console.log('[LOGIN] Sesión guardada en localStorage');

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative max-w-md w-full space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isForgotPassword ? 'Recuperar contraseña' : 'Iniciar sesión'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
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
                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-2 border border-gray-300 bg-white placeholder-gray-500 text-gray-900 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
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
                  className="appearance-none rounded-lg relative block w-full pl-10 pr-10 px-3 py-2 border border-gray-300 bg-white placeholder-gray-500 text-gray-900 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
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
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
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
                className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
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
            <p className="mt-2 text-xs text-gray-500">
              Los usuarios son creados por el administrador.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}