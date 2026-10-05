import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AuthSuccessHandler } from '@/hooks/useAuthForm';
import { supabase } from '@/lib/supabase';
import { FieldRegister } from '@/components/landing/FieldRegister';
import { FoxFigure } from '@/components/landing/FoxFigure';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { loginPage } from '@/content/siteContent';
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
    return (
      <div className="kb-root">
        <div className="kb-shell" style={{ padding: '100px 0', textAlign: 'center' }}>
          <p className="kb-body">Verificando sesión…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kb-root">
      <a className="kb-skip" href="#registro">
        {loginPage.backLabel}
      </a>

      <PublicHeader showSections={false} />

      <main>
        <section className="kb-shell kb-cover" aria-labelledby="login-titulo">
          <div className="kb-cover__form">
            <FieldRegister initialMode="login" onSuccess={handleAuthSuccess} />
          </div>

          <div className="kb-cover__stage">
            <div className="kb-cover__type">
              <h1 className="kb-display" id="login-titulo">
                {loginPage.heroTitle} <span>{loginPage.heroSpan}</span>
              </h1>
              <p className="kb-body kb-cover__copy">{loginPage.heroCopy}</p>
            </div>

            <FoxFigure className="kb-foxfigure" />
          </div>
        </section>

        <section className="kb-shell" aria-label="Qué obtienes en Kitsunova">
          <div className="kb-card">
          <div className="kb-card__head">
            <h2 className="kb-heading" id="login-acceso-titulo">
              {loginPage.headline}
            </h2>
            <p className="kb-body">{loginPage.lede}</p>
          </div>

            <div className="kb-columns">
              {loginPage.highlights.map((highlight) => (
                <div className="kb-col" key={highlight.strong}>
                  <h3 className="kb-subhead">{highlight.strong}</h3>
                  <p>{highlight.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter showSectionLinks={false} />
    </div>
  );
}

export default LoginPage;
