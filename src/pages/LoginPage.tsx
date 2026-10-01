import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AuthSuccessHandler } from '@/components/landing/AuthUnified';
import { supabase } from '@/lib/supabase';
import { AuthUnified } from '@/components/landing';
import { homeForRole, roleFromSupabaseUser } from '@/lib/roles';

function LoginPage() {
  const navigate = useNavigate();
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

  const handleAuthSuccess: AuthSuccessHandler = async (_mode, session) => {
    const home = homeForRole(roleFromSupabaseUser(session.user));
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const currentLevel = aalData?.currentLevel ?? 'aal1';
    const nextLevel = aalData?.nextLevel ?? null;

    if (currentLevel === 'aal1' && nextLevel === 'aal2') {
      navigate('/mfa/verify', { replace: true, state: { from: home } });
    } else {
      navigate(home, { replace: true });
    }
  };

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

          <div className="login-intro">
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
          </div>

          <div className="login-auth">
            <AuthUnified mode="login" showModeToggle onSuccess={handleAuthSuccess} />
          </div>
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
