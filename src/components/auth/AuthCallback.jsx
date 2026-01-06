import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error during auth callback:', error);
        navigate('/login', { state: { error: 'No se pudo iniciar sesión. Por favor, inténtalo de nuevo.' } });
      } else if (data?.session) {
        navigate('/');
      } else {
        // If no session but no error, it means the callback didn't result in a session
        navigate('/login', { state: { error: 'No se pudo completar la autenticación. Por favor, inicia sesión.' } });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
}