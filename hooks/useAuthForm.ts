'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/browser';
import { registerUser } from '@/app/(auth)/actions';

export type AuthMode = 'login' | 'register';

export type AuthSuccessHandler = (mode: AuthMode, session: Session) => void;

const emptyForm = { email: '', password: '', confirmPassword: '', username: '' };

export function useAuthForm(initialMode: AuthMode, options?: { onSuccess?: AuthSuccessHandler; redirectTo?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState(emptyForm);

  const isRegister = mode === 'register';

  function changeMode(next: AuthMode, onModeChange?: (next: AuthMode) => void) {
    setMode(next);
    setError('');
    setSuccess('');
    setFormData(emptyForm);
    onModeChange?.(next);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  }

  function validate() {
    if (isRegister) {
      if (!formData.username.trim()) {
        setError('El nombre de usuario es requerido');
        return false;
      }
      if (formData.password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return false;
      }
    }
    if (!formData.email || !formData.password) {
      setError('Complete todos los campos');
      return false;
    }
    return true;
  }

  async function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const supabase = createClient();

    try {
      if (isRegister) {
        const result = await registerUser({
          email: formData.email,
          password: formData.password,
          username: formData.username || undefined,
        });

        if (!result.success) {
          throw new Error(result.message);
        }

        setSuccess(result.message);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (signInError) throw signInError;

        if (!data.session) {
          setError('No hay sesión activa');
          return;
        }

        router.refresh();
        options?.onSuccess?.('login', data.session);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setLoading(true);
    setError('');

    const supabase = createClient();

    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${options?.redirectTo ?? '/dashboard'}` },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  }

  return {
    mode,
    isRegister,
    loading,
    error,
    success,
    formData,
    changeMode,
    handleChange,
    handleSubmit,
    handleGoogleAuth
  };
}
