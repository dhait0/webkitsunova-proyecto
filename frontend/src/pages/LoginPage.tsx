import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { homeForRole, roleFromSupabaseUser } from '@/lib/roles';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active && session) {
        navigate(homeForRole(roleFromSupabaseUser(session.user)), { replace: true });
      } else if (active) {
        setCheckingSession(false);
      }
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleGoogleLogin() {
    setLoading(true);
    setStatus('');

    const redirectTo = `${window.location.origin}/dashboard`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setStatus(error.message);
        setLoading(false);
        return;
      }

      if (!data.session || !data.user) {
        setStatus('No hay sesión activa');
        setLoading(false);
        return;
      }

      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const currentLevel = aalData?.currentLevel ?? 'aal1';
      const nextLevel = aalData?.nextLevel ?? null;

      if (currentLevel === 'aal1' && nextLevel === 'aal2') {
        navigate('/mfa/verify', { replace: true, state: { from: homeForRole(roleFromSupabaseUser(data.user)) } });
      } else {
        navigate(homeForRole(roleFromSupabaseUser(data.user)), { replace: true });
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (checkingSession) {
    return <div className="route-guard">Verificando sesión...</div>;
  }

  return (
    <div className="login-page">
      <Link to="/" className="back-btn" aria-label="Volver al inicio">
        ←
      </Link>

      <div className="login-layout">
        <section className="login-column">
          <div className="login-logo">
            <img src="/brand/imagotipo.png" alt="Kitsunova" />
          </div>

          <form className="login-box" onSubmit={handleSubmit}>
            <span className="eyebrow">Acceso</span>
            <h1>Accede a tus hábitos y a tu red de apoyo</h1>
            <p className="section-copy">
              Entra para revisar tu progreso, seguir tus rutinas, chatear con psicólogos y
              agendar citas desde una sola cuenta.
            </p>

            <div className="login-highlights">
              <div className="login-highlight">
                <strong>Seguimiento</strong>
                <span>Rutinas y hábitos activos</span>
              </div>
              <div className="login-highlight">
                <strong>Chat</strong>
                <span>Contacta apoyo profesional</span>
              </div>
              <div className="login-highlight">
                <strong>Citas</strong>
                <span>Escala cuando sea necesario</span>
              </div>
            </div>

            <label className="field">
              <span>Correo electrónico</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                placeholder="correo@ejemplo.com"
                required
              />
            </label>

            <label className="field">
              <span>Contraseña</span>
              <div className="password-box">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </label>

            <Link to="/#registro" className="forgot-password">
              Crear una cuenta nueva
            </Link>

            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? 'Validando...' : 'Entrar'}
            </button>

            {status ? <p className="feedback">{status}</p> : null}

            <div className="divider">
              <span />
              <p>O</p>
              <span />
            </div>

            <button
              className="social-btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              Google
            </button>
            <button className="social-btn" type="button" disabled title="Próximamente">
              Apple (próximamente)
            </button>
          </form>
        </section>

        <aside className="right-section login-hero">
          <img src="/brand/zorro-r.png" alt="Zorro Kitsunova" className="hero-image" />
          <div className="hero-text">
            <h1>
              Hábitos, chat y citas <span>cuando lo necesites</span>
            </h1>
            <p>
              Sigue tu proceso con seguimiento automatizado y apoyo profesional disponible en el
              momento adecuado.
            </p>
          </div>

          <div className="panel-stack">
            <article className="floating-panel login-panel">
              <span>Qué obtienes</span>
              <p>Un acceso limpio a tu progreso, conversaciones y agenda profesional.</p>
            </article>
            <article className="floating-panel login-panel">
              <span>Cuándo escalar</span>
              <p>Si el hábito necesita intervención humana, el sistema te dirige a un psicólogo.</p>
            </article>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default LoginPage;
