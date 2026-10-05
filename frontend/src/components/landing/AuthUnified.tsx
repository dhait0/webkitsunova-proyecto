import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Card, Tabs, Flex, Grid } from '@/components/ui';
import type { AuthMode, AuthSuccessHandler } from '@/hooks/useAuthForm';
import { useAuthForm } from '@/hooks/useAuthForm';

export type { AuthSuccessHandler };

const emailIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const userIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const lockIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const confirmIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const tabsItems = [
  {
    value: 'login' as const,
    label: 'Iniciar sesión',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
      </svg>
    ),
  },
  {
    value: 'register' as const,
    label: 'Registrarse',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
];

interface AuthUnifiedProps {
  mode?: AuthMode;
  onSuccess?: AuthSuccessHandler;
  onModeChange?: (mode: AuthMode) => void;
  showModeToggle?: boolean;
  redirectTo?: string;
  className?: string;
}

export function AuthUnified({
  mode: initialMode = 'login',
  onSuccess,
  onModeChange,
  showModeToggle = true,
  redirectTo,
  className = '',
}: AuthUnifiedProps) {
  const {
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
  } = useAuthForm(initialMode, { onSuccess, redirectTo });

  const form = (
    <Grid cols={1} gap="lg" className="space-y-4">
      <Input
        name="email"
        type="email"
        label="Correo electrónico"
        placeholder="correo@ejemplo.com"
        value={formData.email}
        onChange={handleChange}
        autoComplete="email"
        required
        leftIcon={emailIcon}
      />

      {isRegister && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Input
            name="username"
            type="text"
            label="Nombre de usuario"
            placeholder="tu_usuario"
            value={formData.username}
            onChange={handleChange}
            autoComplete="username"
            required
            leftIcon={userIcon}
          />
        </motion.div>
      )}

      <Input
        name="password"
        type="password"
        label="Contraseña"
        placeholder={isRegister ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
        value={formData.password}
        onChange={handleChange}
        autoComplete={isRegister ? 'new-password' : 'current-password'}
        required
        showPasswordToggle
        leftIcon={lockIcon}
      />

      {isRegister && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Input
            name="confirmPassword"
            type="password"
            label="Confirmar contraseña"
            placeholder="Repite la contraseña"
            value={formData.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            required
            showPasswordToggle
            leftIcon={confirmIcon}
          />
        </motion.div>
      )}

      {error && (
        <motion.p
          className="text-sm text-red-400 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </motion.p>
      )}

      {success && (
        <motion.p
          className="text-sm text-emerald-300 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </motion.p>
      )}

      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="mt-2">
        {loading ? 'Procesando...' : isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
      </Button>
    </Grid>
  );

  return (
    <Card variant="auth" className={className}>
      {showModeToggle ? (
        <Tabs
          items={tabsItems}
          value={mode}
          onChange={(value) => changeMode(value as AuthMode, onModeChange)}
          variant="soft"
          fullWidth
          className="mb-6"
        >
          {() => (
            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: isRegister ? 20 : -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: isRegister ? -20 : 20, height: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                onSubmit={handleSubmit}
              >
                {form}
              </motion.form>
            </AnimatePresence>
          )}
        </Tabs>
      ) : (
        <form onSubmit={handleSubmit}>{form}</form>
      )}

      <Flex direction="col" gap="lg" className="mt-6 pt-6 border-t border-white/10">
        <Button
          variant="social"
          onClick={handleGoogleAuth}
          disabled={loading}
          leftIcon={
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          }
        >
          Continuar con Google
        </Button>

        <Button
          variant="social"
          disabled
          title="Próximamente"
          leftIcon={
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c.98-.98.98-2.57 0-3.55-.97-.98-2.56-.98-3.54 0l-.71.71c.63.63 1.47.95 2.34.95.91 0 1.77-.35 2.4-.95.63-.63.94-1.47.94-2.34s-.32-1.71-.94-2.34c-.64-.64-1.5-.95-2.41-.95-.86 0-1.7.31-2.33.94l-.71-.71c1.05-1.06 2.76-1.06 3.82 0 .99.97.99 2.56 0 3.54-.53.53-1.23.85-1.97.85-.74 0-1.45-.32-1.98-.85L17.05 20.28zM12 3.5c3.59 0 6.5 2.91 6.5 6.5s-2.91 6.5-6.5 6.5-6.5-2.91-6.5-6.5 2.91-6.5 6.5-6.5zm0 11c2.49 0 4.5-2.01 4.5-4.5S14.49 5.5 12 5.5 7.5 7.51 7.5 10s2.01 4.5 4.5 4.5z" />
            </svg>
          }
        >
          Continuar con Apple
        </Button>
      </Flex>
    </Card>
  );
}