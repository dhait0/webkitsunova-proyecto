import { useState } from 'react';
import type { AuthMode, AuthSuccessHandler } from '@/hooks/useAuthForm';
import { useAuthForm } from '@/hooks/useAuthForm';

const EyeIcon = ({ off }: { off: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
    {off ? (
      <>
        <path d="M3 3l18 18" strokeLinecap="round" />
        <path d="M10.6 10.6a2 2 0 002.8 2.8" strokeLinecap="round" />
        <path d="M9.4 5.3A9.6 9.6 0 0112 5c5 0 9 4.5 9 7a12 12 0 01-2.4 3.6M6.3 6.8C4 8.3 3 10.4 3 12c0 2.5 4 7 9 7a9.7 9.7 0 003.5-.6" strokeLinecap="round" />
      </>
    ) : (
      <>
        <path d="M3 12c0-2.5 4-7 9-7s9 4.5 9 7-4 7-9 7-9-4.5-9-7z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" strokeLinecap="round" />
      </>
    )}
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
      clipRule="evenodd"
    />
  </svg>
);

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AppleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.05 20.28c.98-.98.98-2.57 0-3.55-.97-.98-2.56-.98-3.54 0l-.71.71c.63.63 1.47.95 2.34.95.91 0 1.77-.35 2.4-.95.63-.63.94-1.47.94-2.34s-.32-1.71-.94-2.34c-.64-.64-1.5-.95-2.41-.95-.86 0-1.7.31-2.33.94l-.71-.71c1.05-1.06 2.76-1.06 3.82 0 .99.97.99 2.56 0 3.54-.53.53-1.23.85-1.97.85-.74 0-1.45-.32-1.98-.85L17.05 20.28zM12 3.5c3.59 0 6.5 2.91 6.5 6.5s-2.91 6.5-6.5 6.5-6.5-2.91-6.5-6.5 2.91-6.5 6.5-6.5zm0 11c2.49 0 4.5-2.01 4.5-4.5S14.49 5.5 12 5.5 7.5 7.51 7.5 10s2.01 4.5 4.5 4.5z" />
  </svg>
);

interface FieldRegisterProps {
  initialMode?: AuthMode;
  onSuccess?: AuthSuccessHandler;
  redirectTo?: string;
}

export function FieldRegister({ initialMode = 'register', onSuccess, redirectTo }: FieldRegisterProps) {
  const [revealed, setRevealed] = useState(false);
  const {
    isRegister,
    loading,
    error,
    success,
    formData,
    changeMode,
    handleChange,
    handleSubmit,
    handleGoogleAuth
  } = useAuthForm(initialMode, { onSuccess, redirectTo });

  return (
    <section id="registro" className="kb-register" aria-labelledby="registro-titulo">
      <div className="kb-register__head">
        <h2 id="registro-titulo">{isRegister ? 'Crear mi cuenta' : 'Entrar a mi cuenta'}</h2>
        <span className="kb-label">Gratis</span>
      </div>

      <div className="kb-modes" role="tablist" aria-label="Modo del formulario">
        <button type="button" role="tab" aria-selected={isRegister} onClick={() => changeMode('register')}>
          Crear cuenta
        </button>
        <button type="button" role="tab" aria-selected={!isRegister} onClick={() => changeMode('login')}>
          Iniciar sesión
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <label className="kb-field">
          <span>Correo electrónico</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="correo@ejemplo.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>

        {isRegister && (
          <label className="kb-field">
            <span>Nombre de usuario</span>
            <input
              type="text"
              name="username"
              autoComplete="username"
              placeholder="tu_usuario"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </label>
        )}

        <div className="kb-field">
          <span id="kb-password-label">Contraseña</span>
          <div className="kb-field__row">
            <input
              type={revealed ? 'text' : 'password'}
              name="password"
              aria-labelledby="kb-password-label"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              placeholder={isRegister ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="kb-reveal"
              onClick={() => setRevealed((prev) => !prev)}
              aria-pressed={revealed}
              aria-label={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <EyeIcon off={revealed} />
            </button>
          </div>
        </div>

        {isRegister && (
          <label className="kb-field">
            <span>Confirmar contraseña</span>
            <input
              type={revealed ? 'text' : 'password'}
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </label>
        )}

        {error && (
          <p className="kb-note kb-note--error" role="alert">
            <AlertIcon />
            <span>{error}</span>
          </p>
        )}

        {success && (
          <p className="kb-note kb-note--ok" role="status">
            <CheckIcon />
            <span>{success}</span>
          </p>
        )}

        <button type="submit" className="kb-btn kb-btn--accent" disabled={loading}>
          {loading ? 'Procesando…' : isRegister ? 'Crear mi cuenta' : 'Entrar'}
        </button>
      </form>

      <p className="kb-alt">o</p>

      <button type="button" className="kb-btn kb-btn--quiet" onClick={handleGoogleAuth} disabled={loading}>
        <GoogleIcon />
        Continuar con Google
      </button>

      <button type="button" className="kb-btn kb-btn--quiet" disabled title="Próximamente">
        <AppleIcon />
        Continuar con Apple
      </button>
    </section>
  );
}